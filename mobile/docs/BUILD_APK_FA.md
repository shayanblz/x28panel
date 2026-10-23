# ساخت و انتشار APK — راهنمای کامل

این سند سه مسیر ساخت را توضیح می‌دهد: **GitHub Actions** (ساده‌ترین)، **خط فرمان** و **Android Studio**.
هیچ‌کدام به تغییر کد نیاز ندارند.

---

## ۰) پیش‌نیازها

| ابزار | نسخه | چرا |
|---|---|---|
| JDK | ۱۷ یا بالاتر | AGP 8.5 و Gradle 8.9 |
| Android SDK | Platform 34 + Build-Tools 34 | فشرده‌سازی و ساخت |
| Node.js | ۱۸+ (اختیاری) | اعتبارسنجی و کپی رابط وب |
| Python + Pillow | فقط برای بازسازی آیکون | اختیاری |

نصب SDK بدون Android Studio:

```bash
mkdir -p $HOME/Android/Sdk && cd $HOME/Android/Sdk
# از https://developer.android.com/studio#command-line-tools-only
unzip commandlinetools-linux-*.zip
export ANDROID_HOME=$HOME/Android/Sdk
yes | cmdline-tools/bin/sdkmanager --licenses
cmdline-tools/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

---

## ۱) ساخت با GitHub Actions

گردش‌کار در ریشهٔ مخزن قرار دارد: `.github/workflows/android-mobile.yml`

* روی **push به `main`** (تغییرات زیر `mobile/`)، **Pull Request** و **workflow_dispatch** اجرا می‌شود.
* خروجی: Artifact با نام **X28Mobile-apk** شامل `X28Mobile-<ref>-debug.apk`.
* با زدن تگ `v1.2.3` همان APK به Release ضمیمه می‌شود.

```bash
git tag v1.0.0
git push origin v1.0.0
```

### امضای Release با Secrets

اگر می‌خواهید نسخهٔ **signed release** هم ساخته شود، این Secretها را در
`Settings → Secrets and variables → Actions` اضافه کنید:

| Secret | مقدار |
|---|---|
| `X28_KEYSTORE_BASE64` | خروجی `base64 -w0 release.jks` |
| `X28_KEYSTORE_PASSWORD` | رمز Keystore |
| `X28_KEY_ALIAS` | نام کلید (مثلاً `x28`) |
| `X28_KEY_PASSWORD` | رمز کلید |

ساخت Keystore (یک‌بار برای همیشه؛ فایل و رمزها را حفظ کنید):

```bash
keytool -genkeypair -v -keystore release.jks -keyalg RSA -keysize 4096 \
  -validity 10000 -alias x28 -storepass 'RAMZ-STRONG' -keypass 'RAMZ-STRONG' \
  -dname "CN=X28 Mobile, OU=Panel, O=X28, L=Tehran, C=IR"
