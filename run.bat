@echo off
rem اجرای پنل X28 روی ویندوز (پیشنهاد: فایل X28Panel.exe ساخته‌شده)
cd /d "%~dp0"
python -m pip install -q -r requirements.txt
python app.py %*
pause
