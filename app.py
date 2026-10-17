#!/usr/bin/env python3
"""
X28 Control Center — پنل مستقل مدیریت و پایش مودم X28 (ZLT)

اجرا از سورس:
    python app.py                        # با config.json (کنار پروژه یا کنار exe)
    python app.py --setup                # جادوگر خط فرمان: آدرس پنل مودم، کاربر، رمز
    python app.py --no-browser           # بدون باز کردن خودکار مرورگر
    python app.py --import-log FILE      # فقط ورود لاگ رویداد و خروج
    python app.py --list-plugins

اجرا به‌صورت EXE (ویندوز):  X28Panel.exe   →  خودش مرورگر را باز می‌کند
"""
from __future__ import annotations

import argparse
import copy
import logging
import os
import sys
import threading
import time
import webbrowser

BASE = os.path.dirname(os.path.abspath(__file__))


def say(*parts) -> None:
    """چاپ امن: اگر کنسولی وجود نداشت یا کدپیج پشتیبانی نکرد، برنامه نباید بمیرد."""
    try:
        print(*parts)
    except Exception:
        try:
            sys.stdout.write(" ".join(str(p) for p in parts) + "\n")
        except Exception:
            pass
sys.path.insert(0, BASE)

from core import api as api_mod            # noqa: E402
from core import config as cfgmod          # noqa: E402
from core import discovery as disc         # noqa: E402
from core import logparse                  # noqa: E402
from core import paths                     # noqa: E402
from core.auth import AUTH                 # noqa: E402
from core.bus import Hub                   # noqa: E402
from core.registry import Registry         # noqa: E402
from core.scheduler import Scheduler       # noqa: E402
from core.store import Store               # noqa: E402

# این import فقط برای این است که PyInstaller درایور را داخل exe بگذارد
import drivers.zlt_web  # noqa: E402,F401

from flask import Flask, Response, jsonify, request, send_from_directory  # noqa: E402

LOG = logging.getLogger("x28")


def force_utf8_io() -> None:
    """
    در EXE ویندوز، کنسول به‌طور پیش‌فرض cp1252 است و متن فارسی باعث
    UnicodeEncodeError و بسته‌شدن برنامه می‌شود. این‌جا stdout/stderr را UTF-8
    می‌کنیم و در ویندوز کد‌پیج کنسول را هم روی 65001 می‌گذاریم.
    """
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")   # type: ignore[attr-defined]
        except Exception:
            pass
    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:
            pass
    try:                                            # فایل‌های متنی لاگ/گزارش هم UTF-8
        os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    except Exception:
        pass


def setup_logging(to_file: bool) -> None:
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    if to_file:
        try:
            path = paths.log_file()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            handlers.append(logging.FileHandler(path, encoding="utf-8"))
        except Exception:
            pass
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=handlers, force=True)


