package com.eldarfit.app;

import static org.junit.Assert.*;

import android.webkit.WebView;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RunWith(AndroidJUnit4.class)
public class OfflineAppTest {
    private String eval(ActivityScenario<MainActivity> scenario, String js) throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        AtomicReference<String> ref=new AtomicReference<>();
        scenario.onActivity(a->a.getWebViewForTests().evaluateJavascript(js,v->{ref.set(v);latch.countDown();}));
        assertTrue(latch.await(7, TimeUnit.SECONDS));
        return ref.get();
    }
    private String unquote(String value) throws Exception {
        if(value!=null && value.startsWith("\"")) return new JSONArray("["+value+"]").getString(0);
        return value;
    }

    @Test
    public void offlineCoreStillWorksAndLocalDataPersists() throws Exception {
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            long end=System.currentTimeMillis()+10000;
            while(System.currentTimeMillis()<end){
                if("object".equals(unquote(eval(scenario,"typeof window.EldarFitV14"))))break;
                Thread.sleep(200);
            }
            String raw=unquote(eval(scenario,"JSON.stringify(window.EldarFitV14.selfTest())"));
            assertTrue(new JSONObject(raw).getBoolean("ok"));
            String persisted=unquote(eval(scenario,"(function(){localStorage.setItem('offline_probe_v14','works');return localStorage.getItem('offline_probe_v14');})()"));
            assertEquals("works",persisted);
            eval(scenario,"document.querySelector('.bottom-nav [data-nav=\"food\"]').click();'ok'");
            Thread.sleep(500);
            assertTrue(Integer.parseInt(eval(scenario,"document.querySelectorAll('#mealList .meal-row').length"))>=5);
        }
    }
}
