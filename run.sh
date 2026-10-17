#!/usr/bin/env bash
# اجرای پنل X28 (لینوکس/مک) — ویندوز: run.bat یا X28Panel.exe
set -e
cd "$(dirname "$0")"
PY=${PYTHON:-python3}
if [ ! -d .venv ] && command -v "$PY" >/dev/null 2>&1; then
  echo "• نصب پیش‌نیازها…"
  "$PY" -m pip install -q -r requirements.txt || echo "  (نصب خودکار نشد؛ دستی اجرا کنید: pip install -r requirements.txt)"
fi
exec "$PY" app.py "$@"