# --------------------------------------------------------------------------- ساخت برنامه
def build_app(cfg: dict) -> Flask:
    app = Flask(__name__, static_folder=None)

    hub = Hub(history_points=int(cfg["panel"].get("history_points", 1800)))
    db_path = cfg["storage"]["db"]
    if not os.path.isabs(db_path):
        db_path = os.path.join(paths.app_dir(), db_path)
    store = Store(db_path, keep_days=int(cfg["storage"].get("keep_days", 30)))
    registry = Registry(hub, store, paths.plugins_dir())
    registry.discover()
    scheduler = Scheduler(hub, store, registry)

    api_mod.HUB, api_mod.STORE, api_mod.REG, api_mod.SCH = hub, store, registry, scheduler
    app.register_blueprint(api_mod.bp, url_prefix="/api")

    @app.before_request
    def _guard():
        path = request.path
        if not path.startswith("/api/"):
            return None
        if path in ("/api/health", "/api/login", "/api/session"):
            return None
        # جادوگر راه‌اندازی اولیه تا وقتی تنظیمات کامل نشده، آزاد است (فقط از شبکهٔ محلی)
        if api_mod.setup_needed() and path.startswith(("/api/setup", "/api/discovery", "/api/session")):
            return None
        return AUTH.guard()

    @app.get("/")
    def index():
        with open(os.path.join(paths.ui_dir(), "index.html"), encoding="utf-8") as f:
            return Response(f.read(), mimetype="text/html")

    @app.get("/<path:fname>")
    def static_files(fname: str):
        if fname.startswith("api/"):
            return jsonify({"ok": False, "error": "not found"}), 404
        return send_from_directory(paths.ui_dir(), fname)

    # M4: مودم فعال را در رجیستری ثبت می‌کنیم تا پلاگین‌ها و اقدام‌ها خودکار روی همان کار کنند
    try:
        from . import multimodem as _mm
    except ImportError:                                              # اجرای مستقیم app.py
        from core import multimodem as _mm
    active_modem = _mm.sync_registry(registry)
    registry.log("panel", f"مودم فعال: {active_modem or '—'}")

    registry.log("panel", f"پنل با {len(registry.plugins)} پلاگین بارگذاری شد"
                          + (" (حالت EXE)" if paths.is_frozen() else ""))
    scheduler.start()
    for p in registry.plugins.values():
        if p.enabled and p.collect:
            threading.Thread(target=registry.run_plugin, args=(p,), daemon=True).start()
    app.extensions["x28"] = {"hub": hub, "store": store, "registry": registry,
                             "scheduler": scheduler, "auth": AUTH}
    return app


# --------------------------------------------------------------------------- جادوگر خط فرمان
def cli_setup() -> int:
    say("─" * 62)
    say("  راه‌اندازی اولیه — سه چیز لازم است")
    say("─" * 62)
    url = input("۱) آدرس پنل ادمین مودم        [http://192.168.1.1]: ").strip() or "http://192.168.1.1"
    user = input("۲) نام کاربری ادمین مودم     [admin]: ").strip() or "admin"
    import getpass
    pw = getpass.getpass("۳) رمز ادمین مودم            : ").strip()
    parsed = api_mod.parse_panel_url(url)
    cfgmod.save({
        "setup": {"done": False, "done_at": None},
        "modems": [{
            "id": "x28-main", "name": f"X28 ({parsed['host']})", "host": parsed["host"],
            "user": user, "password": pw, "driver": "zlt_web", "web_port": parsed["port"],
            "scheme": parsed["scheme"],
        }],
    })
    say(f"\n[✓] ذخیره شد: {parsed['scheme']}://{parsed['host']}:{parsed['port']}")
    say("    حالا پنل را اجرا کنید:  python app.py")
    say("    (شناسایی خودکار مودم از داخل پنل، صفحهٔ «شناسنامهٔ مودم» انجام می‌شود)")
    return 0


