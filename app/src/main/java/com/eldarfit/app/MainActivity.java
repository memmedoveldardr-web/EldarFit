package com.eldarfit.app;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.SafeBrowsingResponse;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int REQ_EXPORT = 1401;
    private static final int REQ_IMPORT = 1402;
    private WebView webView;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private String pendingExportJson;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(246, 247, 249));

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            s.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new LocalOnlyWebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new NativeBridge(), "EldarNative");
        webView.loadUrl("file:///android_asset/index.html");
        setContentView(webView);
    }

    public WebView getWebViewForTests() {
        return webView;
    }

    private final class LocalOnlyWebViewClient extends WebViewClient {
        private boolean isAllowed(Uri uri) {
            return uri != null
                    && "file".equalsIgnoreCase(uri.getScheme())
                    && "/android_asset/index.html".equals(uri.getPath());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            return !isAllowed(uri);
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            try {
                return !isAllowed(Uri.parse(url));
            } catch (Exception e) {
                return true;
            }
        }
    }

    public final class NativeBridge {
        @JavascriptInterface
        public void searchUsda(String query, String requestId, String apiKey) {
            final String q = query == null ? "" : query.trim();
            final String rid = requestId == null ? "" : requestId;
            if (q.length() < 2 || q.length() > 120) {
                callbackSearch(rid, false, null, "Axtarış 2–120 simvol olmalıdır.");
                return;
            }
            executor.execute(() -> {
                try {
                    String raw = FoodDataClient.search(q, apiKey, 15);
                    callbackSearch(rid, true, raw, null);
                } catch (Exception e) {
                    callbackSearch(rid, false, null, safeMessage(e));
                }
            });
        }

        @JavascriptInterface
        public void testInternet(String requestId) {
            final String rid = requestId == null ? "" : requestId;
            executor.execute(() -> {
                try {
                    String raw = FoodDataClient.search("oats", "DEMO_KEY", 1);
                    callbackInternet(rid, true, raw, null);
                } catch (Exception e) {
                    callbackInternet(rid, false, null, safeMessage(e));
                }
            });
        }

        @JavascriptInterface
        public void exportBackup(String json) {
            if (json == null || json.length() > 4_000_000) return;
            pendingExportJson = json;
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "EldarFit-backup.json");
                startActivityForResult(intent, REQ_EXPORT);
            });
        }

        @JavascriptInterface
        public void importBackup() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent, REQ_IMPORT);
            });
        }
    }

    private String safeMessage(Exception e) {
        String m = e.getMessage();
        if (m == null || m.trim().isEmpty()) return e.getClass().getSimpleName();
        return m.length() > 220 ? m.substring(0, 220) : m;
    }

    private void callbackSearch(String requestId, boolean ok, String raw, String error) {
        try {
            JSONObject wrapper = new JSONObject();
            wrapper.put("ok", ok);
            if (ok && raw != null) wrapper.put("payload", new JSONObject(raw));
            else wrapper.put("error", error == null ? "Naməlum xəta" : error);
            String js = "window.EldarFitV14&&window.EldarFitV14.onNativeSearchResult("
                    + JSONObject.quote(requestId) + "," + wrapper.toString() + ");";
            runJs(js);
        } catch (Exception e) {
            runJs("window.EldarFitV14&&window.EldarFitV14.onNativeSearchResult("
                    + JSONObject.quote(requestId) + ",{ok:false,error:'JSON parse xətası'});");
        }
    }

    private void callbackInternet(String requestId, boolean ok, String raw, String error) {
        JSONObject wrapper = new JSONObject();
        try {
            wrapper.put("ok", ok);
            wrapper.put("source", "USDA FoodData Central");
            if (ok && raw != null) {
                JSONObject obj = new JSONObject(raw);
                wrapper.put("count", obj.optInt("totalHits", 0));
            } else wrapper.put("error", error == null ? "Şəbəkə xətası" : error);
        } catch (Exception ignored) {}
        runJs("window.EldarFitV14&&window.EldarFitV14.onInternetTestResult("
                + JSONObject.quote(requestId) + "," + wrapper.toString() + ");");
    }

    private void runJs(String js) {
        if (webView == null) return;
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        if (requestCode == REQ_EXPORT && pendingExportJson != null) {
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                if (out != null) {
                    out.write(pendingExportJson.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                    runJs("window.EldarFitV14&&window.EldarFitV14.onBackupExported(true);");
                }
            } catch (Exception e) {
                runJs("window.EldarFitV14&&window.EldarFitV14.onBackupExported(false);");
            } finally {
                pendingExportJson = null;
            }
        } else if (requestCode == REQ_IMPORT) {
            executor.execute(() -> {
                try (InputStream in = getContentResolver().openInputStream(uri);
                     BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    int total = 0;
                    while ((line = br.readLine()) != null) {
                        total += line.length();
                        if (total > 4_000_000) throw new IllegalArgumentException("Backup faylı çox böyükdür.");
                        sb.append(line);
                    }
                    runJs("window.EldarFitV14&&window.EldarFitV14.onBackupImported("
                            + JSONObject.quote(sb.toString()) + ");");
                } catch (Exception e) {
                    runJs("window.EldarFitV14&&window.EldarFitV14.onBackupImported(null);");
                }
            });
        }
    }

    @Override
    protected void onDestroy() {
        executor.shutdownNow();
        if (webView != null) webView.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
