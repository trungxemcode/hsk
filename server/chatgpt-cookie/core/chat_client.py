# File: core/chat_client.py
import json
import uuid
import asyncio
from typing import Optional
from .session_manager import ChatGPTSessionManager, ChatGPTUpstreamError, AsyncSession


class ChatGPTClient:
    def __init__(self, session_manager: ChatGPTSessionManager):
        self.sm = session_manager
        self.api_url = f"{self.sm.base_url}/backend-api/conversation"
        self.frontend_api_url = f"{self.sm.base_url}/backend-api/f/conversation"
        # Khóa đồng bộ chống 2 request dùng chung 1 Cookie gọi chồng chéo cùng lúc
        self.lock = asyncio.Lock()
        self._custom_sessions: dict[str, tuple[ChatGPTSessionManager, asyncio.Lock]] = {}

    def _resolve_session(self, override_token: Optional[str] = None) -> tuple[ChatGPTSessionManager, asyncio.Lock]:
        token = (override_token or "").strip()
        if not token or token == self.sm.session_token:
            return self.sm, self.lock
        if token not in self._custom_sessions:
            if len(self._custom_sessions) >= 128:
                oldest_key = next(iter(self._custom_sessions))
                self._custom_sessions.pop(oldest_key, None)
            self._custom_sessions[token] = (
                ChatGPTSessionManager(token, base_url=self.sm.base_url),
                asyncio.Lock()
            )
        return self._custom_sessions[token]

    def _get_session_manager(self, override_token: Optional[str] = None) -> ChatGPTSessionManager:
        sm, _ = self._resolve_session(override_token)
        return sm

    @staticmethod
    def _parse_upstream_error(raw_text: str) -> tuple[str, str]:
        text = (raw_text or "").strip()
        if not text:
            return "", ""
        try:
            data = json.loads(text)
            if not isinstance(data, dict):
                return text[:240], ""
            raw_detail = data.get("detail")
            if isinstance(raw_detail, str):
                detail = raw_detail
                code = ""
            elif isinstance(raw_detail, dict):
                detail = str(raw_detail.get("message") or "")
                code = str(raw_detail.get("code") or "")
            else:
                err = data.get("error") if isinstance(data.get("error"), dict) else {}
                detail = str(err.get("message") or data.get("message") or "")
                code = str(err.get("code") or data.get("code") or "")
            return detail.strip()[:240], code.strip()[:80]
        except Exception:
            return text[:240], ""

    @staticmethod
    def _is_model_not_found(status: int, detail: str, code: str) -> bool:
        if status not in (400, 404):
            return False
        hay = f"{code} {detail}".lower()
        return any(
            marker in hay
            for marker in (
                "model_not_found",
                "model not found",
                "does not exist",
                "invalid_model",
                "not supported",
                "do not have access",
            )
        )

    @staticmethod
    def _is_cloudflare_challenge(response) -> bool:
        if response.headers.get("cf-mitigated") == "challenge":
            return True
        if response.status_code not in (403, 503):
            return False
        low = (response.text or "").lower()
        return any(
            marker in low
            for marker in ("just a moment", "cf-turnstile", "challenge-platform", "__cf_chl_")
        )

    async def send_stateless_message(
        self,
        prompt: str,
        model: str = "gpt-4o-mini",
        session_token: Optional[str] = None
    ) -> dict:
        """
        Gửi tin nhắn hoàn toàn độc lập (Stateless) kèm Cookie phiên + Sentinel Proof-of-Work
        và tự động xóa lịch sử nếu có.
        """
        sm, lock = self._resolve_session(session_token)
        async with lock:
            if AsyncSession is None:
                raise RuntimeError("Thư viện curl_cffi chưa được cài đặt.")

            active_url = self.api_url
            active_model = model or "gpt-4o-mini"
            retried_auth = False
            retried_model = False
            retried_endpoint = False

            async with AsyncSession(impersonate="chrome120", cookies=sm.get_cookies(), proxies=sm.get_proxies()) as session:
                while True:
                    access_token = await sm.get_valid_access_token()
                    payload = {
                        "action": "next",
                        "messages": [
                            {
                                "id": str(uuid.uuid4()),
                                "author": {"role": "user"},
                                "content": {"content_type": "text", "parts": [prompt]},
                            }
                        ],
                        "parent_message_id": str(uuid.uuid4()),
                        "model": active_model,
                        "timezone_offset_min": -420,
                        "conversation_mode": {"kind": "primary_assistant"},
                        "websocket_request_id": str(uuid.uuid4()),
                        # QUAN TRỌNG: Tắt lưu lịch sử và tắt tự huấn luyện để chống loãng AI
                        "history_and_training_disabled": True,
                    }

                    sentinel_headers = await sm.get_sentinel_headers(session, access_token)
                    headers = {
                        **sm._get_headers(include_auth=True, access_token=access_token),
                        **sentinel_headers,
                        "Accept": "text/event-stream",
                    }
                    response = await session.post(
                        active_url,
                        headers=headers,
                        json=payload,
                        timeout=60,
                        allow_redirects=False
                    )
                    sm.update_cookies(getattr(session, "cookies", None))

                    if response.status_code == 401 and not retried_auth:
                        retried_auth = True
                        sm.invalidate_access_token()
                        continue

                    if response.status_code != 200:
                        challenge = self._is_cloudflare_challenge(response)
                        detail_msg, detail_code = self._parse_upstream_error(response.text)
                        model_missing = not challenge and self._is_model_not_found(
                            response.status_code, detail_msg, detail_code
                        )
                        route_missing = (
                            not challenge
                            and not model_missing
                            and response.status_code in (404, 405)
                            and active_url == self.api_url
                        )
                        if model_missing and active_model != "auto" and not retried_model:
                            retried_model = True
                            active_model = "auto"
                            continue
                        if route_missing and not retried_endpoint:
                            retried_endpoint = True
                            active_url = self.frontend_api_url
                            continue

                        raise ChatGPTUpstreamError(
                            "conversation",
                            response.status_code,
                            challenge,
                            detail_message=detail_msg,
                            detail_code=detail_code,
                        )

                    result = self._parse_sse_response(response.text)

                    # Nếu hệ thống vẫn sinh ra conversation_id, xóa ngầm ngay lập tức
                    if result.get("conversation_id"):
                        asyncio.create_task(self.delete_conversation(result["conversation_id"], sm))

                    return result

    async def delete_conversation(
        self,
        conversation_id: str,
        sm: Optional[ChatGPTSessionManager] = None
    ):
        """Xóa cuộc hội thoại khỏi tài khoản ChatGPT Web để giữ sạch tài khoản"""
        target_sm = sm or self.sm
        try:
            access_token = await target_sm.get_valid_access_token()
            headers = target_sm._get_headers(include_auth=True, access_token=access_token)
            if AsyncSession is None:
                return
            async with AsyncSession(impersonate="chrome120", cookies=target_sm.get_cookies(), proxies=target_sm.get_proxies()) as session:
                await session.patch(
                    f"{self.api_url}/{conversation_id}",
                    headers=headers,
                    json={"is_visible": False},
                    timeout=15
                )
        except Exception:
            pass

    @staticmethod
    def _is_visible_assistant_message(message: dict) -> bool:
        if not isinstance(message, dict):
            return False
        if (message.get("author") or {}).get("role") != "assistant":
            return False
        content_type = str((message.get("content") or {}).get("content_type") or "text").lower()
        if content_type not in ("text", "multimodal_text"):
            return False
        recipient = str(message.get("recipient") or "all").lower()
        return recipient == "all"

    @staticmethod
    def _extract_parts_text(parts) -> str:
        if not isinstance(parts, list):
            return ""
        return "".join(p for p in parts if isinstance(p, str))

    def _parse_sse_response(self, raw_sse: str) -> dict:
        """Bóc tách luồng dữ liệu Server-Sent Events (SSE) từ ChatGPT (cả legacy và delta_encoding v1)."""
        full_text = ""
        conv_id = None
        msg_id = None

        active_visible = False
        has_message_header = False
        active_role: Optional[str] = None
        active_content_type = "text"
        active_recipient = "all"
        current_delta_text = ""
        last_path = ""
        last_op = ""

        def sync_visibility():
            nonlocal active_visible
            active_visible = (
                (active_role == "assistant" or (not has_message_header and active_role is None))
                and (active_content_type in ("text", "multimodal_text", ""))
                and (active_recipient in ("all", ""))
            )

        def apply_patch_op(op_obj: dict):
            nonlocal full_text, current_delta_text, last_path, last_op
            nonlocal active_role, active_content_type, active_recipient, has_message_header
            if not isinstance(op_obj, dict):
                return
            if isinstance(op_obj.get("p"), str):
                last_path = op_obj["p"]
            if isinstance(op_obj.get("o"), str):
                last_op = op_obj["o"]
            path = op_obj.get("p") if isinstance(op_obj.get("p"), str) else last_path
            op = op_obj.get("o") if isinstance(op_obj.get("o"), str) else last_op
            val = op_obj.get("v")

            if path == "/message/content/content_type" and isinstance(val, str):
                active_content_type = val.lower()
                sync_visibility()
                return
            if path == "/message/recipient" and isinstance(val, str):
                active_recipient = val.lower()
                sync_visibility()
                return
            if path == "/message/author/role" and isinstance(val, str):
                active_role = val.lower()
                has_message_header = True
                sync_visibility()
                return
            if not active_visible:
                return
            if path in ("/message/content/parts/0", "/message/content/parts"):
                if op == "append" and isinstance(val, str):
                    current_delta_text += val
                    if current_delta_text:
                        full_text = current_delta_text
                elif op in ("replace", "add"):
                    next_text = val if isinstance(val, str) else self._extract_parts_text(val)
                    if next_text:
                        current_delta_text = next_text
                        full_text = current_delta_text

        saw_data_line = False
        for raw_line in str(raw_sse or "").split("\n"):
            line = raw_line.strip()
            if not line.startswith("data:"):
                continue
            saw_data_line = True
            data_str = line[5:].strip()
            if not data_str or data_str == "[DONE]":
                break
            try:
                data = json.loads(data_str)
            except json.JSONDecodeError:
                continue
            if not isinstance(data, dict):
                continue

            if isinstance(data.get("conversation_id"), str) and data["conversation_id"]:
                conv_id = data["conversation_id"]
            v_obj = data.get("v")
            if isinstance(v_obj, dict) and isinstance(v_obj.get("conversation_id"), str) and v_obj["conversation_id"]:
                conv_id = v_obj["conversation_id"]

            # Legacy SSE format
            if isinstance(data.get("message"), dict):
                message = data["message"]
                if self._is_visible_assistant_message(message):
                    text = self._extract_parts_text((message.get("content") or {}).get("parts"))
                    if text:
                        full_text = text
                    msg_id = message.get("id") or msg_id
                continue

            # delta_encoding v1 initial message object
            if isinstance(v_obj, dict) and isinstance(v_obj.get("message"), dict):
                m = v_obj["message"]
                has_message_header = True
                active_role = str((m.get("author") or {}).get("role") or "").lower() or None
                active_content_type = str((m.get("content") or {}).get("content_type") or "text").lower()
                active_recipient = str(m.get("recipient") or "all").lower()
                sync_visibility()
                last_path = ""
                last_op = ""
                if active_visible:
                    msg_id = m.get("id") or msg_id
                    initial = self._extract_parts_text((m.get("content") or {}).get("parts"))
                    current_delta_text = initial
                    if initial:
                        full_text = initial
                else:
                    current_delta_text = ""
                continue

            # delta_encoding v1 batch patch
            if data.get("o") == "patch" and isinstance(v_obj, list):
                for item in v_obj:
                    apply_patch_op(item)
                continue

            # delta_encoding v1 single patch or shorthand continuation
            if isinstance(data.get("p"), str) or isinstance(data.get("o"), str) or isinstance(v_obj, str):
                apply_patch_op(data)

        if not saw_data_line and str(raw_sse or "").strip().startswith("{"):
            try:
                parsed = json.loads(str(raw_sse).strip())
                if isinstance(parsed, dict):
                    if isinstance(parsed.get("conversation_id"), str):
                        conv_id = parsed["conversation_id"]
                    if isinstance(parsed.get("message"), dict) and self._is_visible_assistant_message(parsed["message"]):
                        text = self._extract_parts_text((parsed["message"].get("content") or {}).get("parts"))
                        if text:
                            full_text = text
                        msg_id = parsed["message"].get("id") or msg_id
            except Exception:
                pass

        return {
            "reply": full_text,
            "conversation_id": conv_id,
            "message_id": msg_id
        }
