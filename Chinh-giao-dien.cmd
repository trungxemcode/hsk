@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 tools\serve-home-designer.py --open
) else (
  python tools\serve-home-designer.py --open
)
if errorlevel 1 pause