base64 -w0 release.jks > release.jks.b64
```

> فایل `release.jks` و رمزها را **هرگز** در مخزن نگذارید؛ `.gitignore` هم آن‌ها را رد می‌کند.

---

## ۲) ساخت از خط فرمان

### لینوکس / مک

```bash
cd mobile
export ANDROID_HOME=$HOME/Android/Sdk
bash scripts/build_apk.sh            # debug
bash scripts/build_apk.sh release    # signed (با X28_KEYSTORE*)
bash scripts/build_apk.sh bundle     # AAB برای Google Play
```

اسکریپت خودش: نسخهٔ Java را بررسی، `ANDROID_HOME` را پیدا، JSها را syntax-check،
`web/` را در assets کپی و در پایان APK را در `dist/` می‌گذارد.

### ویندوز

```bat
cd mobile
set ANDROID_HOME=C:\Users\me\AppData\Local\Android\Sdk
scripts\build_apk.bat
```

### دستی (فقط Gradle)

```bash
cd mobile/android
./gradlew assembleDebug
# خروجی: app/build/outputs/apk/debug/app-debug.apk
```

`settings.gradle` و `gradle/wrapper` همراه پروژه‌اند؛ Gradle 8.9 خودش دانلود می‌شود.
تسک `syncWebAssets` پیش از هر build، پوشهٔ `../web` را داخل `assets/web` کپی می‌کند.

---

## ۳) Android Studio

1. `mobile/android` را با **Open** باز کنید (نه ریشهٔ مخزن).
2. صبر کنید Gradle Sync تمام شود (AGP 8.5.2 / Gradle 8.9).
3. **Run ▶** روی دستگاه یا شبیه‌ساز.
4. برای خروجی: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

اگر SDK محلی متفاوت است، `android/local.properties` را بسازید:

```properties
sdk.dir=/home/me/Android/Sdk
```

---

## ۴) امضا و بهینه‌سازی

فایل `android/app/build.gradle` امضای release را از متغیرهای محیطی می‌خواند:

```bash
export X28_KEYSTORE=/absolute/path/release.jks
export X28_KEYSTORE_PASSWORD='...'
export X28_KEY_ALIAS=x28
export X28_KEY_PASSWORD='...'
cd mobile/android && ./gradlew assembleRelease
```

* تا وقتی این متغیرها تنظیم نشده باشند، خروجی release **unsigned** است و نصب نمی‌شود؛
  برای تست و توزیع مستقیم از **debug** استفاده کنید.
* برای کوچک‌کردن حجم، بعد از پایدارشدن می‌توانید `minifyEnabled true` و R8 را فعال کنید
  (قواعد نگه‌داشتن پل در `proguard-rules.pro` آماده است).
* برای Google Play، خروجی `bundle` (AAB) بسازید و «Play App Signing» را فعال کنید.

---

## ۵) نصب و توزیع

```bash
adb install -r dist/X28Mobile-*.apk
# یا
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

* روی گوشی: فایل APK را باز کنید و اجازهٔ «نصب برنامه‌های ناشناس» را برای فایل‌منیجر بدهید.
* **نکته:** اگر نسخهٔ قبلی با امضای دیگری نصب است، اول حذفش کنید (`adb uninstall ir.x28panel.mobile`).
* بستهٔ برنامه: `ir.x28panel.mobile` (نسخهٔ debug: `ir.x28panel.mobile.debug`).

---

## ۶) عیب‌یابی ساخت

| خطا | علت / راه‌حل |
|---|---|
| `SDK location not found` | `ANDROID_HOME` یا `android/local.properties` تنظیم نشده است. |
| `Unsupported class file major version` | JDK قدیمی است؛ ۱۷+ نصب کنید و `JAVA_HOME` را تنظیم کنید. |
| `Failed to install ... SDK 34` | `sdkmanager "platforms;android-34" "build-tools;34.0.0"` |
| صفحهٔ سفید پس از نصب | `web/` در assets کپی نشده؛ `node tools/sync-web.js` یا build از `mobile/android` را اجرا کنید. |
| `Network is unreachable` هنگام Gradle | دسترسی به `dl.google.com`/`repo.maven.apache.org` لازم است؛ آینهٔ داخلی تنظیم کنید. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | نسخهٔ قبلی با امضای دیگر نصب است؛ حذفش کنید. |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | فضای گوشی را آزاد کنید (اپ حدود ۱ مگابایت است). |

---

## ۷) انتشار روی GitHub Releases

```bash
git tag v1.0.0 -m "X28 Mobile 1.0.0"
git push origin v1.0.0
```

گردش‌کار به‌طور خودکار:

1. تست‌های UI را اجرا می‌کند،
2. APK را می‌سازد،
3. آن را به Release تگ `v1.0.0` ضمیمه می‌کند.

برای انتشار دستی هم می‌توانید فایل `dist/*.apk` را در صفحهٔ Releases آپلود کنید.

---

## ۸) نسخه‌گذاری

* `versionCode` / `versionName` در `android/app/build.gradle`
* `version` در `mobile/package.json` (فقط برای ابزارها)
* نمایش نسخه در برنامه از `BuildConfig.VERSION_NAME` خوانده می‌شود (`Android.appVersion()`).

هنگام انتشار نسخهٔ جدید، `versionCode` را حتماً افزایش دهید.
