#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  X28 Mobile — build an installable APK from a clean checkout
#
#  Requirements
#    • JDK 17            (java -version)
#    • Android SDK 34     (ANDROID_HOME / ANDROID_SDK_ROOT, or android/local.properties)
#    • Node.js 18+        (only to validate + copy the web UI)
#
#  Usage
#    bash scripts/build_apk.sh              # debug APK (installable, no signing needed)
#    bash scripts/build_apk.sh release      # release APK (needs signing env vars)
#    bash scripts/build_apk.sh bundle       # release AAB for Google Play
# ---------------------------------------------------------------------------
set -euo pipefail

MODE="${1:-debug}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

say() { printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

say "checking toolchain"
command -v java >/dev/null 2>&1 || fail "JDK 17 not found. Install it and re-run."
JAVA_MAJOR="$(java -version 2>&1 | head -1 | sed -E 's/.*version "([0-9]+).*/\1/')"
[ "${JAVA_MAJOR:-0}" -ge 17 ] || fail "JDK 17+ required (found ${JAVA_MAJOR:-unknown})."

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  if [ -f android/local.properties ]; then
    SDK_DIR="$(grep -E '^sdk.dir=' android/local.properties | cut -d= -f2-)"
    export ANDROID_HOME="$SDK_DIR"
  else
    fail "Android SDK not configured. Set ANDROID_HOME or create android/local.properties with sdk.dir=/path/to/Android/Sdk"
  fi
fi
say "SDK: ${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"

if command -v node >/dev/null 2>&1; then
  say "validating web UI"
  node --check web/js/app.js
  for f in web/js/core/*.js web/js/ui/*.js web/js/tabs/*.js; do node --check "$f"; done
  say "copying web assets"
  node tools/sync-web.js
else
  say "node not found — copying assets with rsync/cp"
  rm -rf android/app/src/main/assets/web
  mkdir -p android/app/src/main/assets
  cp -R web android/app/src/main/assets/web
fi

cd android
chmod +x gradlew

case "$MODE" in
  debug)
    say "building debug APK"
    ./gradlew --no-daemon assembleDebug
    OUT="app/build/outputs/apk/debug/app-debug.apk"
    ;;
  release)
    [ -n "${X28_KEYSTORE:-}" ] || fail "For a signed release set X28_KEYSTORE, X28_KEYSTORE_PASSWORD, X28_KEY_ALIAS, X28_KEY_PASSWORD."
    say "building signed release APK"
    ./gradlew --no-daemon assembleRelease
    OUT="app/build/outputs/apk/release/app-release.apk"
    ;;
  bundle)
    [ -n "${X28_KEYSTORE:-}" ] || fail "For a signed bundle set the X28_KEYSTORE_* variables."
    say "building release AAB"
    ./gradlew --no-daemon bundleRelease
    OUT="app/build/outputs/bundle/release/app-release.aab"
    ;;
  *)
    fail "unknown mode '$MODE' (use: debug | release | bundle)"
    ;;
esac

[ -f "$OUT" ] || fail "build finished but $OUT is missing"

mkdir -p "$ROOT/dist"
NAME="X28Mobile-$(date +%Y%m%d)-${MODE}$(echo "$OUT" | grep -q '\.aab$' && echo .aab || echo .apk)"
cp "$OUT" "$ROOT/dist/$NAME"

say "done → dist/$NAME ($(du -h "$ROOT/dist/$NAME" | cut -f1))"
say "install with: adb install -r \"$ROOT/dist/$NAME\""
