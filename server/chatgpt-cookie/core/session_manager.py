# File: core/session_manager.py
import time
from typing import Optional

try:
    from curl_cffi.requests import AsyncSession
except ImportError:  # pragma: no cover - fallback when curl_cffi is not installed in test env
    AsyncSession = None


class ChatGPTSessionManager:
    def __init__(self, session_token: str, base_url: str = "https://chatgpt.com"):
        self.session_token = (session_token or "").strip()
        self.access_token: Optional[str] = None
        self.token_expires_at: float = 0
        self.base_url = base_url.rstrip("/")

    def _get_headers(self, include_auth: bool = True, access_token: Optional[str] = None) -> dict:
        headers = {
            "Accept": "*/*",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "Origin": self.base_url,
            "Referer": f"{self.base_url}/",
            "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        }
        token = access_token or self.access_token
        if include_auth and token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    async def get_valid_access_token(self) -> str:
        # Nếu token còn hạn (trừ hao 5 phút) thì tái sử dụng từ RAM
        if self.access_token and time.time() < (self.token_expires_at - 300):
            return self.access_token

        if not self.session_token or self.session_token == "YOUR_SESSION_TOKEN_HERE":
            raise ValueError("Chưa cấu hình Cookie __Secure-next-auth.session-token.")

        if AsyncSession is None:
            raise RuntimeError("Thư viện curl_cffi chưa được cài đặt.")

        parts = self.session_token.split("|")
        if any(not part or any(char.isspace() or char in ';,"\\' for char in part) for part in parts):
            raise ValueError("Định dạng Cookie ChatGPT không hợp lệ.")
        name = "__Secure-next-auth.session-token"
        cookies = {
            (f"{name}.{index}" if len(parts) > 1 else name): part
            for index, part in enumerate(parts)
        }

        async with AsyncSession(impersonate="chrome120", cookies=cookies) as session:
            response = await session.get(
                f"{self.base_url}/api/auth/session",
                headers=self._get_headers(include_auth=False),
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(
                    f"Lỗi xác thực Cookie (HTTP {response.status_code}): {response.text[:200]}"
                )

            data = response.json()
            if "accessToken" not in data:
                raise Exception("Cookie đã hết hạn hoặc không hợp lệ. Vui lòng cập nhật Cookie mới.")

            self.access_token = data["accessToken"]
            # Lưu cache Access Token trong 1 giờ (3600 giây)
            self.token_expires_at = time.time() + 3600
            return self.access_token
