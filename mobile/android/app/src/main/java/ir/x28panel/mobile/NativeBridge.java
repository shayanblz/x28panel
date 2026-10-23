package ir.x28panel.mobile;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The bridge between the web UI and Android. It deliberately avoids CORS and
 * mixed-content restrictions by performing HTTP requests natively, and offers
 * a few conveniences (share, save file, vibrate, keep screen on).
 */
public class NativeBridge {

    private final MainActivity activity;

    NativeBridge(MainActivity activity) {
        this.activity = activity;
    }

    private static String ok(Object value) {
        return "{\"ok\":true,\"value\":" + JSONObject.quote(String.valueOf(value)) + "}";
    }

    @JavascriptInterface
    public String info() {
        try {
            JSONObject o = new JSONObject();
            o.put("version", BuildConfig.VERSION_NAME);
            o.put("versionCode", BuildConfig.VERSION_CODE);
            o.put("sdk", Build.VERSION.SDK_INT);
            o.put("device", Build.MANUFACTURER + " " + Build.MODEL);
            o.put("package", BuildConfig.APPLICATION_ID);
            o.put("debug", BuildConfig.DEBUG);
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public String appVersion() {
        return BuildConfig.VERSION_NAME;
    }

    /** Native HTTP: returns {status, headers, body, ms} or {status:0, error}. */
    @JavascriptInterface
    public String http(String method, String url, String headersJson, String body, int timeoutMs) {
        long started = System.currentTimeMillis();
        JSONObject out = new JSONObject();
        HttpURLConnection conn = null;
        int timeout = Math.max(1200, Math.min(60000, timeoutMs <= 0 ? 8000 : timeoutMs));
        try {
            if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
                throw new IllegalArgumentException("unsupported url");
            }
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(timeout);
            conn.setReadTimeout(timeout);
            conn.setRequestMethod((method == null ? "GET" : method.toUpperCase(Locale.US)));
            conn.setInstanceFollowRedirects(true);
            conn.setUseCaches(false);
            conn.setRequestProperty("User-Agent", "X28Mobile/" + BuildConfig.VERSION_NAME + " (Android)");

            boolean hasContentType = false;
            if (headersJson != null && !headersJson.isEmpty()) {
                JSONObject headers = new JSONObject(headersJson);
                Iterator<String> keys = headers.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    String value = headers.optString(key, "");
                    if (key.equalsIgnoreCase("Content-Type")) {
                        hasContentType = true;
                    }
                    conn.setRequestProperty(key, value);
                }
            }
            if (body != null) {
                if (!hasContentType) {
                    conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                }
                conn.setDoOutput(true);
                byte[] payload = body.getBytes(StandardCharsets.UTF_8);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(payload);
                    os.flush();
                }
            }

            int status = conn.getResponseCode();
            InputStream stream = status >= 400 ? conn.getErrorStream() : conn.getInputStream();
            String text = readAll(stream, 3 * 1024 * 1024);

            JSONObject responseHeaders = new JSONObject();
            for (Map.Entry<String, List<String>> entry : conn.getHeaderFields().entrySet()) {
                if (entry.getKey() == null) continue;
                StringBuilder joined = new StringBuilder();
                for (String part : entry.getValue()) {
                    if (joined.length() > 0) joined.append(", ");
                    joined.append(part);
                }
                responseHeaders.put(entry.getKey(), joined.toString());
            }

            out.put("status", status);
            out.put("headers", responseHeaders);
            out.put("body", text);
            out.put("ms", System.currentTimeMillis() - started);
        } catch (Exception e) {
            try {
                out.put("status", 0);
                out.put("error", e.getClass().getSimpleName() + ": " + String.valueOf(e.getMessage()));
                out.put("ms", System.currentTimeMillis() - started);
            } catch (Exception ignored) { }
        } finally {
            if (conn != null) conn.disconnect();
        }
        return out.toString();
    }

    /** TCP connect latency, useful when ICMP is blocked by the carrier. */
    @JavascriptInterface
    public String pingTcp(String host, int port, int timeoutMs) {
        int timeout = Math.max(200, Math.min(15000, timeoutMs <= 0 ? 1500 : timeoutMs));
        Socket socket = new Socket();
        long started = System.currentTimeMillis();
        try {
            socket.connect(new InetSocketAddress(host, port <= 0 ? 80 : port), timeout);
            long ms = System.currentTimeMillis() - started;
            return "{\"ok\":true,\"ms\":" + ms + "}";
        } catch (Exception e) {
            return "{\"ok\":false,\"error\":" + JSONObject.quote(String.valueOf(e.getMessage())) + "}";
        } finally {
            try { socket.close(); } catch (Exception ignored) { }
        }
    }

    @JavascriptInterface
    public void toast(final String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, String.valueOf(message), Toast.LENGTH_SHORT).show());
    }

    @JavascriptInterface
    public void share(final String title, final String text) {
        activity.runOnUiThread(() -> {
            try {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, String.valueOf(title));
                send.putExtra(Intent.EXTRA_TEXT, String.valueOf(text));
                activity.startActivity(Intent.createChooser(send, "اشتراک‌گذاری"));
            } catch (Exception e) {
                Toast.makeText(activity, "اشتراک‌گذاری ممکن نشد", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @JavascriptInterface
    public String saveFile(String name, String content, String mime) {
        String safeName = String.valueOf(name == null ? "x28-export.txt" : name).replaceAll("[\\\\/:*?\"<>|]", "-");
        String type = mime == null || mime.isEmpty() ? "text/plain" : mime;
        byte[] bytes = String.valueOf(content == null ? "" : content).getBytes(StandardCharsets.UTF_8);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Literal URI keeps this code loadable on older Android versions
                // (MediaStore.Downloads itself only exists from API 29).
                Uri collection = Uri.parse("content://media/external/downloads");
                ContentValues values = new ContentValues();
                values.put("_display_name", safeName);
                values.put("mime_type", type);
                values.put("relative_path", Environment.DIRECTORY_DOWNLOADS + "/X28");
                Uri uri = activity.getContentResolver().insert(collection, values);
                if (uri == null) throw new IllegalStateException("media store refused");
                try (OutputStream os = activity.getContentResolver().openOutputStream(uri)) {
                    if (os == null) throw new IllegalStateException("no output stream");
                    os.write(bytes);
                    os.flush();
                }
                JSONObject o = new JSONObject();
                o.put("ok", true);
                o.put("path", "Download/X28/" + safeName);
                return o.toString();
            }
            File dir = new File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "X28");
            if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("cannot create folder");
            File file = new File(dir, safeName);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(bytes);
            }
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("path", file.getAbsolutePath());
            return o.toString();
        } catch (Exception e) {
            try {
                JSONObject o = new JSONObject();
                o.put("ok", false);
                o.put("error", String.valueOf(e.getMessage()));
                return o.toString();
            } catch (Exception ignored) {
                return "{\"ok\":false}";
            }
        }
    }

    @JavascriptInterface
    public String clipboard(String text) {
        activity.runOnUiThread(() -> {
            try {
                ClipboardManager cm = (ClipboardManager) activity.getSystemService(Context.CLIPBOARD_SERVICE);
                cm.setPrimaryClip(ClipData.newPlainText("X28", String.valueOf(text)));
            } catch (Exception ignored) { }
        });
        return ok("copied");
    }

    @JavascriptInterface
    public void openUrl(final String url) {
        if (url == null) return;
        activity.runOnUiThread(() -> {
            try {
                String target = url;
                if (!target.startsWith("http://") && !target.startsWith("https://")) {
                    target = "http://" + target;
                }
                activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)));
            } catch (Exception e) {
                Toast.makeText(activity, "مرورگر پیدا نشد", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @JavascriptInterface
    public void vibrate(int ms) {
        try {
            Vibrator v = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            int duration = Math.max(5, Math.min(80, ms));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(duration);
            }
        } catch (Exception ignored) { }
    }

    @JavascriptInterface
    public void setKeepAwake(final boolean on) {
        activity.runOnUiThread(() -> {
            if (on) {
                activity.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                activity.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    @JavascriptInterface
    public void setSystemBars(boolean dark) {
        activity.applySystemBars(dark);
    }

    @JavascriptInterface
    public void exit() {
        activity.runOnUiThread(activity::finish);
    }

    private static String readAll(InputStream stream, int limit) throws Exception {
        if (stream == null) return "";
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[16 * 1024];
        int read;
        int total = 0;
        while ((read = stream.read(chunk)) != -1) {
            total += read;
            if (total > limit) {
                buffer.write(chunk, 0, Math.max(0, read - (total - limit)));
                break;
            }
            buffer.write(chunk, 0, read);
        }
        stream.close();
        return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
    }
}
