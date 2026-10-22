(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const get=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  function isoToday(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function addMacros(a,b){return {kcal:a.kcal+b.kcal,p:a.p+b.p,c:a.c+b.c,f:a.f+b.f}}
  function subMacros(a,b){return {kcal:a.kcal-b.kcal,p:a.p-b.p,c:a.c-b.c,f:a.f-b.f}}
  function fmt(n,d=0){return Number.isFinite(+n)?(+n).toFixed(d):'—'}

  function modalOpen(title,eye,node){
    const back=$('#modalBackdrop'),body=$('#modalBody');
    $('#modalTitle').textContent=title;
    $('#modalEyebrow').textContent=eye;
    body.innerHTML='';
    body.appendChild(node);
    back.classList.add('open');
    back.setAttribute('aria-hidden','false');
  }

  function api(){return window.EldarFitNutrition||null}

  function currentDay(){
    const b=$('#dayTabs button.active');
    return b?Number(b.dataset.day):0;
  }

  function skips(){return get('skippedFoods_v13',{})}
  function skipStorageKey(chip){
    return isoToday()+'|'+(chip.dataset.v12key||'');
  }

  function chipMacros(chip){
    const A=api(); if(!A)return null;
    const key=chip.dataset.v12key;
    const sw=A.foodSwaps()[key];
    if(sw&&sw.macros)return sw.macros;
    const text=chip.dataset.v12original||chip.textContent.replace('↔','').trim();
    const p=A.parseFood(text);
    return p?p.macros:null;
  }

  function prepState(text){
    const t=String(text).toLowerCase();
    if(t.includes('quru'))return 'QURU';
    if(t.includes('çiy'))return 'ÇİY';
    if(t.includes('süzülmüş'))return 'SÜZÜLMÜŞ';
    return '';
  }

  function calculateDay(){
    let planned={kcal:0,p:0,c:0,f:0};
    let actual={kcal:0,p:0,c:0,f:0};
    const sk=skips();
    $$('#mealList .food-chip').forEach(chip=>{
      const m=chipMacros(chip);
      if(!m)return;
      planned=addMacros(planned,m);
      if(!sk[skipStorageKey(chip)])actual=addMacros(actual,m);
    });
    return {planned,actual};
  }

  function suggestionFor(actual){
    const A=api(); if(!A)return {status:'—',text:'Hesablayıcı hazırlanır.'};
    const target={kcal:2375,p:147.5};
    const dk=target.kcal-actual.kcal;
    const dp=target.p-actual.p;
    const foods=A.allFoods();

    if(dk < -180){
      return {status:'Kalori yüksək',text:'Faktiki plan hədəfdən təxminən '+Math.abs(Math.round(dk))+' kcal yuxarıdır. Bu gün əlavə tamamlayıcıya ehtiyac yoxdur; növbəti əvəzləmədə daha aşağı kalorili alternativ seç.'};
    }

    if(Math.abs(dk)<=120 && dp<=10){
      return {status:'Hədəfə yaxın',text:'Kalori və protein hədəfi praktik olaraq yerindədir. Əlavə qida məcburi deyil.'};
    }

    if(dp>12 && foods.whey){
      let q=Math.round((dp/(foods.whey.m.p/100))/5)*5;
      q=Math.max(20,Math.min(45,q));
      const wm=A.macrosFor({id:'whey',...foods.whey},q);
      let text=q+' q whey ≈ '+Math.round(wm.kcal)+' kcal və '+fmt(wm.p,1)+' q protein.';
      const afterK=dk-wm.kcal;
      if(afterK>140 && foods.banana){
        let bq=Math.round((afterK/(foods.banana.m.kcal/100))/10)*10;
        bq=Math.max(80,Math.min(200,bq));
        const bm=A.macrosFor({id:'banana',...foods.banana},bq);
        text+=' Enerji də aşağı qalırsa, əlavə '+bq+' q banan ≈ '+Math.round(bm.kcal)+' kcal uyğun olar.';
      }
      return {status:'Protein tamamla',text:text};
    }

    if(dk>180 && foods.bulgur){
      let q=Math.round((dk/(foods.bulgur.m.kcal/100))/5)*5;
      q=Math.max(35,Math.min(85,q));
      const m=A.macrosFor({id:'bulgur',...foods.bulgur},q);
      return {status:'Enerji tamamla',text:q+' q quru bulqur ≈ '+Math.round(m.kcal)+' kcal. Bu miqdar günün enerji boşluğunu praktik şəkildə bağlayır.'};
    }

    if(dk>80 && foods.banana){
      let q=Math.round((dk/(foods.banana.m.kcal/100))/10)*10;
      q=Math.max(80,Math.min(180,q));
      const m=A.macrosFor({id:'banana',...foods.banana},q);
      return {status:'Kiçik tamamlayıcı',text:q+' q banan ≈ '+Math.round(m.kcal)+' kcal. Günlük kalorinin aşağı qalmasının qarşısını almaq üçün kifayətdir.'};
    }

    if(dp>8){
      return {status:'Protein azdır',text:'Protein hədəfindən təxminən '+Math.round(dp)+' q aşağısan. Yağsız protein mənbəyini artırmaq daha məqsədəuyğundur.'};
    }

    return {status:'Yaxşı',text:'Hazırkı faktiki plan hədəfə kifayət qədər yaxındır.'};
  }

  function refreshDaySummary(){
    if(!api())return;
    const {planned,actual}=calculateDay();
    const p=$('#plannedMacroSummary'),a=$('#actualMacroSummary');
    if(p)p.textContent=Math.round(planned.kcal)+' kcal · P '+fmt(planned.p,0)+' · C '+fmt(planned.c,0)+' · F '+fmt(planned.f,0);
    if(a)a.textContent=Math.round(actual.kcal)+' kcal · P '+fmt(actual.p,0)+' · C '+fmt(actual.c,0)+' · F '+fmt(actual.f,0);

    const sug=suggestionFor(actual);
    if($('#adjustStatus'))$('#adjustStatus').textContent=sug.status;
    if($('#adjustSuggestion'))$('#adjustSuggestion').textContent=sug.text;
  }

  function decorateFood(){
    if(!api())return;
    const sk=skips();
    $$('#mealList .food-chip').forEach(chip=>{
      const parent=chip.parentElement;
      if(!parent)return;
      const key=skipStorageKey(chip);
      chip.classList.toggle('skipped-food',!!sk[key]);

      if(!parent.querySelector('.prep-badge[data-for="'+CSS.escape(chip.dataset.v12key||'')+'"]')){
        const st=prepState(chip.dataset.v12original||chip.textContent);
        if(st){
          const badge=document.createElement('span');
          badge.className='prep-badge';
          badge.dataset.for=chip.dataset.v12key||'';
          badge.textContent=st;
          parent.appendChild(badge);
        }
      }

      if(!parent.querySelector('.skip-food[data-for="'+CSS.escape(chip.dataset.v12key||'')+'"]')){
        const b=document.createElement('button');
        b.type='button';
        b.className='skip-food'+(sk[key]?' skipped':'');
        b.dataset.for=chip.dataset.v12key||'';
        b.textContent=sk[key]?'↩ Geri al':'⊘ Yemədim';
        b.onclick=e=>{
          e.preventDefault();e.stopPropagation();
          const map=skips();
          if(map[key])delete map[key];else map[key]=true;
          set('skippedFoods_v13',map);
          decorateFood();
          refreshDaySummary();
        };
        parent.appendChild(b);
      }else{
        const b=parent.querySelector('.skip-food[data-for="'+CSS.escape(chip.dataset.v12key||'')+'"]');
        b.classList.toggle('skipped',!!sk[key]);
        const wanted=sk[key]?'↩ Geri al':'⊘ Yemədim';
        if(b.textContent!==wanted)b.textContent=wanted;
      }
    });
    refreshDaySummary();
  }

  let timerInterval=null;
  function timerState(){return get('restTimer_v13',null)}
  function setTimerState(v){v?set('restTimer_v13',v):localStorage.removeItem('restTimer_v13')}

  function formatSecs(s){
    s=Math.max(0,Math.ceil(s));
    const m=Math.floor(s/60),sec=s%60;
    return m?m+':'+String(sec).padStart(2,'0'):sec+' san';
  }

  function tickTimer(){
    const state=timerState();
    const val=$('#restTimerValue'),hint=$('#restTimerHint');
    if(!state){
      if(val)val.textContent='Hazır';
      if(hint)hint.textContent='Set saxlananda avtomatik başlaya bilər.';
      return;
    }
    const remain=(state.end-Date.now())/1000;
    if(remain<=0){
      setTimerState(null);
      clearInterval(timerInterval);timerInterval=null;
      if(val)val.textContent='Bitdi ✓';
      if(hint)hint.textContent='Növbəti setə hazırsan.';
      if(navigator.vibrate)navigator.vibrate([120,80,120]);
      $$('.timer-actions button').forEach(x=>x.classList.remove('active'));
      return;
    }
    if(val)val.textContent=formatSecs(remain);
    if(hint)hint.textContent=state.label||'İstirahət';
  }

  function startTimer(sec,label){
    setTimerState({end:Date.now()+sec*1000,label:label||'İstirahət'});
    if(timerInterval)clearInterval(timerInterval);
    timerInterval=setInterval(tickTimer,250);
    tickTimer();
    $$('.timer-actions [data-rest]').forEach(x=>x.classList.toggle('active',Number(x.dataset.rest)===sec));
  }

  function stopTimer(){
    setTimerState(null);
    if(timerInterval)clearInterval(timerInterval);
    timerInterval=null;
    tickTimer();
    $$('.timer-actions button').forEach(x=>x.classList.remove('active'));
  }

  $$('.timer-actions [data-rest]').forEach(b=>b.addEventListener('click',()=>startTimer(Number(b.dataset.rest),'Manual rest timer')));
  if($('#restStop'))$('#restStop').addEventListener('click',stopTimer);

  function compoundExercise(name){
    return /(squat|press|row|pulldown|pull-up|hip thrust|leg press|dips)/i.test(name) &&
      !/(lateral raise|pushdown|curl|face pull|reverse pec|calf|crunch|extension)/i.test(name);
  }

  window.addEventListener('eldarfit:setSaved',e=>{
    const d=e.detail||{};
    const sec=compoundExercise(d.exercise||'')?150:75;
    startTimer(sec,(d.exercise||'Set')+' sonrası');
    setTimeout(enhanceWorkoutTrends,50);
  });

  function workoutLogs(){return get('workoutLogs_v11',[])}
  function currentWorkoutDay(){const b=$('#workoutTabs button.active');return b?b.dataset.work:'A'}
  function e1rm(setx){const w=+setx.weight,r=+setx.reps;if(!w||!r)return 0;return w*(1+r/30)}
  function logStrength(log){return Math.max(0,...(log.sets||[]).map(e1rm))}
  function logVolume(log){return (log.sets||[]).reduce((s,x)=>s+(+x.weight||0)*(+x.reps||0),0)}

  function drawTrend(canvas,points){
    const ctx=canvas.getContext('2d');
    const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    const w=canvas.clientWidth||330,h=180;
    canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const cs=getComputedStyle(document.documentElement);
    const text=cs.getPropertyValue('--text').trim()||'#111';
    const muted=cs.getPropertyValue('--muted').trim()||'#777';
    const border=cs.getPropertyValue('--border').trim()||'#ddd';
    const pad={l:34,r:12,t:15,b:26},gw=w-pad.l-pad.r,gh=h-pad.t-pad.b;
    ctx.strokeStyle=border;ctx.lineWidth=1;
    for(let i=0;i<4;i++){const y=pad.t+i*gh/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}
    if(points.length<2){ctx.fillStyle=muted;ctx.font='12px sans-serif';ctx.fillText('Qrafik üçün ən azı 2 məşq qeydi lazımdır.',pad.l,pad.t+25);return}
    let min=Math.min(...points.map(x=>x.v)),max=Math.max(...points.map(x=>x.v));
    if(max-min<2){min-=1;max+=1}
    const pts=points.map((x,i)=>({x:pad.l+i*gw/(points.length-1),y:pad.t+(max-x.v)/(max-min)*gh,...x}));
    ctx.strokeStyle=text;ctx.lineWidth=2.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
    ctx.fillStyle=text;pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()});
    ctx.fillStyle=muted;ctx.font='10px sans-serif';ctx.fillText(max.toFixed(1),2,pad.t+4);ctx.fillText(min.toFixed(1),2,pad.t+gh+3);
    ctx.fillText(points[0].date.slice(5),pad.l,h-7);const end=points[points.length-1].date.slice(5);ctx.fillText(end,w-pad.r-ctx.measureText(end).width,h-7);
  }

  function openTrend(day,idx,name){
    const logs=workoutLogs().filter(x=>x.day===day&&x.index===idx).slice(-10);
    const root=document.createElement('div');
    const card=document.createElement('div');card.className='trend-card';
    const canvas=document.createElement('canvas');canvas.height=180;card.appendChild(canvas);
    const summary=document.createElement('div');summary.className='trend-summary';
    if(logs.length){
      const latest=logs[logs.length-1],best=Math.max(...logs.map(logStrength));
      summary.innerHTML='<span>Son e1RM: <b>'+fmt(logStrength(latest),1)+' kg</b></span><span>Ən yaxşı: <b>'+fmt(best,1)+' kg</b></span><span>Son həcm: <b>'+Math.round(logVolume(latest))+' kg</b></span>';
    }else summary.textContent='Hələ qeyd yoxdur.';
    card.appendChild(summary);root.appendChild(card);
    const note=document.createElement('p');note.className='fineprint';note.textContent='e1RM Epley formuluna əsaslanan təxmini göstəricidir; real 1RM deyil.';root.appendChild(note);
    modalOpen(name,'GÜC TRENDİ',root);
    setTimeout(()=>drawTrend(canvas,logs.map(x=>({date:x.date,v:logStrength(x)}))),40);
  }

  function enhanceWorkoutTrends(){
    const day=currentWorkoutDay();
    $$('#exerciseList .exercise-row').forEach((row,idx)=>{
      const main=row.children[1],tools=main&&$('.exercise-tools',main);
      if(!tools||$('.trend-v13',tools))return;
      const b=document.createElement('button');
      b.type='button';b.className='log-btn trend-v13';b.textContent='↗ Qrafik';
      b.onclick=e=>{e.preventDefault();e.stopPropagation();openTrend(day,idx,$('.row-title',main).textContent)};
      tools.appendChild(b);
    });
  }

  function boot(){
    if(!api()){setTimeout(boot,80);return}
    decorateFood();
    refreshDaySummary();
    enhanceWorkoutTrends();
    tickTimer();
    if(timerState()&&!timerInterval)timerInterval=setInterval(tickTimer,250);

    const meal=$('#mealList'),exercise=$('#exerciseList');
    const mo=new MutationObserver(()=>setTimeout(decorateFood,10));
    if(meal)mo.observe(meal,{childList:true,subtree:true});
    const wo=new MutationObserver(()=>setTimeout(enhanceWorkoutTrends,10));
    if(exercise)wo.observe(exercise,{childList:true,subtree:true});

    $('#dayTabs')&&$('#dayTabs').addEventListener('click',()=>setTimeout(()=>{decorateFood();refreshDaySummary()},50));
    $('#workoutTabs')&&$('#workoutTabs').addEventListener('click',()=>setTimeout(enhanceWorkoutTrends,50));
  }

  setTimeout(boot,160);
})();