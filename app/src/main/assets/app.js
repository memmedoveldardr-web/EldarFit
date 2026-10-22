(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem(k); }
  };

  const meals = [
    {title:'1-ci gün — məşq günü',items:[
      ['Səhər','3 yumurta · 60 q quru yulaf · 250 ml süd · 100 q banan'],
      ['Günorta','160 q çiy toyuq filesi · 80 q quru düyü · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Ara yemək','200 q Yunan yoqurtu · 180 q alma · 15 q badam'],
      ['Axşam','140 q yağsız mal əti · 350 q çiy kartof · 250 q tərəvəz · 10 q zeytun yağı'],
      ['Gecə','250 ml kefir']
    ]},
    {title:'2-ci gün — istirahət',items:[
      ['Səhər','3 yumurta · 80 q çörək · 80 q az yağlı kəsmik · 250 q tərəvəz · 150 q alma'],
      ['Günorta','140 q çiy toyuq filesi · 85 q quru bulqur · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Ara yemək','180 q Yunan yoqurtu · 120 q banan · 15 q qoz'],
      ['Axşam','130 q çiy somon · 350 q çiy kartof · 250 q tərəvəz'],
      ['Gecə','250 ml kefir']
    ]},
    {title:'3-cü gün — məşq günü',items:[
      ['Səhər','2 yumurta · 70 q quru yulaf · 250 ml süd · 120 q banan'],
      ['Məşqdən sonra','200 q Yunan yoqurtu · 180 q alma · 15 q badam'],
      ['Günorta','150 q yağsız mal əti · 80 q quru qarabaşaq · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Axşam','150 q çiy toyuq filesi · 80 q quru düyü · 250 q tərəvəz · 10 q zeytun yağı'],
      ['Gecə','250 ml kefir']
    ]},
    {title:'4-cü gün — istirahət',items:[
      ['Səhər','3 yumurta · 70 q çörək · 50 q kəsmik · 250 q tərəvəz · 180 q portağal'],
      ['Günorta','150 q çiy ağ balıq · 400 q çiy kartof · 300 q tərəvəz · 15 q zeytun yağı'],
      ['Ara yemək','200 q Yunan yoqurtu · 120 q banan · 20 q qoz'],
      ['Axşam','130 q yağsız mal əti · 90 q quru bulqur · 250 q tərəvəz · 10 q zeytun yağı'],
      ['Gecə','250 ml kefir']
    ]},
    {title:'5-ci gün — məşq günü',items:[
      ['Səhər','2 yumurta · 65 q quru yulaf · 250 ml süd · 120 q banan'],
      ['Günorta','150 q çiy toyuq filesi · 85 q quru düyü · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Ara yemək','200 q Yunan yoqurtu · 180 q alma · 20 q badam'],
      ['Axşam','130 q çiy somon · 350 q çiy kartof · 250 q tərəvəz'],
      ['Gecə','100 q kəsmik · 150 q portağal']
    ]},
    {title:'6-cı gün — istirahət',items:[
      ['Səhər','3 yumurta · 80 q çörək · 30 q ağ pendir · 250 q tərəvəz · 150 q alma'],
      ['Günorta','140 q yağsız mal əti · 85 q quru qarabaşaq · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Ara yemək','200 q Yunan yoqurtu · 100 q banan · 15 q qoz'],
      ['Axşam','140 q çiy toyuq filesi · 400 q çiy kartof · 250 q tərəvəz · 10 q zeytun yağı'],
      ['Gecə','250 ml kefir']
    ]},
    {title:'7-ci gün — istirahət',items:[
      ['Səhər','2 yumurta · 70 q quru yulaf · 250 ml süd · 150 q alma'],
      ['Günorta','150 q çiy toyuq filesi · 85 q quru bulqur · 300 q tərəvəz · 10 q zeytun yağı'],
      ['Ara yemək','200 q Yunan yoqurtu · 120 q banan · 15 q badam'],
      ['Axşam','180 q çiy ağ balıq · 80 q quru düyü · 250 q tərəvəz · 10 q zeytun yağı'],
      ['Gecə','100 q kəsmik · 150 q portağal']
    ]}
  ];

  const workouts = {
    A: [
      ['Smith Squat','3 × 6–10','Quadriceps · glute'],
      ['Flat Bench Press Machine','3 × 8–12','Orta sinə · triceps · ön çiyin'],
      ['Chest-Supported Row','3 × 8–12','Orta kürək · lat'],
      ['Leg Curl','2 × 12–15','Hamstring'],
      ['Machine Shoulder Press','2 × 8–12','Ön/orta çiyin'],
      ['Incline Dumbbell Curl','2 × 8–12','Biceps long head'],
      ['Rope Triceps Pushdown','2 × 10–15','Triceps lateral/medial'],
      ['Calf Raise','2 × 12–20','Baldır']
    ],
    B: [
      ['Leg Press','3 × 8–12','Quadriceps · glute'],
      ['Incline Smith / DB Press','3 × 8–12','Üst sinə — clavicular head'],
      ['Lat Pulldown','3 × 8–12','Latissimus dorsi'],
      ['Hip Thrust','2–3 × 8–12','Gluteus maximus'],
      ['Lateral Raise','2 × 12–20','Lateral deltoid'],
      ['Reverse Pec Deck','2 × 12–20','Posterior deltoid'],
      ['Hammer Curl','2 × 10–15','Brachialis · brachioradialis'],
      ['Overhead Cable Triceps Extension','2 × 10–15','Triceps long head'],
      ['Cable Crunch','2 × 12–20','Rectus abdominis']
    ],
    C: [
      ['Smith Squat / Hack Squat','3 × 8–12','Quadriceps · glute'],
      ['Slight Decline Chest Press / Assisted Dips','3 × 8–12','Orta-alt sinə'],
      ['Seated Cable Row — neutral grip','3 × 8–12','Lat · orta kürək'],
      ['Leg Curl','3 × 10–15','Hamstring'],
      ['Lateral Raise','2 × 12–20','Lateral deltoid'],
      ['Face Pull','2 × 15–20','Arxa çiyin · lower trap'],
      ['Preacher Curl','2 × 10–15','Biceps short-head vurğusu'],
      ['Rope Triceps Pushdown','2 × 10–15','Triceps'],
      ['Calf Raise','2 × 12–20','Baldır'],
      ['Hanging / Lying Leg Raise','2 × 10–15','Qarın']
    ]
  };

  const muscles = {
    upperchest:{n:'Pectoralis major — clavicular head',load:'Orta–yüksək',freq:'1× birbaşa + digər presslər',desc:'Incline Smith/DB press üst sinəyə əsas fokusdur; flat presslərdə də köməkçi işləyir.',days:['B']},
    midchest:{n:'Pectoralis major — sternocostal hissə',load:'Çox yüksək',freq:'2–3× stimul / həftə',desc:'Flat bench press və decline press/dips sternocostal liflərə əsas yük verir.',days:['A','C']},
    lowerchest:{n:'Pectoralis major — aşağı liflər',load:'Yüksək',freq:'1× birbaşa',desc:'Slight decline press və assisted dips aşağı sternocostal liflərə vurğunu artırır.',days:['C']},
    antdelts:{n:'Anterior deltoid',load:'Yüksək',freq:'3× stimul',desc:'Machine shoulder press birbaşa, bütün sinə pressləri isə dolayı güclü stimul verir.',days:['A','B','C']},
    latdelts:{n:'Lateral deltoid',load:'Yüksək',freq:'2× birbaşa',desc:'B və C günlərində lateral raise ilə birbaşa işləyir.',days:['B','C']},
    reardelts:{n:'Posterior deltoid',load:'Yüksək',freq:'2–3× stimul',desc:'Reverse pec deck + face pull birbaşa; row hərəkətlərində əlavə stimul.',days:['A','B','C']},
    lats:{n:'Latissimus dorsi',load:'Çox yüksək',freq:'3× stimul / həftə',desc:'Lat pulldown və neutral-grip cable row əsas yük verir; chest-supported row-da da güclü iştirak edir.',days:['A','B','C']},
    traps:{n:'Upper trapezius',load:'Orta',freq:'2–3× dolayı',desc:'Row, face pull və çiyin qurşağının stabilizasiyasında iştirak edir.',days:['A','B','C']},
    midback:{n:'Middle trapezius + rhomboids',load:'Yüksək',freq:'2–3× / həftə',desc:'Chest-supported row və seated cable row əsas stimul verir; face pull əlavə edir.',days:['A','B','C']},
    biceps:{n:'Biceps brachii + brachialis',load:'Yüksək',freq:'3× birbaşa',desc:'Incline curl → long head; hammer curl → brachialis/brachioradialis; preacher curl → short-head vurğusu.',days:['A','B','C']},
    triceps:{n:'Triceps brachii',load:'Yüksək',freq:'3× birbaşa + presslər',desc:'Pushdown və overhead extension birbaşa; bütün presslər əlavə triceps yükü yaradır.',days:['A','B','C']},
    forearms:{n:'Ön qol fleksor/ekstensorları',load:'Orta',freq:'3× dolayı',desc:'Row, pulldown, curl və tutuşlarda işləyir. Ayrıca wrist curl proqramda yoxdur.',days:['A','B','C']},
    abs:{n:'Rectus abdominis / core',load:'Orta',freq:'2× birbaşa',desc:'Cable crunch + hanging/lying leg raise; compound hərəkətlərdə stabilizasiya.',days:['B','C']},
    quads:{n:'Quadriceps',load:'Çox yüksək',freq:'3× / həftə',desc:'Smith squat, leg press və Hack/Smith squat vasitəsilə hər məşq günündə stimul alır.',days:['A','B','C']},
    glutes:{n:'Gluteus maximus',load:'Çox yüksək',freq:'3× / həftə',desc:'Hip thrust ən spesifik hərəkətdir; squat və leg press də güclü işləyir.',days:['A','B','C']},
    hamstrings:{n:'Hamstrings',load:'Yüksək',freq:'2× birbaşa',desc:'Leg curl A və C günlərində birbaşa; hip thrust/squatlarda əlavə iştirak edir.',days:['A','B','C']},
    calves:{n:'Gastrocnemius + soleus',load:'Orta',freq:'2× birbaşa',desc:'A və C günlərində calf raise ilə birbaşa işləyir.',days:['A','C']},
    erectors:{n:'Spinal erectors',load:'Orta',freq:'2–3× stabilizasiya',desc:'RDL çıxarıldığı üçün əsasən squat, row və hip thrust zamanı stabilizator rolundadır.',days:['A','B','C']}
  };

  $$('.bottom-nav button').forEach(btn => btn.addEventListener('click', () => {
    const target = btn.dataset.nav;
    $$('.bottom-nav button').forEach(x => x.classList.toggle('active', x === btn));
    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === target));
    window.scrollTo({top:0, behavior:'smooth'});
    if (target === 'home') setTimeout(drawChart, 40);
  }));

  const now = new Date();
  $('#todayChip').textContent = now.toLocaleDateString('az-AZ', {day:'2-digit', month:'short'});

  let activeFoodDay = Math.min(6, Math.max(0, Number(store.get('activeFoodDay', 0))));
  const dayTabs = $('#dayTabs');
  meals.forEach((m, i) => {
    const b = document.createElement('button'); b.type='button'; b.textContent = `${i+1}`; b.dataset.day = i;
    b.addEventListener('click', () => { activeFoodDay = i; store.set('activeFoodDay', i); renderMeals(); });
    dayTabs.appendChild(b);
  });

  function mealKey(day){ return `mealDone_v1_${day}`; }
  function renderMeals(){
    $$('#dayTabs button').forEach((b,i)=>b.classList.toggle('active',i===activeFoodDay));
    $('#foodTitle').textContent = meals[activeFoodDay].title;
    const done = store.get(mealKey(activeFoodDay), {});
    const wrap = $('#mealList'); wrap.innerHTML='';
    meals[activeFoodDay].items.forEach((it,i)=>{
      const row=document.createElement('label'); row.className='meal-row';
      row.innerHTML=`<input class="check" type="checkbox" ${done[i]?'checked':''}><div><div class="row-title">${it[0]}</div><div class="row-desc">${it[1]}</div></div><span class="tag">${i+1}</span>`;
      row.querySelector('input').addEventListener('change', e=>{ done[i]=e.target.checked; store.set(mealKey(activeFoodDay),done); updateMealProgress(done); });
      wrap.appendChild(row);
    });
    updateMealProgress(done);
  }
  function updateMealProgress(done){
    const total=meals[activeFoodDay].items.length; let n=0; for(let i=0;i<total;i++) if(done[i]) n++;
    $('#mealProgress').textContent=`${n}/${total}`; $('#mealBar').style.width=`${Math.round(n/total*100)}%`;
  }
  renderMeals();

  let activeWorkout = store.get('activeWorkout','A'); if(!workouts[activeWorkout]) activeWorkout='A';
  const workoutTabs=$('#workoutTabs');
  ['A','B','C'].forEach(k=>{ const b=document.createElement('button');b.type='button';b.textContent=`Gün ${k}`;b.dataset.work=k;b.addEventListener('click',()=>{activeWorkout=k;store.set('activeWorkout',k);renderWorkout();});workoutTabs.appendChild(b); });
  function workoutKey(k){return `workoutDone_v1_${k}`;}
  function renderWorkout(){
    $$('#workoutTabs button').forEach(b=>b.classList.toggle('active',b.dataset.work===activeWorkout));
    $('#workoutTitle').textContent=`Gün ${activeWorkout}`;
    const done=store.get(workoutKey(activeWorkout),{}), wrap=$('#exerciseList'); wrap.innerHTML='';
    workouts[activeWorkout].forEach((it,i)=>{
      const row=document.createElement('label');row.className='exercise-row';
      row.innerHTML=`<input class="check" type="checkbox" ${done[i]?'checked':''}><div><div class="row-title">${it[0]}</div><div class="row-desc">${it[2]}</div></div><span class="tag">${it[1]}</span>`;
      row.querySelector('input').addEventListener('change',e=>{done[i]=e.target.checked;store.set(workoutKey(activeWorkout),done);updateWorkoutProgress(done)});
      wrap.appendChild(row);
    }); updateWorkoutProgress(done);
  }
  function updateWorkoutProgress(done){
    const total=workouts[activeWorkout].length;let n=0;for(let i=0;i<total;i++) if(done[i])n++;
    $('#workoutProgress').textContent=`${n}/${total}`;$('#workoutBar').style.width=`${Math.round(n/total*100)}%`;
  }
  renderWorkout();

  function isoToday(){const d=new Date();const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
  function measurements(){return store.get('measurements_v1',[]).filter(x=>Number.isFinite(x.weight)||Number.isFinite(x.waist));}
  function setMeasurements(v){store.set('measurements_v1',v);}
  $('#saveMeasurement').addEventListener('click',()=>{
    const weight=Number($('#weightInput').value),waist=Number($('#waistInput').value),note=$('#measureNoteInput').value.trim();
    const wOk=Number.isFinite(weight)&&weight>=40&&weight<=200, aOk=Number.isFinite(waist)&&waist>=50&&waist<=160;
    if(!wOk&&!aOk){alert('Çəki və ya bel ölçüsündən ən azı birini düzgün daxil et.');return;}
    const arr=measurements(); const date=isoToday(); const idx=arr.findIndex(x=>x.date===date);
    const item={date,weight:wOk?weight:null,waist:aOk?waist:null,note}; if(idx>=0)arr[idx]=item;else arr.push(item);
    arr.sort((a,b)=>a.date.localeCompare(b.date));setMeasurements(arr);$('#measureNoteInput').value='';renderMeasurements();
  });
  $('#clearMeasurements').addEventListener('click',()=>{if(confirm('Bütün ölçü tarixçəsi silinsin?')){store.del('measurements_v1');renderMeasurements();}});

  function renderMeasurements(){
    const arr=measurements(); const recent=arr.slice(-7); const weights=recent.map(x=>x.weight).filter(Number.isFinite); const waists=arr.map(x=>x.waist).filter(Number.isFinite);
    $('#avgWeight').textContent=weights.length?`${(weights.reduce((a,b)=>a+b,0)/weights.length).toFixed(2)} kq`:'—';
    $('#lastWaist').textContent=waists.length?`${waists[waists.length-1].toFixed(1)} sm`:'—';
    const hist=$('#measureHistory');hist.innerHTML='';
    arr.slice(-5).reverse().forEach(x=>{const d=document.createElement('div');d.className='history-row';d.innerHTML=`<span><b>${x.date}</b>${x.note?`<div class="sub">${escapeHtml(x.note)}</div>`:''}</span><span>${Number.isFinite(x.weight)?x.weight.toFixed(2)+' kq':'—'}</span><span>${Number.isFinite(x.waist)?x.waist.toFixed(1)+' sm':'—'}</span>`;hist.appendChild(d)});
    drawChart();
  }
  function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function drawChart(){
    const c=$('#measureChart');if(!c)return;const ctx=c.getContext('2d');const arr=measurements().slice(-14);const dpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
    const cssW=c.clientWidth||330,cssH=Math.max(150,Math.round(cssW*0.36));c.width=Math.round(cssW*dpr);c.height=Math.round(cssH*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);
    const styles=getComputedStyle(document.documentElement),muted=styles.getPropertyValue('--muted').trim()||'#687080',border=styles.getPropertyValue('--border').trim()||'#e2e5ea',text=styles.getPropertyValue('--text').trim()||'#131722';
    const pad={l:34,r:12,t:14,b:24};const w=cssW-pad.l-pad.r,h=cssH-pad.t-pad.b;
    ctx.strokeStyle=border;ctx.lineWidth=1;for(let i=0;i<4;i++){const y=pad.t+i*h/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(cssW-pad.r,y);ctx.stroke();}
    if(arr.length<2){ctx.fillStyle=muted;ctx.font='12px sans-serif';ctx.fillText('Trend üçün ən azı 2 ölçü daxil et.',pad.l,pad.t+20);return;}
    const ws=arr.map(x=>x.weight).filter(Number.isFinite);if(ws.length<2){ctx.fillStyle=muted;ctx.font='12px sans-serif';ctx.fillText('Çəki trendi üçün 2 ölçü lazımdır.',pad.l,pad.t+20);return;}
    let min=Math.min(...ws),max=Math.max(...ws);if(max-min<.4){min-=.2;max+=.2}else{min-=.1;max+=.1}
    const pts=arr.map((x,i)=>({x:pad.l+i*w/(arr.length-1),y:Number.isFinite(x.weight)?pad.t+(max-x.weight)/(max-min)*h:null})).filter(p=>p.y!==null);
    ctx.strokeStyle=text;ctx.lineWidth=2.2;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.fillStyle=text;pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3.2,0,Math.PI*2);ctx.fill()});
    ctx.fillStyle=muted;ctx.font='11px sans-serif';ctx.fillText(max.toFixed(1),2,pad.t+4);ctx.fillText(min.toFixed(1),2,pad.t+h+3);ctx.fillText(arr[0].date.slice(5),pad.l,cssH-6);const end=arr[arr.length-1].date.slice(5);ctx.fillText(end,cssW-pad.r-ctx.measureText(end).width,cssH-6);
  }
  window.addEventListener('resize',()=>setTimeout(drawChart,50));renderMeasurements();

  const muscleOrder=['upperchest','midchest','lowerchest','antdelts','latdelts','reardelts','lats','traps','midback','biceps','triceps','forearms','quads','hamstrings','glutes','calves','abs','erectors'];
  const ml=$('#muscleList');
  muscleOrder.forEach(k=>{const m=muscles[k],b=document.createElement('button');b.type='button';b.className='muscle-btn';b.dataset.muscleBtn=k;b.innerHTML=`<b>${m.n}</b><span>${m.freq}</span>`;b.addEventListener('click',()=>selectMuscle(k));ml.appendChild(b)});
  function selectMuscle(k){const m=muscles[k];if(!m)return;$('#muscleName').textContent=m.n;$('#muscleLoad').textContent=m.load;$('#muscleFreq').textContent=m.freq;$('#muscleDesc').textContent=m.desc;$$('.muscle').forEach(x=>x.classList.toggle('selected',x.dataset.muscle===k));$$('.muscle-btn').forEach(x=>x.classList.toggle('active',x.dataset.muscleBtn===k));}
  $$('.muscle').forEach(x=>{x.setAttribute('tabindex','0');x.addEventListener('click',()=>selectMuscle(x.dataset.muscle));x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectMuscle(x.dataset.muscle)}})});
  $('#muscleFilters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;const day=b.dataset.filter;$$('#muscleFilters button').forEach(x=>x.classList.toggle('active',x===b));$$('.muscle').forEach(x=>{const m=muscles[x.dataset.muscle];x.style.opacity=(day==='all'||m.days.includes(day))?'':'0.13'});});
  selectMuscle('lats');
})();