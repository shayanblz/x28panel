@echo off
rem ---------------------------------------------------------------------------
rem  X28 Mobile - build an installable APK on Windows
rem  Needs: JDK 17, Android SDK 34 (ANDROID_HOME), Node.js 18+ (optional)
rem  Usage: scripts\build_apk.bat [debug^|release^|bundle]
rem ---------------------------------------------------------------------------
setlocal enabledelayedexpansion
set MODE=%1
if "%MODE%"=="" set MODE=debug

cd /d "%~dp0.."

echo [*] validating web UI
where node >nul 2>nul
if %errorlevel%==0 (
  node tools\sync-web.js || goto :error
) else (
  if exist android\app\src\main\assets\web rmdir /s /q android\app\src\main\assets\web
  xcopy /e /i /q web android\app\src\main\assets\web >nul
)

cd android
if "%MODE%"=="release" (
  call gradlew.bat --no-daemon assembleRelease || goto :error
  set OUT=app\build\outputs\apk\release\app-release.apk
) else if "%MODE%"=="bundle" (
  call gradlew.bat --no-daemon bundleRelease || goto :error
  set OUT=app\build\outputs\bundle\release\app-release.aab
) else (
  call gradlew.bat --no-daemon assembleDebug || goto :error
  set OUT=app\build\outputs\apk\debug\app-debug.apk
)

if not exist "%OUT%" goto :missing
if not exist "..\dist" mkdir "..\dist"
copy /y "%OUT%" "..\dist\X28Mobile-%MODE%.apk" >nul
echo [ok] dist\X28Mobile-%MODE%.apk
goto :eof

:missing
echo [x] build output not found: %OUT%
exit /b 1
:error
echo [x] build failed
exit /b 1
