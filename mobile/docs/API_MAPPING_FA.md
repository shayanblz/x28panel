# نگاشت API پنل X28 در اپ موبایل

اپ موبایل همان API مستندشدهٔ پنل را مصرف می‌کند، اما ساختار پاسخ‌ها را «تحمل‌پذیر» می‌خواند:
اگر نام یک فیلد بین نسخه‌های پنل/فریم‌ور عوض شود، اپ خراب نمی‌شود و فقط همان مقدار «—» می‌ماند.

تمام منطق نگاشت در یک فایل است: **`web/js/core/adapt.js`**.
برای افزودن نام جدید، فقط همان‌جا یک مورد به آرایهٔ نامزدها اضافه کنید.

---

## ۱) نقاط پایانی مورد استفاده

| متد | مسیر | استفاده در اپ |
|---|---|---|
| GET | `/api/health` | بررسی در دسترس بودن پنل (اتصال) |
| GET | `/api/session` | تشخیص نیاز به رمز ورود |
| POST | `/api/login` | ورود با رمز پنل (`{password}`) |
| GET | `/api/status` | تمام دادهٔ زندهٔ داشبورد/سیگنال/باند/شبکه/وای‌فای/کلاینت‌ها |
| GET | `/api/series?keys=…&range=…` | (در صورت نیاز) تاریخچهٔ سرور — اپ تاریخچهٔ محلی را ترجیح می‌دهد |
| GET | `/api/events?q=&category=&limit=` | فید رویدادها |
| GET | `/api/actions` | فهرست عملیات و پارامترها |
| POST | `/api/action/<name>` | اجرای عملیات |
| GET | `/api/plugins` | فهرست پلاگین‌ها |
| POST | `/api/plugins/<id>` | روشن/خاموش یا تغییر تنظیمات پلاگین |
| POST | `/api/plugins-reload` | بارگذاری مجدد پلاگین‌ها |
| GET/POST | `/api/config` | خواندن/نوشتن تنظیمات مجاز |
| POST | `/api/import-log` | ارسال فایل لاگ (`{filename, text}`) |

همهٔ درخواست‌ها با هدر `X-Token` (اگر توکن تنظیم شده باشد) و کوکی نشست ارسال می‌شوند.

---

## ۲) جدول نگاشت `/api/status`

ستون «نام‌های پذیرفته‌شده» به ترتیب اولویت جست‌وجو می‌شود؛ تطبیق **بدون حساسیت به بزرگی حروف و
کاراکترهای جداکننده** است (مثلاً `rx_bps` با `rxBps` و `snmp.rx_bps` هم‌خوان می‌شود).

| مقدار در اپ | نام‌های پذیرفته‌شده | نوع |
|---|---|---|
| اپراتور | `operator`, `carrier`, `spn`, `plmn`, `provider` | رشته |
| نوع شبکه | `network_type`, `net_type`, `network_mode`, `network`, `rat` | رشته |
| باند فعال | `active_band`, `band`, `lte_band`, `nr_band`, `current_band` | `B3` / `n78` / `auto` |
| قفل باند | `band_lock`, `locked_band`, `bandlock` | مثل بالا |
| حالت شبکه | `network_mode`, `preferred_mode` | `auto` / `4g` / `5g` |
| RSRP | `rsrp`, `rsrp_dbm`, `lte_rsrp`, `nr_rsrp`, `signal.rsrp` | عدد (dBm) |
| RSRQ | `rsrq`, `rsrq_db`, `lte_rsrq` | عدد (dB) |
| SINR | `sinr`, `sinr_db`, `snr`, `lte_sinr`, `nr_sinr` | عدد (dB) |
| PCI | `pci`, `physical_cell_id`, `cell_pci` | عدد |
| Cell ID | `cell_id`, `cid`, `cellid`, `cell_identity` | رشته/عدد |
| ARFCN | `nrarfcn`, `earfcn`, `arfcn`, `freq_earfcn` | عدد |
| تأخیر | `rtt_ms`, `latency_ms`, `avg_rtt`, `ping_ms`, `ping.rtt_ms`, `rtt` | عدد (ms) |
| نوسان | `jitter_ms`, `jitter`, `rtt_jitter` | عدد |
| افت بسته | `packet_loss`, `loss_pct`, `packet_loss_pct`, `loss` | درصد |
| دما | `temperature`, `temp_c`, `temp`, `device_temp` | °C |
| آپ‌تایم | `uptime`, `uptime_s`, `uptime_seconds`, `sys_uptime` | ثانیه |
| دریافت | `rx_bps`, `wan_rx_bps`, `download_bps`, `rx_rate`, `snmp.rx_bps` | bit/s |
| ارسال | `tx_bps`, `wan_tx_bps`, `upload_bps`, `tx_rate`, `snmp.tx_bps` | bit/s |
| کل دریافت | `rx_bytes`, `total_rx`, `wan_rx_bytes`, `wan_rx` | بایت |
| کل ارسال | `tx_bytes`, `total_tx`, `wan_tx_bytes`, `wan_tx` | بایت |
| IP WAN | `wan_ip`, `wanip`, `wan_ipv4`, `wan.address` | رشته |
| IP عمومی | `public_ip`, `external_ip`, `pub_ip`, `wan_public_ip` | رشته |
| CGNAT | `cgnat`, `is_cgnat` | bool |
| Gateway | `gateway`, `wan_gateway`, `default_gateway` | رشته |
| DNS | `dns_ms`, `dns_latency`, `dns_time` | ms |
| اعتبار TLS | `tls_days`, `cert_days`, `certificate_days` | روز |
| APN | `apn`, `apn_name`, `current_apn` | رشته |
| IPv6 | `ipv6`, `ipv6_enabled` | bool |
| MTU | `mtu` | عدد |
| مدل/فریم‌ور/IMEI/ICCID/سریال | `model`, `firmware`/`fw_version`, `imei`, `iccid`, `serial`/`sn` | رشته |

