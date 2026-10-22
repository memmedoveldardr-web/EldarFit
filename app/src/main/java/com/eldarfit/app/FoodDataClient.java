package com.eldarfit.app;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import javax.net.ssl.HttpsURLConnection;
import java.net.URL;

public final class FoodDataClient {
    private static final String HOST = "api.nal.usda.gov";
    private static final String BASE = "https://" + HOST + "/fdc/v1/foods/search";

    private FoodDataClient() {}

    public static String search(String query, String apiKey, int pageSize) throws IOException {
        if (query == null || query.trim().isEmpty()) throw new IllegalArgumentException("Boş axtarış.");
        String key = apiKey == null ? "" : apiKey.trim();
        if (key.isEmpty()) key = "DEMO_KEY";
        int size = Math.max(1, Math.min(25, pageSize));
        String urlText = BASE
                + "?api_key=" + URLEncoder.encode(key, "UTF-8")
                + "&query=" + URLEncoder.encode(query.trim(), "UTF-8")
                + "&pageSize=" + size;

        URL url = new URL(urlText);
        if (!"https".equalsIgnoreCase(url.getProtocol()) || !HOST.equalsIgnoreCase(url.getHost())) {
            throw new SecurityException("İcazəsiz şəbəkə ünvanı.");
        }

        HttpsURLConnection c = (HttpsURLConnection) url.openConnection();
        c.setConnectTimeout(10000);
        c.setReadTimeout(12000);
        c.setRequestMethod("GET");
        c.setRequestProperty("Accept", "application/json");
        c.setRequestProperty("User-Agent", "EldarFit/1.4");
        c.setInstanceFollowRedirects(false);

        int code = c.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? c.getInputStream() : c.getErrorStream();
        String body = readLimited(stream, 1_500_000);
        c.disconnect();

        if (code < 200 || code >= 300) {
            if (code == 429) throw new IOException("USDA sorğu limiti dolub (429). Şəxsi API açarı istifadə et.");
            throw new IOException("USDA HTTP " + code);
        }
        return body;
    }

    private static String readLimited(InputStream in, int maxChars) throws IOException {
        if (in == null) return "";
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            char[] buf = new char[4096];
            int n;
            while ((n = br.read(buf)) != -1) {
                if (sb.length() + n > maxChars) throw new IOException("API cavabı çox böyükdür.");
                sb.append(buf, 0, n);
            }
            return sb.toString();
        }
    }
}
