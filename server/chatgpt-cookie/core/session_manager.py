# File: core/session_manager.py
import base64
import hashlib
import json
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

try:
    from curl_cffi.requests import AsyncSession
except ImportError:  # pragma: no cover - fallback when curl_cffi is not installed in test env
    AsyncSession = None

CHROME120_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
NEXTAUTH_COOKIE_NAME = "__Secure-next-auth.session-token"
NEXTAUTH_CHUNK_SIZE = 3967


class ChatGPTUpstreamError(Exception):
    def __init__(self, stage: str, status: int, challenge: bool = False):
        self.stage = stage
        self.status = status
        self.challenge = challenge
        super().__init__(f"ChatGPT {stage}: HTTP {status}")


def solve_sentinel_pow(
    seed: str,
    difficulty: str,
    user_agent: str = CHROME120_UA,
    max_iter: int = 200000,
) -> str:
    """Giải bài toán SHA3-512 Proof-of-Work cho OpenAI-Sentinel-Proof-Token."""
    seed_str = str(seed or "")
    diff_str = str(difficulty or "0fffff").lower()
    diff_len = len(diff_str)
    now_str = datetime.now(timezone.utc).strftime(
        "%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)"
    )
    cfg = [
        3000,
        now_str,
        4294705152,
        0,
        user_agent,
        "",
        "dpl=prod-ef8ce37525ba1a162ceab4c68de6dc4f2f8ef8a2",
        "vi-VN",
        "vi-VN,vi,en-US,en",
        0,
        "webdriver−false",
        "location",
        "Object",
        round(random.uniform(100, 5000), 1),
        str(uuid.uuid4()),
        "",
        8,
        int(time.time() * 1000) - 5000,
    ]
    prefix = json.dumps(cfg[:3], separators=(",", ":"))[:-1] + ","
    middle = "," + json.dumps(cfg[4:9], separators=(",", ":"))[1:-1] + ","
    suffix = "," + json.dumps(cfg[10:], separators=(",", ":"))[1:]
    seed_bytes = seed_str.encode("utf-8")

    for i in range(max_iter):
        s_i = str(i)
        raw_json = f"{prefix}{s_i}{middle}{s_i}{suffix}"
        b64 = base64.b64encode(raw_json.encode("utf-8"))
        digest = hashlib.sha3_512(seed_bytes + b64).hexdigest()
        if digest[:diff_len] <= diff_str:
            return "gAAAAAB" + b64.decode("ascii")

    fallback = base64.b64encode(f'"{seed_str}"'.encode("utf-8")).decode("ascii")
    return "gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D" + fallback


def parse_session_cookies(raw_token: str) -> dict[str, str]:
    """Chuẩn hóa chuỗi Cookie (đơn, ghép bằng '|', tự chia mảnh >3967 ký tự, hoặc nguyên dòng Cookie header)."""
    token = (raw_token or "").strip()
    if not token or token == "YOUR_SESSION_TOKEN_HERE":
        raise ValueError("Chưa cấu hình Cookie __Secure-next-auth.session-token.")

    # Hỗ trợ dán nguyên chuỗi Cookie header từ DevTools Network (ví dụ: a=1; b=2)
    if ";" in token and "=" in token:
        cookies: dict[str, str] = {}
        for pair in token.split(";"):
            part = pair.strip()
            if not part or "=" not in part:
                continue
            k, v = part.split("=", 1)
            k, v = k.strip(), v.strip()
            if not k or not v or any(c.isspace() or c in ';,"\\' for c in v):
                raise ValueError("Định dạng Cookie ChatGPT không hợp lệ.")
            cookies[k] = v
        if not any(k.startswith(NEXTAUTH_COOKIE_NAME) or k == "oai-sc" for k in cookies):
            raise ValueError("Định dạng Cookie ChatGPT không hợp lệ.")
        return cookies

    if "|" in token:
        parts = token.split("|")
    elif len(token) > 4000:
        parts = [
            token[i : i + NEXTAUTH_CHUNK_SIZE]
            for i in range(0, len(token), NEXTAUTH_CHUNK_SIZE)
        ]
    else:
        parts = [token]

    if any(not part or any(char.isspace() or char in ';,"\\' for char in part) for part in parts):
        raise ValueError("Định dạng Cookie ChatGPT không hợp lệ.")

    return {
        (f"{NEXTAUTH_COOKIE_NAME}.{index}" if len(parts) > 1 else NEXTAUTH_COOKIE_NAME): part
        for index, part in enumerate(parts)
    }


def extract_plan_type(data: dict) -> str:
    """Phân biệt tài khoản ChatGPT Plus/Pro/Team và Thường (Free) từ phản hồi session hoặc JWT."""
    if not isinstance(data, dict):
        return "free"
    raw_plan = str(
        (data.get("account") or {}).get("planType")
        or ((data.get("accounts") or {}).get("default") or {}).get("entitlement", {}).get("subscription_plan")
        or ""
    ).lower()
    if not raw_plan and isinstance(data.get("accessToken"), str):
        parts = data["accessToken"].split(".")
        if len(parts) >= 2:
            try:
                pad = parts[1] + "=" * (-len(parts[1]) % 4)
                claims = json.loads(base64.urlsafe_b64decode(pad.encode("ascii")).decode("utf-8"))
                raw_plan = str(
                    (claims.get("https://api.openai.com/auth") or {}).get("chatgpt_plan_type") or ""
                ).lower()
            except Exception:
                raw_plan = ""
    if any(raw_plan.startswith(p) for p in ("plus", "pro", "team", "enterprise", "edu", "chatgptplus")):
        return "plus"
    return "free"


