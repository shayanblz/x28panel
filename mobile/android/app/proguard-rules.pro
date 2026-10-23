# Keep the JavaScript bridge; it is called by name from the WebView.
-keepclassmembers class ir.x28panel.mobile.NativeBridge {
    public *;
}
-keep class ir.x28panel.mobile.NativeBridge { *; }