# --------------------------------------------------------------------------- main
def main() -> int:
    ap = argparse.ArgumentParser(description="X28 Control Center")
    ap.add_argument("config", nargs="?", default=None, help="مسیر config.json (پیش‌فرض: کنار برنامه/exe)")
    ap.add_argument("--setup", action="store_true", help="جادوگر خط فرمان: آدرس پنل، کاربر، رمز")
    ap.add_argument("--no-browser", action="store_true", help="مرورگر خودکار باز نشود")
    ap.add_argument("--port", type=int, help="پورت (پیش‌فرض از config.json)")
    ap.add_argument("--host", help="آدرس گوش‌دادن (پیش‌فرض از config.json)")
    ap.add_argument("--import-log", metavar="FILE", help="ورود فایل لاگ رویداد و خروج")
    ap.add_argument("--list-plugins", action="store_true")
    ap.add_argument("--paths", action="store_true", help="نمایش مسیرهای برنامه (برای عیب‌یابی)")
    ap.add_argument("--discover", action="store_true",
                    help="شناسایی خودکار مودم از خط فرمان (بدون رابط گرافیکی)")
    args = ap.parse_args()

    force_utf8_io()                                   # ← اول از همه: جلوگیری از کرش فارسی در ویندوز
    setup_logging(paths.is_frozen() or bool(args.import_log))

    if args.paths:
        for k, v in paths.describe().items():
            say(f"  {k:12s} {v}")
        return 0

    if args.setup:
        return cli_setup()

    # کپی عمیق: تغییرهای خط فرمان (--host/--port) نباید در حافظهٔ cfgmod یا فایل
    # config.json بنشیند (وگرنه ذخیرهٔ بعدی — مثلاً جادوگر — پورت موقت را ماندگار می‌کند)
    cfg = copy.deepcopy(cfgmod.load(args.config))
    if args.host:
        cfg["panel"]["listen_host"] = args.host
    if args.port:
        cfg["panel"]["listen_port"] = args.port

    if args.import_log:
        rows = logparse.parse_file(args.import_log)
        if not rows:
            say("[!] هیچ رویداد معتبری در فایل پیدا نشد.")
            return 1
        db_path = cfg["storage"]["db"]
        if not os.path.isabs(db_path):
            db_path = os.path.join(paths.app_dir(), db_path)
        store = Store(db_path, keep_days=int(cfg["storage"].get("keep_days", 30)))
        n = store.import_events(rows, source="modem-log")
        say(f"[✓] {n} رویداد وارد شد. بازه: {rows[0]['ts']} → {rows[-1]['ts']}")
        say(f"    دیتابیس: {db_path}")
        return 0

    app = build_app(cfg)
    x = app.extensions["x28"]
    reg: Registry = x["registry"]

    if args.list_plugins:
        for p in reg.describe_all():
            say(f"  {'✓' if p['enabled'] else '✗'} {p['id']:12s} {p['name']:26s} هر {p['interval']}s  ({p['kind']})")
        return 0

    if args.discover:
        modem = (cfg.get("modems") or [None])[0]
        if not modem:
            say("[!] هیچ مودمی تنظیم نشده. اول  python app.py --setup  را اجرا کنید.")
            return 1
        say("در حال شناسایی مودم… (ممکن است ۳۰ ثانیه طول بکشد)")
        res = disc.run_discovery(x["store"], reg, x["hub"], modem, logger=lambda m: print("   ·", m))
        prof = res.get("profile") or {}
        say("\n── شناسنامهٔ مودم ─────────────────────────")
        say("  مدل      :", prof.get("model"))
        say("  فریم‌ور   :", prof.get("firmware"))
        say("  خانواده  :", prof.get("family"))
        say("  قابلیت‌ها :", "، ".join(c["label"] for c in prof.get("capabilities", [])[:12]) or "—")
        for r in prof.get("recommendations", []):
            say(f"  [{r['level']}] {r['title']}")
        return 0

    host = cfg["panel"]["listen_host"]
    port = int(cfg["panel"]["listen_port"])
    url = f"http://{'127.0.0.1' if host in ('0.0.0.0', '') else host}:{port}/"
    needs = api_mod.setup_needed()

    say("─" * 62)
    say(f"  {cfg['panel']['name']}")
    say(f"  مرورگر:  {url}")
    if needs:
        say("  ••• اولین اجرا: ۳ چیز لازم است (آدرس پنل ادمین، کاربر، رمز) — در مرورگر وارد کنید")
    modems = cfg.get("modems") or []
    say("  مودم‌ها:  " + ("، ".join(f"{m.get('name')} ({m.get('host')})" for m in modems) or "—"))
    say("  پلاگین‌ها: " + "، ".join(p["id"] for p in reg.describe_all()))
    say(f"  ورود پنل: {'فعال' if AUTH.login_required else 'غیرفعال — فقط شبکهٔ محلی'}")
    if paths.is_frozen():
        say(f"  داده‌ها  :  {paths.app_dir()}")
    say("─" * 62)

    if not args.no_browser:
        threading.Timer(1.6, lambda: webbrowser.open(url)).start()

    try:
        app.run(host=host, port=port, threaded=True, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