### کلاینت‌ها

آداپتر به‌دنبال **اولین آرایهٔ اشیاء** می‌گردد که کلیدهای MAC/IP/hostname دارد:
`clients`, `devices`, `leases`, `dhcp_leases`, `hosts`, `stations`, `active_clients`, `wifi_clients`
(در هر عمقی از JSON). برای هر دستگاه:

| مقدار | نام‌ها |
|---|---|
| نام | `hostname`, `host_name`, `name`, `device_name`, `client_name`, `host` |
| MAC | `mac`, `mac_address`, `hwaddr`, `macaddr` |
| IP | `ip`, `ip_address`, `ipv4`, `address` |
| نوع | `type`, `device_type`, `category`, `kind`, `os` (در نبود آن از نام حدس زده می‌شود) |
| آنلاین | `online`, `active`, `connected`, `status` |
| ترافیک | `rx_bps`/`tx_bps`, `rx_rate`/`tx_rate`, `total_bytes`/`traffic` |

### وای‌فای

اگر `ssid`/`wifi_ssid`/`wlan_ssid` وجود داشته باشد:
`wifi_enabled`, `guest_enabled`, `wps_enabled`, `channel_24`/`channel2g`, `channel_5`/`channel5g`, `security`, `tx_power`.

اگر پنل این اطلاعات را ندهد، تب وای‌فای به‌جای دادهٔ جعلی، پیام راهنما نشان می‌دهد.

---

## ۳) رویدادها

`/api/events` می‌تواند آرایهٔ مستقیم یا `{events:[…]}` / `{items:[…]}` باشد. برای هر رویداد:

```json
{ "id": "ev-1", "ts": 1700000000, "level": "warn", "category": "band",
  "title": "تغییر باند", "detail": "…", "source": "zlt" }
```

* `ts` ثانیه یا میلی‌ثانیه پذیرفته می‌شود (کمتر از ۱۰ رقم = ثانیه).
* `message`/`msg` جای `title` و `detail`/`description` جای متن جزئیات پذیرفته می‌شود.
* `severity` جای `level` پذیرفته می‌شود.

---

## ۴) عملیات

`/api/actions` آرایهٔ عملیات یا `{actions:[…]}` است:

```json
{ "name": "band_lock", "label": "قفل باند", "plugin": "zlt", "danger": false,
  "description": "…", "params": [{"key": "band", "label": "باند", "type": "select", "options": ["B1","B3"]}] }
```

اپ فرم پارامترها را **از همین schema** می‌سازد (`str`, `int`, `bool`, `select`).
اجرای عملیات: `POST /api/action/<name>` با بدنهٔ JSON پارامترها.

اگر پنل عملیات را برنگرداند، اپ از یک فهرست داخلی (همان عملیات پلاگین `zlt`/`wifi`) استفاده می‌کند
تا همهٔ دکمه‌ها در دسترس بمانند؛ نتیجهٔ واقعی همچنان از پنل خوانده می‌شود.

**عملیات حساس** (ریبوت، قفل باند، تغییر APN/وای‌فای) در اپ دو مرحله تأیید می‌گیرند و
در «Audit» محلی ثبت می‌شوند؛ پنل هم بکاپ و ثبت خودش را انجام می‌دهد.

---

## ۵) پلاگین‌ها

`/api/plugins` آرایه یا `{plugins:[…]}`:

```json
{ "id": "ping", "name": "پینگ", "icon": "★", "kind": "monitor", "interval": 5,
  "enabled": true, "description": "…", "emits": ["rtt_ms"],
  "config_schema": [{"key":"count","label":"تعداد بسته","type":"int","default":3}] }
```

اپ: فهرست، سوییچ روشن/خاموش (`POST /api/plugins/<id>` با `{enabled}`)، فرم تنظیمات
از `config_schema` و ذخیره با `{config: {...}}`.

---

## ۶) افزودن نام فیلد جدید (مثال)

فرض کنید پنل شما RSRP را با کلید `nrSignal` برمی‌گرداند. در `adapt.js`:

```js
rsrp: num(find(flat, ['rsrp', 'rsrp_dbm', 'nrSignal', 'lte_rsrp', 'nr_rsrp'])),
```

همین. هیچ فایل دیگری لازم نیست تغییر کند.

برای فیلد کاملاً جدید (مثلاً «دمای SIM»):

```js
// در خروجی A.status اضافه کنید
simTemp: num(find(flat, ['sim_temp', 'simtemperature'])),
```

و در تب دلخواه از `state.live.simTemp` استفاده کنید.

> راه سریع‌تر برای پیدا کردن نام واقعی: در اپ **شبکه → پاسخ خام پنل** را باز کنید و
> عبارت مورد نظر (مثلاً `rsrp`) را جست‌وجو کنید.
