# FinTrack Mobile Production Hardening & Obfuscation ProGuard Rules

# ── General Code Shrinking & Obfuscation ──────────────────────────
-repackageclasses ''
-allowaccessmodification
-renamesourcefileattribute SourceFile
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# ── Capacitor Bridge & Plugins ───────────────────────────────────
-keep public class * extends com.getcapacitor.Plugin {
    public <fields>;
    public <methods>;
}
-keep public class com.getcapacitor.** { *; }
-keep class * implements com.getcapacitor.PluginMethod { *; }

# ── WebKit JavaScript Interfaces ────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── AndroidX & UI Components ─────────────────────────────────────
-keep class androidx.core.splashscreen.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }

# ── Remove Verbose Logging in Release ───────────────────────────
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
