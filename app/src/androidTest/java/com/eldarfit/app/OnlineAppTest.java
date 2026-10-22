package com.eldarfit.app;

import static org.junit.Assert.*;

import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class OnlineAppTest {
    private ActivityScenario<MainActivity> scenario;

    @Before
    public void setUp() throws Exception {
        scenario = ActivityScenario.launch(MainActivity.class);
        waitForJs("typeof window.EldarFitV14==='object'", 12000);
    }

    @After
    public void tearDown() {
        if (scenario != null) scenario.close();
    }

    private String unquote(String value) throws Exception {
        if (value == null) return null;
        if ("null".equals(value)) return null;
        if (value.startsWith("\"")) return new JSONArray("[" + value + "]").getString(0);
        return value;
    }

    private String eval(String js) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> ref = new AtomicReference<>();
        scenario.onActivity(a -> {
            WebView w = a.getWebViewForTests();
            w.evaluateJavascript(js, v -> { ref.set(v); latch.countDown(); });
        });
        assertTrue("JavaScript callback timed out", latch.await(6, TimeUnit.SECONDS));
        return ref.get();
    }

    private void waitForJs(String condition, long timeoutMs) throws Exception {
        long end = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < end) {
            try {
                if ("true".equals(eval("(" + condition + ")"))) return;
            } catch (Throwable ignored) {}
            Thread.sleep(180);
        }
        fail("Condition timed out: " + condition);
    }

    @Test
    public void appLoadsAndCoreSelfTestPasses() throws Exception {
        String raw = unquote(eval("JSON.stringify(window.EldarFitV14.selfTest())"));
        JSONObject obj = new JSONObject(raw);
        assertTrue(obj.getBoolean("ok"));
        assertEquals(14, obj.getInt("schema"));
        assertTrue(obj.getJSONObject("macro50").getDouble("kcal") > 170);
    }

    @Test
    public void legacyProductMigrationRepairsMetadata() throws Exception {
        String raw = unquote(eval("(function(){localStorage.setItem('customFoods_v12',JSON.stringify([{id:'legacy_x',name:'Legacy oats',cat:'carb',unit:'q',kcal:380,p:13,c:67,f:7}]));localStorage.setItem('eldarfitSchemaVersion','13');window.EldarFitV14.repairData(false);return JSON.stringify(JSON.parse(localStorage.getItem('customFoods_v12'))[0]);})()"));
        JSONObject p = new JSONObject(raw);
        assertEquals("g", p.getString("baseUnit"));
        assertTrue(p.has("portions"));
        assertTrue(p.has("source"));
    }

    @Test
    public void smartSwapCanOpenRepeatedlyWithoutFreezing() throws Exception {
        eval("document.querySelector('.bottom-nav [data-nav=\"food\"]').click();'ok'");
        waitForJs("document.querySelectorAll('#mealList .food-chip').length>0", 7000);
        for (int i=0;i<10;i++) {
            eval("(function(){var c=document.querySelector('#mealList .food-chip');c.click();return 'opened';})()");
            waitForJs("document.querySelector('#modalBackdrop').classList.contains('open')", 2500);
            eval("document.querySelector('#closeModal').click();'closed'");
            waitForJs("!document.querySelector('#modalBackdrop').classList.contains('open')", 2500);
        }
        assertEquals("4", eval("2+2"));
    }

    @Test
    public void productManagerAndMealPlannerControlsExist() throws Exception {
        eval("document.querySelector('.bottom-nav [data-nav=\"food\"]').click();'ok'");
        waitForJs("document.querySelectorAll('#mealList .meal-tools-v14').length>0", 7000);
        assertTrue(Integer.parseInt(eval("document.querySelectorAll('#mealList .meal-tools-v14').length")) >= 5);
        eval("window.EldarFitV14.openProductManager();'ok'");
        waitForJs("document.querySelector('#pmNew')!==null", 2500);
        assertEquals("true", eval("document.querySelector('#pmOnline')!==null"));
    }

    @Test
    public void usdaInternetSearchWorksThroughNativeBridge() throws Exception {
        eval("window.EldarFitV14.openOnlineSearch(null);document.querySelector('#usdaQuery').value='bulgur';document.querySelector('#usdaGo').click();'started'");
        long end=System.currentTimeMillis()+18000;
        while(System.currentTimeMillis()<end){
            int count=Integer.parseInt(eval("document.querySelectorAll('#usdaResults .choice-btn').length"));
            if(count>0){assertTrue(count>0);return;}
            String status=unquote(eval("document.querySelector('#usdaStatus').textContent"));
            if(status!=null && status.startsWith("Xəta:")) fail(status);
            Thread.sleep(350);
        }
        fail("USDA internet search timed out");
    }
}