class ChatGPTSessionManager:
    def __init__(self, session_token: str, base_url: str = "https://chatgpt.com"):
        self.session_token = (session_token or "").strip()
        self.access_token: Optional[str] = None
        self.token_expires_at: float = 0
        self.base_url = base_url.rstrip("/")
        self.cookies: dict[str, str] = {}
        self.device_id: str = str(uuid.uuid4())
        self.plan_type: str = "free"
        self.available_models: list[str] = []

    def get_cookies(self) -> dict[str, str]:
        if not self.cookies:
            self.cookies = parse_session_cookies(self.session_token)
            if "oai-did" in self.cookies:
                self.device_id = self.cookies["oai-did"]
            else:
                self.cookies["oai-did"] = self.device_id
        return dict(self.cookies)

    def update_cookies(self, jar) -> None:
        if not jar:
            return
        try:
            items = dict(jar)
        except Exception:
            return
        for k, v in items.items():
            if isinstance(k, str) and isinstance(v, str) and v:
                self.cookies[k] = v
        if "oai-did" in self.cookies and self.cookies["oai-did"]:
            self.device_id = self.cookies["oai-did"]

    def _get_headers(self, include_auth: bool = True, access_token: Optional[str] = None) -> dict:
        headers = {
            "Accept": "*/*",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "Oai-Device-Id": self.device_id,
            "Oai-Language": "vi-VN",
            "Origin": self.base_url,
            "Referer": f"{self.base_url}/",
            "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "User-Agent": CHROME120_UA,
        }
        token = access_token or self.access_token
        if include_auth and token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def get_valid_access_token(self) -> str:
        # Nếu token còn hạn (trừ hao 5 phút) thì tái sử dụng từ RAM
        if self.access_token and time.time() < (self.token_expires_at - 300):
            return self.access_token

        if AsyncSession is None:
            raise RuntimeError("Thư viện curl_cffi chưa được cài đặt.")

        cookies = self.get_cookies()

        async with AsyncSession(impersonate="chrome120", cookies=cookies) as session:
            response = await session.get(
                f"{self.base_url}/api/auth/session",
                headers=self._get_headers(include_auth=False),
                timeout=30,
                allow_redirects=False,
            )
            self.update_cookies(getattr(session, "cookies", None))

            if response.status_code != 200:
                raise ChatGPTUpstreamError(
                    "session",
                    response.status_code,
                    response.headers.get("cf-mitigated") == "challenge",
                )

            data = response.json()
            if "accessToken" not in data:
                raise ChatGPTUpstreamError("session", 401)

            self.access_token = data["accessToken"]
            self.plan_type = extract_plan_type(data)
            # Lưu cache Access Token trong 1 giờ (3600 giây)
            self.token_expires_at = time.time() + 3600
            return self.access_token

    async def get_account_info(self) -> dict:
        """Trả về gói tài khoản (plus/free) và danh sách model khả dụng của Cookie."""
        access_token = await self.get_valid_access_token()
        if AsyncSession is not None and not self.available_models:
            try:
                async with AsyncSession(impersonate="chrome120", cookies=self.get_cookies()) as session:
                    res = await session.get(
                        f"{self.base_url}/backend-api/models",
                        headers=self._get_headers(include_auth=True, access_token=access_token),
                        timeout=15,
                        allow_redirects=False,
                    )
                    self.update_cookies(getattr(session, "cookies", None))
                    if res.status_code == 200:
                        items = (res.json() or {}).get("models") or []
                        slugs = [
                            str(m.get("slug")).strip()
                            for m in items
                            if isinstance(m, dict) and isinstance(m.get("slug"), str) and m.get("slug").strip()
                        ]
                        if slugs:
                            self.available_models = slugs[:12]
                            if any(s in slugs for s in ("gpt-4o", "gpt-4-1", "o4-mini", "gpt-4.5")):
                                self.plan_type = "plus"
            except Exception:
                pass
        return {
            "plan_type": self.plan_type,
            "models": self.available_models,
        }

    async def get_sentinel_headers(self, session, access_token: str) -> dict[str, str]:
        """Lấy OpenAI-Sentinel-Chat-Requirements-Token và giải Proof-of-Work trước khi gửi tin nhắn."""
        p_init = solve_sentinel_pow(str(random.random()), "0fffff")
        req_headers = self._get_headers(include_auth=True, access_token=access_token)
        response = await session.post(
            f"{self.base_url}/backend-api/sentinel/chat-requirements",
            headers=req_headers,
            json={"p": p_init},
            timeout=20,
            allow_redirects=False,
        )
        self.update_cookies(getattr(session, "cookies", None))
        if response.status_code != 200:
            return {}
        try:
            data = response.json()
        except Exception:
            return {}
        if not isinstance(data, dict):
            return {}
        sentinel_headers: dict[str, str] = {}
        chat_token = data.get("token")
        if isinstance(chat_token, str) and chat_token.strip():
            sentinel_headers["Openai-Sentinel-Chat-Requirements-Token"] = chat_token.strip()
        pow_cfg = data.get("proofofwork")
        if isinstance(pow_cfg, dict) and pow_cfg.get("required"):
            seed = str(pow_cfg.get("seed") or "")
            difficulty = str(pow_cfg.get("difficulty") or "0fffff")
            sentinel_headers["Openai-Sentinel-Proof-Token"] = solve_sentinel_pow(seed, difficulty)
        return sentinel_headers
