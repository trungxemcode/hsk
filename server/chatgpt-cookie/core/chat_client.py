# File: core/chat_client.py
import json
import uuid
import asyncio
from typing import Optional
from .session_manager import ChatGPTSessionManager, AsyncSession


class ChatGPTClient:
    def __init__(self, session_manager: ChatGPTSessionManager):
        self.sm = session_manager
        self.api_url = f"{self.sm.base_url}/backend-api/conversation"
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

    async def send_stateless_message(
        self,
        prompt: str,
        model: str = "gpt-4o-mini",
        session_token: Optional[str] = None
    ) -> dict:
        """
        Gửi tin nhắn hoàn toàn độc lập (Stateless) và tự động xóa lịch sử nếu có.
        """
        sm, lock = self._resolve_session(session_token)
        async with lock:
            access_token = await sm.get_valid_access_token()
            headers = sm._get_headers(include_auth=True, access_token=access_token)
            headers["Accept"] = "text/event-stream"

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
                "model": model or "gpt-4o-mini",
                "timezone_offset_min": -420,
                # QUAN TRỌNG: Tắt lưu lịch sử và tắt tự huấn luyện để chống loãng AI
                "history_and_training_disabled": True,
            }

            if AsyncSession is None:
                raise RuntimeError("Thư viện curl_cffi chưa được cài đặt.")

            async with AsyncSession(impersonate="chrome120") as session:
                response = await session.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=60
                )

                if response.status_code != 200:
                    raise Exception(
                        f"Lỗi gọi ChatGPT API ({response.status_code}): {response.text[:200]}"
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
            async with AsyncSession(impersonate="chrome120") as session:
                await session.patch(
                    f"{self.api_url}/{conversation_id}",
                    headers=headers,
                    json={"is_visible": False},
                    timeout=15
                )
        except Exception:
            pass

    def _parse_sse_response(self, raw_sse: str) -> dict:
        """Bóc tách luồng dữ liệu Server-Sent Events (SSE) từ ChatGPT"""
        full_text = ""
        conv_id = None
        msg_id = None

        for line in raw_sse.split("\n"):
            line = line.strip()
            if not line.startswith("data: "):
                continue
            data_str = line[6:].strip()
            if data_str == "[DONE]":
                break
            try:
                data = json.loads(data_str)
                message = data.get("message") or {}
                if (message.get("author") or {}).get("role") == "assistant":
                    parts = (message.get("content") or {}).get("parts") or []
                    if parts and isinstance(parts[0], str):
                        full_text = parts[0]
                    msg_id = message.get("id") or msg_id
                    conv_id = data.get("conversation_id") or conv_id
            except json.JSONDecodeError:
                continue

        return {
            "reply": full_text,
            "conversation_id": conv_id,
            "message_id": msg_id
        }
