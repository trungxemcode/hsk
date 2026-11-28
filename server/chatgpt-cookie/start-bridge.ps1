<#
.SYNOPSIS
  Starts the local HSK ChatGPT Cookie Python Bridge + Cloudflare Tunnel and
  optionally updates CHATGPT_COOKIE_BRIDGE_URL on Cloudflare Worker.
.USAGE
  cd C:\Users\LENOVO\hsk\server\chatgpt-cookie
  $env:CHATGPT_COOKIE_BRIDGE_KEY = "<your-bridge-key>"
  .\start-bridge.ps1
  # Optional: pass -TunnelToken "<named-cloudflare-tunnel-token>" for a fixed URL
  # Optional: pass -SyncWorkerSecret to automatically run wrangler secret put
#>
param(
  [int]$Port = 8787,
  [string]$TunnelToken = $env:CLOUDFLARED_TUNNEL_TOKEN,
  [switch]$SyncWorkerSecret
)

$ErrorActionPreference = "Stop"
$BridgeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $BridgeDir "..\..")

if (-not $env:CHATGPT_COOKIE_BRIDGE_KEY) {
  Write-Error "Missing CHATGPT_COOKIE_BRIDGE_KEY environment variable. Set it first: `$env:CHATGPT_COOKIE_BRIDGE_KEY = '<key>'"
  exit 1
}

Write-Host "[1/3] Starting Python Bridge on http://127.0.0.1:$Port ..." -ForegroundColor Cyan
$uvicornProc = Start-Process -FilePath "python" `
  -ArgumentList @("-m", "uvicorn", "main:bridge_app", "--host", "127.0.0.1", "--port", "$Port") `
  -WorkingDirectory $BridgeDir -PassThru -NoNewWindow

try {
  $healthy = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      $res = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 2
      if ($res.ok -eq $true) { $healthy = $true; break }
    } catch {}
  }
  if (-not $healthy) {
    throw "Python Bridge did not become healthy on http://127.0.0.1:$Port/health"
  }
  Write-Host "[2/3] Python Bridge is healthy!" -ForegroundColor Green

  if ($TunnelToken) {
    Write-Host "[3/3] Starting Named Cloudflare Tunnel (fixed URL)..." -ForegroundColor Cyan
    & cloudflared tunnel run --token $TunnelToken
  } else {
    Write-Host "[3/3] Starting Cloudflare Quick Tunnel..." -ForegroundColor Cyan
    $logFile = Join-Path $env:TEMP "hsk-cloudflared-bridge.log"
    if (Test-Path $logFile) { Remove-Item $logFile -Force }
    $cfProc = Start-Process -FilePath "cloudflared" `
      -ArgumentList @("tunnel", "--url", "http://127.0.0.1:$Port", "--no-autoupdate") `
      -RedirectStandardError $logFile -PassThru -NoNewWindow
    try {
      $tunnelUrl = ""
      for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Path $logFile) {
          $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
          if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
            $tunnelUrl = $Matches[0]
            break
          }
        }
      }
      if (-not $tunnelUrl) {
        throw "Could not detect trycloudflare.com URL from cloudflared output."
      }
      Write-Host "Tunnel live: $tunnelUrl" -ForegroundColor Green
      $remoteHealth = Invoke-RestMethod -Uri "$tunnelUrl/health" -TimeoutSec 10
      if ($remoteHealth.ok -eq $true) {
        Write-Host "Remote /health verified OK!" -ForegroundColor Green
      }
      if ($SyncWorkerSecret) {
        Write-Host "Updating CHATGPT_COOKIE_BRIDGE_URL on Cloudflare Worker..." -ForegroundColor Cyan
        Push-Location $RepoRoot
        try {
          $tunnelUrl | npx --yes wrangler@4 secret put CHATGPT_COOKIE_BRIDGE_URL --config server/wrangler.jsonc
          Write-Host "Worker secret CHATGPT_COOKIE_BRIDGE_URL updated!" -ForegroundColor Green
        } finally {
          Pop-Location
        }
      } else {
        Write-Host "Run with -SyncWorkerSecret or set Worker secret CHATGPT_COOKIE_BRIDGE_URL = $tunnelUrl" -ForegroundColor Yellow
      }
      Write-Host "Bridge is running. Keep this window open (Ctrl+C to stop)." -ForegroundColor Cyan
      Wait-Process -Id $cfProc.Id
    } finally {
      if ($cfProc -and -not $cfProc.HasExited) { Stop-Process -Id $cfProc.Id -Force }
    }
  }
} finally {
  if ($uvicornProc -and -not $uvicornProc.HasExited) { Stop-Process -Id $uvicornProc.Id -Force }
}
