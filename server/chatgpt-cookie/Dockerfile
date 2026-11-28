# Universal 1-file deployment for HSK ChatGPT Cookie Bridge
# Works out-of-the-box on Railway, Koyeb, Render, Fly.io, and any Docker VPS.
#
# Cloud (Railway / Koyeb / Render / Fly.io):
#   - Repo: trungxemcode/hsk (branch: main)
#   - Root Directory: server/chatgpt-cookie
#   - Env:
#       CHATGPT_COOKIE_BRIDGE_KEY=<your-secret-key>
#       CHATGPT_PROXY_URL=<optional-http-or-socks5-proxy-if-cloud-ip-gets-403>
#   - Health Check Path: /health
#
# VPS (1-command 24/7 Docker):
#   docker build -t hsk-chatgpt-bridge server/chatgpt-cookie
#   docker run -d --name hsk-chatgpt-bridge --restart unless-stopped \
#     -p 8787:8787 \
#     -e CHATGPT_COOKIE_BRIDGE_KEY="<your-secret-key>" \
#     hsk-chatgpt-bridge
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8787

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && pip install --no-cache-dir \
    "fastapi>=0.110.0" \
    "uvicorn[standard]>=0.28.0" \
    "pydantic>=2.6.0" \
    "python-multipart>=0.0.9" \
    "curl_cffi>=0.6.2"

COPY main.py ./
COPY core ./core
COPY security ./security
COPY projects ./projects
COPY personalization ./personalization
COPY services ./services

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.getenv(\"PORT\",\"8787\")}/health', timeout=4)" || exit 1

CMD ["sh", "-c", "exec uvicorn main:bridge_app --host 0.0.0.0 --port ${PORT:-8787} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
