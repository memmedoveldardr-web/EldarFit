(() => {
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const get=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

  const FOOD={
    egg:{name:'Yumurta',cat:'protein',unit:'ədəd',perUnit:{kcal:72,p:6.3,c:0.4,f:4.8},aliases:['yumurta']},
    oats:{name:'Yulaf',cat:'carb',unit:'q',m:{kcal:389,p:16.9,c:66.3,f:6.9},aliases:['yulaf']},
    milk:{name:'Süd 2.5%',cat:'dairy',unit:'ml',m:{kcal:52,p:3.0,c:4.7,f:2.5},aliases:['süd']},
    banana:{name:'Banan',cat:'fruit',unit:'q',m:{kcal:89,p:1.1,c:22.8,f:0.3},aliases:['banan']},
    chicken:{name:'Toyuq filesi',cat:'protein',unit:'q',m:{kcal:120,p:22.5,c:0,f:2.6},aliases:['toyuq filesi','toyuq']},
    rice:{name:'Düyü (quru)',cat:'carb',unit:'q',m:{kcal:345,p:6.4,c:77.3,f:1.06},aliases:['quru düyü','düyü']},
    vegetables:{name:'Tərəvəz',cat:'veg',unit:'q',m:{kcal:30,p:1.5,c:6,f:0.2},aliases:['tərəvəz']},
    oliveoil:{name:'Zeytun yağı',cat:'fat',unit:'q',m:{kcal:900,p:0,c:0,f:100},aliases:['zeytun yağı']},
    greek:{name:'Yunan yoqurtu',cat:'dairy',unit:'q',m:{kcal:70,p:7.6,c:4.4,f:2.5},aliases:['yunan yoqurtu']},
    apple:{name:'Alma',cat:'fruit',unit:'q',m:{kcal:52,p:0.3,c:13.8,f:0.2},aliases:['alma']},
    almond:{name:'Badam',cat:'fat',unit:'q',m:{kcal:579,p:21.2,c:21.6,f:49.9},aliases:['badam']},
    beef:{name:'Yağsız mal əti',cat:'protein',unit:'q',m:{kcal:150,p:22,c:0,f:7},aliases:['yağsız mal əti','mal əti']},
    potato:{name:'Kartof (çiy)',cat:'carb',unit:'q',m:{kcal:77,p:2,c:17.5,f:0.1},aliases:['çiy kartof','kartof']},
    kefir:{name:'Kefir',cat:'dairy',unit:'ml',m:{kcal:50,p:3,c:4.7,f:2.5},aliases:['kefir']},
    bread:{name:'Çörək',cat:'carb',unit:'q',m:{kcal:250,p:8.5,c:49,f:3},aliases:['çörək']},
    cottage:{name:'Az yağlı kəsmik',cat:'dairy',unit:'q',m:{kcal:90,p:16,c:3,f:2},aliases:['az yağlı kəsmik','kəsmik']},
    bulgur:{name:'Bulqur (quru)',cat:'carb',unit:'q',m:{kcal:342,p:12.29,c:75.87,f:1.33},aliases:['quru bulqur','bulqur']},
    walnut:{name:'Qoz',cat:'fat',unit:'q',m:{kcal:654,p:15.2,c:13.7,f:65.2},aliases:['qoz']},
    salmon:{name:'Somon',cat:'protein',unit:'q',m:{kcal:208,p:20,c:0,f:13},aliases:['somon']},
    buckwheat:{name:'Qarabaşaq (quru)',cat:'carb',unit:'q',m:{kcal:343,p:13.3,c:71.5,f:3.4},aliases:['quru qarabaşaq','qarabaşaq']},
    whitefish:{name:'Ağ balıq',cat:'protein',unit:'q',m:{kcal:90,p:20,c:0,f:1},aliases:['ağ balıq']},
    orange:{name:'Portağal',cat:'fruit',unit:'q',m:{kcal:47,p:0.9,c:11.8,f:0.1},aliases:['portağal']},
    whitecheese:{name:'Ağ pendir',cat:'dairy',unit:'q',m:{kcal:260,p:14,c:3,f:21},aliases:['ağ pendir']},
    pasta:{name:'Borges tam taxıllı makaron',cat:'carb',unit:'q',m:{kcal:344.7,p:11.5,c:67,f:2},aliases:['borges tam taxıllı makaron','tam taxıllı makaron','makaron']},
    whey:{name:'Bombbar PRO Whey',cat:'dairy',unit:'q',m:{kcal:356.7,p:69,c:6,f:6},aliases:['whey']},
    tuna:{name:'Tuna (süzülmüş)',cat:'protein',unit:'q',m:{kcal:95,p:23.5,c:0,f:0.4},aliases:['tuna']},
    turkey:{name:'Hinduşka filesi',cat:'protein',unit:'q',m:{kcal:115,p:23.5,c:0,f:1.5},aliases:['hinduşka']},
    trout:{name:'Alabalıq',cat:'protein',unit:'q',m:{kcal:148,p:20.5,c:0,f:6},aliases:['alabalıq']},
    hazelnut:{name:'Fındıq',cat:'fat',unit:'q',m:{kcal:628,p:15,c:17,f:61},aliases:['fındıq']},
    avocado:{name:'Avokado',cat:'fat',unit:'q',m:{kcal:160,p:2,c:8.5,f:14.7},aliases:['avokado']}
  };

  const ALT={
    potato:['bulgur','rice','pasta','buckwheat'],
    bulgur:['pasta','rice','buckwheat','potato'],
    rice:['bulgur','pasta','buckwheat','potato'],
    buckwheat:['bulgur','pasta','rice','potato'],
    bread:['oats','bulgur','pasta'],
    oats:['bread','bulgur','pasta'],
    chicken:['turkey','whitefish','tuna','beef'],
    beef:['chicken','turkey','whitefish'],
    salmon:['trout','whitefish','chicken'],
    whitefish:['chicken','tuna','turkey','salmon'],
    greek:['cottage','whey','kefir'],
    cottage:['greek','whey','kefir'],
    kefir:['milk','greek'],
    milk:['kefir','greek'],
    banana:['apple','orange'],
    apple:['banana','orange'],
    orange:['apple','banana'],
    almond:['walnut','hazelnut'],
    walnut:['almond','hazelnut'],
    oliveoil:['almond','walnut','avocado'],
    whitecheese:['cottage','greek']
  };

  function customs(){return get('customFoods_v12',[])}

  function allFoods(){
    const map={...FOOD};
    customs().forEach(x=>{map[x.id]={name:x.name,cat:x.cat,unit:x.unit||'q',m:{kcal:+x.kcal,p:+x.p,c:+x.c,f:+x.f},aliases:[x.name.toLowerCase()],custom:true}});
    return map;
  }

  function findFood(text){
    const t=String(text).toLowerCase();
    const foods=allFoods();
    const entries=Object.entries(foods).sort((a,b)=>Math.max(...b[1].aliases.map(x=>x.length))-Math.max(...a[1].aliases.map(x=>x.length)));
    for(const [id,f] of entries){
      if(f.aliases.some(a=>t.includes(a.toLowerCase()))) return {id,...f};
    }
    return null;
  }

  function parseQty(text,food){
    const t=String(text).replace(',','.').toLowerCase();
    if(food && food.perUnit){
      const m=t.match(/(\d+(?:\.\d+)?)\s*(?:ədəd\s*)?yumurta/);
      return m?+m[1]:1;
    }
    const g=t.match(/(\d+(?:\.\d+)?)\s*q\b/);
    if(g)return +g[1];
    const ml=t.match(/(\d+(?:\.\d+)?)\s*ml\b/);
    if(ml)return +ml[1];
    return null;
  }

  function macrosFor(food,qty){
    if(!food||qty==null)return null;
    if(food.perUnit){
      return {kcal:food.perUnit.kcal*qty,p:food.perUnit.p*qty,c:food.perUnit.c*qty,f:food.perUnit.f*qty};
    }
    const k=qty/100;
    return {kcal:food.m.kcal*k,p:food.m.p*k,c:food.m.c*k,f:food.m.f*k};
  }

  function parseFood(text){
    const food=findFood(text);
    if(!food)return null;
    const qty=parseQty(text,food);
    if(qty==null)return null;
    return {food,qty,macros:macrosFor(food,qty)};
  }

  function roundQty(x){
    if(x<25)return Math.max(1,Math.round(x));
    if(x<250)return Math.max(5,Math.round(x/5)*5);
    return Math.max(10,Math.round(x/10)*10);
  }

  function matchQty(source,target,mode){
    if(!source||!target||target.perUnit)return null;
    const sm=source.macros, tm=target.m;
    if(mode==='calorie') return roundQty(sm.kcal/(tm.kcal/100));
    if(mode==='protein' && tm.p>0) return roundQty(sm.p/(tm.p/100));

    const cat=source.food.cat;
    const weights = cat==='protein'
      ? {kcal:0.30,p:0.55,c:0.05,f:0.10}
      : cat==='carb'
      ? {kcal:0.52,p:0.05,c:0.38,f:0.05}
      : cat==='fat'
      ? {kcal:0.38,p:0.03,c:0.04,f:0.55}
      : cat==='fruit'
      ? {kcal:0.58,p:0.02,c:0.37,f:0.03}
      : cat==='dairy'
      ? {kcal:0.34,p:0.38,c:0.14,f:0.14}
      : {kcal:0.45,p:0.20,c:0.25,f:0.10};

    let best={q:100,score:Infinity};
    const max=cat==='fruit'||cat==='carb'?700:450;
    for(let q=5;q<=max;q+=5){
      const m=macrosFor(target,q);
      const score=
        weights.kcal*Math.abs(m.kcal-sm.kcal)/Math.max(80,sm.kcal)+
        weights.p*Math.abs(m.p-sm.p)/Math.max(8,sm.p)+
        weights.c*Math.abs(m.c-sm.c)/Math.max(12,sm.c)+
        weights.f*Math.abs(m.f-sm.f)/Math.max(5,sm.f);
      if(score<best.score)best={q,score};
    }
    return roundQty(best.q);
  }

  function fmt(n,d=0){return Number.isFinite(+n)?(+n).toFixed(d):'—'}
  function signed(n,d=0){const v=+n;return (v>=0?'+':'')+v.toFixed(d)}

  function modalEls(){
    return {back:$('#modalBackdrop'),title:$('#modalTitle'),eye:$('#modalEyebrow'),body:$('#modalBody')};
  }
  function openModal(title,eye,node){
    const m=modalEls();m.title.textContent=title;m.eye.textContent=eye;m.body.innerHTML='';m.body.appendChild(node);m.back.classList.add('open');m.back.setAttribute('aria-hidden','false');
  }
  function closeModal(){const m=modalEls();m.back.classList.remove('open');m.back.setAttribute('aria-hidden','true')}

  let mode=get('macroMatchMode_v12','macro');
  function modeLabel(){return mode==='macro'?'Ən yaxın makro':mode==='calorie'?'Kalorini qoru':'Proteini qoru'}
  function syncMode(){const b=$('#macroModeBtn');if(b)b.textContent=modeLabel()}
  $('#macroModeBtn').addEventListener('click',()=>{
    const list=document.createElement('div');list.className='choice-list';
    [['macro','Ən yaxın makro','Kcal + protein + karbohidrat + yağ birlikdə optimallaşdırılır.'],['calorie','Kalorini qoru','Əsas məqsəd enerji miqdarını eyni saxlamaqdır.'],['protein','Proteini qoru','Protein miqdarını mümkün qədər eyni saxlayır.']].forEach(([id,n,d])=>{
      const b=document.createElement('button');b.className='choice-btn'+(mode===id?' primary-choice':'');b.innerHTML='<b>'+n+'</b><span>'+d+'</span>';b.onclick=()=>{mode=id;set('macroMatchMode_v12',mode);syncMode();closeModal();};list.appendChild(b);
    });openModal('Əvəzləmə rejimi','HESABLAMA',list);
  });
  syncMode();

  function foodSwapMap(){return get('foodSwaps_v12',{})}
  function swapKey(day,meal,part){return day+':'+meal+':'+part}
  function activeDay(){const b=$('#dayTabs button.active');return b?+b.dataset.day:0}

  function baseOriginals(){return get('foodOriginals_v12',{})}
  function captureAndDecorate(){
    const day=activeDay(), originals=baseOriginals(), swaps=foodSwapMap();
    $$('#mealList .meal-row').forEach((row,mi)=>{
      $$('.food-chip',row).forEach((chip,pi)=>{
        const key=swapKey(day,mi,pi);
        if(!originals[key]) originals[key]=chip.textContent.replace('↔','').trim();
        chip.dataset.v12key=key;
        chip.dataset.v12original=originals[key];
        const sw=swaps[key];
        if(sw){
          chip.innerHTML=sw.display+'<small>↔</small>';
          chip.classList.add('swapped');
        }
      });
    });
    set('foodOriginals_v12',originals);
    updateMacros();
  }

  function inventory(){return get('inventory_v12',[])}
  function foodAvailable(id){const inv=inventory();return inv.length===0||inv.includes(id)}

  function sourceForKey(key,chip){
    const swaps=foodSwapMap();
    if(swaps[key]&&swaps[key].resultFood){
      const foods=allFoods(),f=foods[swaps[key].resultFood];
      if(f)return {food:{id:swaps[key].resultFood,...f},qty:swaps[key].qty,macros:swaps[key].macros};
    }
    return parseFood(chip.dataset.v12original||chip.textContent);
  }

  function candidateIds(source){
    let ids=(ALT[source.food.id]||[]).slice();
    customs().forEach(x=>{if(x.cat===source.food.cat)ids.push(x.id)});
    return ids.filter((v,i,a)=>a.indexOf(v)===i).filter(foodAvailable);
  }

  function openSmartSwap(chip){
    const key=chip.dataset.v12key;
    const originalText=chip.dataset.v12original||chip.textContent.replace('↔','').trim();
    const original=parseFood(originalText);
    const current=sourceForKey(key,chip);
    const source=original||current;
    if(!source){
      const box=document.createElement('div');box.innerHTML='<p class="sub">Bu qidanın miqdarını avtomatik hesablamaq üçün onu məhsul bazasına əlavə etmək lazımdır.</p>';
      openModal(originalText,'QİDA ƏVƏZLƏMƏ',box);return;
    }

    const list=document.createElement('div');list.className='choice-list';
    const reset=document.createElement('button');reset.className='choice-btn primary-choice';reset.innerHTML='<b>Əsas plana qaytar</b><span>'+originalText+'</span>';reset.onclick=()=>{const sw=foodSwapMap();delete sw[key];set('foodSwaps_v12',sw);closeModal();captureAndDecorate();};list.appendChild(reset);

    const foods=allFoods();
    const ids=candidateIds(source);
    if(!ids.length){
      const p=document.createElement('p');p.className='sub';p.textContent='“Evdə olanlar” filtrinə görə uyğun alternativ tapılmadı. Filtri dəyiş və ya öz məhsulunu əlavə et.';list.appendChild(p);
    }
    ids.forEach(id=>{
      const target={id,...foods[id]};
      const qty=matchQty(source,target,mode);
      if(!qty)return;
      const tm=macrosFor(target,qty);
      const b=document.createElement('button');b.className='choice-btn';
      const unit=target.unit==='ml'?'ml':'q';
      b.innerHTML='<b>'+qty+' '+unit+' '+target.name+'</b><span>'+modeLabel()+' · '+Math.round(tm.kcal)+' kcal · P '+fmt(tm.p,1)+' · C '+fmt(tm.c,1)+' · F '+fmt(tm.f,1)+'</span><div class="macro-diff"><span>Δ kcal '+signed(tm.kcal-source.macros.kcal)+'</span><span>Δ P '+signed(tm.p-source.macros.p,1)+'q</span><span>Δ C '+signed(tm.c-source.macros.c,1)+'q</span><span>Δ F '+signed(tm.f-source.macros.f,1)+'q</span></div>';
      b.onclick=()=>{
        const sw=foodSwapMap();
        sw[key]={original:originalText,resultFood:id,qty,display:qty+' '+unit+' '+target.name,macros:tm,mode};
        set('foodSwaps_v12',sw);closeModal();captureAndDecorate();
      };
      list.appendChild(b);
    });
    openModal(originalText,'AĞILLI ƏVƏZLƏMƏ',list);
  }

  $('#mealList').addEventListener('click',e=>{
    const chip=e.target.closest('.food-chip');if(!chip)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openSmartSwap(chip);
  },true);

  function sum(a,b){return {kcal:a.kcal+b.kcal,p:a.p+b.p,c:a.c+b.c,f:a.f+b.f}}
  function updateMacros(){
    let total={kcal:0,p:0,c:0,f:0};
    const day=activeDay(), originals=baseOriginals(), swaps=foodSwapMap();
    $$('#mealList .meal-row').forEach((row,mi)=>{
      $$('.food-chip',row).forEach((chip,pi)=>{
        const key=swapKey(day,mi,pi), sw=swaps[key];
        if(sw&&sw.macros) total=sum(total,sw.macros);
        else{
          const p=parseFood(originals[key]||chip.textContent);
          if(p)total=sum(total,p.macros);
        }
      });
    });
    $('#macroKcal').textContent=Math.round(total.kcal);
    $('#macroProtein').textContent=fmt(total.p,0)+' q';
    $('#macroCarbs').textContent=fmt(total.c,0)+' q';
    $('#macroFat').textContent=fmt(total.f,0)+' q';
    const rk=2375-total.kcal,rp=147.5-total.p;
    $('#remainKcal').textContent=rk>0?Math.round(rk)+' kcal qalır':Math.abs(Math.round(rk))+' kcal artıq';
    $('#remainProtein').textContent=rp>0?fmt(rp,0)+' q qalır':'hədəf tamam';
  }

  $('#inventoryBtn').addEventListener('click',()=>{
    const ids=['chicken','turkey','beef','whitefish','salmon','tuna','rice','bulgur','pasta','buckwheat','potato','oats','bread','greek','cottage','kefir','milk','whey','banana','apple','orange','almond','walnut','hazelnut','oliveoil','avocado'];
    const chosen=new Set(inventory());
    const root=document.createElement('div');
    const p=document.createElement('p');p.className='sub';p.textContent='Heç nə seçməsən bütün alternativlər göstərilir. Seçsən yalnız evdə olan məhsullar təklif ediləcək.';root.appendChild(p);
    const list=document.createElement('div');list.className='inventory-list';
    const foods=allFoods();
    ids.concat(customs().map(x=>x.id)).filter((x,i,a)=>a.indexOf(x)===i).forEach(id=>{
      if(!foods[id])return;
      const lab=document.createElement('label');lab.className='inventory-option';lab.innerHTML='<input type="checkbox" '+(chosen.has(id)?'checked':'')+'><span>'+foods[id].name+'</span>';
      const input=$('input',lab);input.onchange=()=>{input.checked?chosen.add(id):chosen.delete(id)};list.appendChild(lab);
    });root.appendChild(list);
    const actions=document.createElement('div');actions.className='sheet-actions';
    const all=document.createElement('button');all.className='danger-btn';all.textContent='Filtri söndür';
    const save=document.createElement('button');save.className='primary';save.style.marginTop='0';save.textContent='Saxla';
    all.onclick=()=>{set('inventory_v12',[]);closeModal()};save.onclick=()=>{set('inventory_v12',Array.from(chosen));closeModal()};
    actions.append(all,save);root.appendChild(actions);openModal('Evdə olanlar','QİDA FİLTRİ',root);
  });

  $('#customFoodBtn').addEventListener('click',()=>{
    const root=document.createElement('div');root.className='custom-form';
    root.innerHTML='<label class="full-label">Məhsul adı<input id="cfName" placeholder="məs: mənim protein barım"></label><label>Qida qrupu<select id="cfCat"><option value="protein">Protein</option><option value="carb">Karbohidrat</option><option value="dairy">Süd/protein</option><option value="fruit">Meyvə</option><option value="fat">Yağ mənbəyi</option></select></label><div class="form-grid"><label>kcal / 100 q<input id="cfK" type="number" inputmode="decimal"></label><label>Protein / 100 q<input id="cfP" type="number" inputmode="decimal"></label><label>Karbohidrat / 100 q<input id="cfC" type="number" inputmode="decimal"></label><label>Yağ / 100 q<input id="cfF" type="number" inputmode="decimal"></label></div><button class="primary" id="cfSave">Məhsulu əlavə et</button>';
    openModal('Öz məhsulunu əlavə et','ETİKET MƏLUMATI',root);
    $('#cfSave').onclick=()=>{
      const name=$('#cfName').value.trim(),k=+$('#cfK').value,p=+$('#cfP').value,c=+$('#cfC').value,f=+$('#cfF').value,cat=$('#cfCat').value;
      if(!name||![k,p,c,f].every(Number.isFinite)||k<=0){alert('Ad və 100 q üçün makroları düzgün daxil et.');return}
      const arr=customs();const id='custom_'+Date.now();arr.push({id,name,cat,unit:'q',kcal:k,p,c,f});set('customFoods_v12',arr);closeModal();
    };
  });

  const EQUIP=['machine','smith','dumbbell','cable','bodyweight'];
  const EXALT={
    'Smith Squat':[['Hack Squat','machine'],['Pendulum Squat','machine'],['Leg Press','machine']],
    'Flat Bench Press Machine':[['Smith Machine Bench Press','smith'],['Dumbbell Bench Press','dumbbell'],['Chest Press Machine','machine']],
    'Chest-Supported Row':[['Chest-Supported T-Bar Row','machine'],['Machine Row','machine'],['Seated Cable Row','cable']],
    'Leg Curl':[['Seated Leg Curl','machine'],['Lying Leg Curl','machine']],
    'Machine Shoulder Press':[['Dumbbell Shoulder Press','dumbbell'],['Smith Shoulder Press','smith']],
    'Incline Dumbbell Curl':[['Bayesian Cable Curl','cable'],['Incline Cable Curl','cable']],
    'Rope Triceps Pushdown':[['Cable Bar Pushdown','cable'],['Single-Arm Cable Pushdown','cable']],
    'Calf Raise':[['Standing Calf Raise','machine'],['Seated Calf Raise','machine'],['Leg Press Calf Raise','machine']],
    'Leg Press':[['Hack Squat','machine'],['Smith Squat','smith']],
    'Incline Smith / DB Press':[['Incline Chest Press Machine','machine'],['Incline Dumbbell Press','dumbbell'],['Incline Smith Press','smith']],
    'Lat Pulldown':[['Assisted Pull-Up','machine'],['Neutral-Grip Pulldown','cable'],['Single-Arm Cable Pulldown','cable']],
    'Hip Thrust':[['Glute Bridge Machine','machine'],['Smith Hip Thrust','smith']],
    'Lateral Raise':[['Cable Lateral Raise','cable'],['Machine Lateral Raise','machine'],['Dumbbell Lateral Raise','dumbbell']],
    'Reverse Pec Deck':[['Cable Reverse Fly','cable'],['Rear-Delt Machine Fly','machine']],
    'Hammer Curl':[['Rope Hammer Curl','cable'],['Cross-Body Hammer Curl','dumbbell']],
    'Overhead Cable Triceps Extension':[['Single-Arm Overhead Cable Extension','cable'],['Dumbbell Overhead Extension','dumbbell']],
    'Cable Crunch':[['Machine Crunch','machine'],['Weighted Crunch','bodyweight']],
    'Smith Squat / Hack Squat':[['Hack Squat','machine'],['Smith Squat','smith'],['Leg Press','machine']],
    'Slight Decline Chest Press / Assisted Dips':[['Decline Chest Press Machine','machine'],['Assisted Dips','machine'],['High-to-Low Cable Press','cable']],
    'Seated Cable Row — neutral grip':[['Machine Row — neutral grip','machine'],['Single-Arm Cable Row','cable'],['Chest-Supported Row','machine']],
    'Face Pull':[['Cable Rear-Delt Row','cable'],['High Cable Reverse Fly','cable']],
    'Preacher Curl':[['Machine Preacher Curl','machine'],['Spider Curl','dumbbell']],
    'Hanging / Lying Leg Raise':[['Captain Chair Knee Raise','bodyweight'],['Reverse Crunch','bodyweight']]
  };

  function equip(){return get('equipment_v12',[])}
  function equipLabel(){const e=equip();return e.length?e.map(x=>({machine:'Maşın',smith:'Smith',dumbbell:'Dumbbell',cable:'Cable',bodyweight:'Bədən çəkisi'}[x])).join(', '):'Hamısı'}
  function syncEquip(){if($('#equipmentBtn'))$('#equipmentBtn').textContent=equipLabel()}
  $('#equipmentBtn').onclick=()=>{
    const chosen=new Set(equip()),root=document.createElement('div'),list=document.createElement('div');list.className='inventory-list';
    const labels={machine:'Maşın',smith:'Smith',dumbbell:'Dumbbell',cable:'Cable',bodyweight:'Bədən çəkisi'};
    EQUIP.forEach(id=>{const lab=document.createElement('label');lab.className='inventory-option';lab.innerHTML='<input type="checkbox" '+(chosen.has(id)?'checked':'')+'><span>'+labels[id]+'</span>';const inp=$('input',lab);inp.onchange=()=>inp.checked?chosen.add(id):chosen.delete(id);list.appendChild(lab)});root.appendChild(list);
    const actions=document.createElement('div');actions.className='sheet-actions';const all=document.createElement('button');all.className='danger-btn';all.textContent='Hamısını göstər';const save=document.createElement('button');save.className='primary';save.style.marginTop='0';save.textContent='Saxla';all.onclick=()=>{set('equipment_v12',[]);syncEquip();closeModal()};save.onclick=()=>{set('equipment_v12',Array.from(chosen));syncEquip();closeModal()};actions.append(all,save);root.appendChild(actions);openModal('Avadanlıq filtri','MƏŞQ ALTERNATİVLƏRİ',root);
  };
  syncEquip();

  function currentWorkout(){const b=$('#workoutTabs button.active');return b?b.dataset.work:'A'}
  function selections(){return get('exerciseSelections_v11',{})}
  function exKey(day,idx){return day+':'+idx}

  function openExerciseSwapV12(btn){
    const row=btn.closest('.exercise-row'),rows=$$('#exerciseList .exercise-row'),idx=rows.indexOf(row),day=currentWorkout();
    const sel=selections()[exKey(day,idx)];
    const currentName=$('.row-title',row).textContent;
    const original=sel&&sel.original?sel.original:currentName;
    const list=document.createElement('div');list.className='choice-list';
    const reset=document.createElement('button');reset.className='choice-btn primary-choice';reset.innerHTML='<b>Əsas hərəkət</b><span>'+original+'</span>';reset.onclick=()=>{const s=selections();delete s[exKey(day,idx)];set('exerciseSelections_v11',s);closeModal();$('#workoutTabs [data-work="'+day+'"]').click();setTimeout(enhanceExerciseHistory,40)};list.appendChild(reset);
    const filter=equip();
    (EXALT[original]||[]).filter(x=>!filter.length||filter.includes(x[1])).forEach(([name,eq])=>{
      const b=document.createElement('button');b.className='choice-btn';b.innerHTML='<b>'+name+'</b><span>'+({machine:'Maşın',smith:'Smith',dumbbell:'Dumbbell',cable:'Cable',bodyweight:'Bədən çəkisi'}[eq]||eq)+'</span>';
      b.onclick=()=>{const s=selections();s[exKey(day,idx)]={original,value:name,note:'v1.2 avadanlıq filtrindən seçildi'};set('exerciseSelections_v11',s);closeModal();$('#workoutTabs [data-work="'+day+'"]').click();setTimeout(enhanceExerciseHistory,40)};list.appendChild(b);
    });
    openModal(original,'HƏRƏKƏT ALTERNATİVİ',list);
  }

  $('#exerciseList').addEventListener('click',e=>{
    const b=e.target.closest('.swap-action');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openExerciseSwapV12(b);
  },true);

  function logs(){return get('workoutLogs_v11',[])}
  function e1rm(setx){const w=+setx.weight,r=+setx.reps;if(!w||!r)return 0;return w*(1+r/30)}
  function maxStrength(log){return Math.max(0,...(log.sets||[]).map(e1rm))}
  function exerciseLogs(day,idx){return logs().filter(x=>x.day===day&&x.index===idx)}
  function isPR(day,idx){
    const l=exerciseLogs(day,idx);if(l.length<1)return false;
    const last=l[l.length-1],prev=l.slice(0,-1);if(!prev.length)return false;
    return maxStrength(last)>Math.max(...prev.map(maxStrength))+0.01;
  }
  function openHistory(day,idx,name){
    const l=exerciseLogs(day,idx).slice().reverse(),root=document.createElement('div');root.className='history-list';
    if(!l.length){root.innerHTML='<p class="sub">Bu hərəkət üçün hələ set qeydi yoxdur.</p>'}
    l.slice(0,12).forEach((x,i)=>{
      const d=document.createElement('div');d.className='history-item';const sum=(x.sets||[]).map(s=>(s.weight||'—')+'kg × '+(s.reps||'—')+(s.rir!==''?' · RIR '+s.rir:'')).join(' | ');
      d.innerHTML='<b>'+x.date+(i===0&&isPR(day,idx)?' · 🏆 PR':'')+'</b><span>'+sum+'</span>';root.appendChild(d);
    });openModal(name,'MƏŞQ TARİXÇƏSİ',root);
  }
  function enhanceExerciseHistory(){
    const day=currentWorkout();
    $$('#exerciseList .exercise-row').forEach((row,idx)=>{
      const main=row.children[1];if(!main)return;
      let tools=$('.exercise-tools',main);if(!tools)return;
      if(!$('.history-v12',tools)){
        const b=document.createElement('button');b.type='button';b.className='log-btn history-v12';b.textContent='▥ Tarixçə';b.onclick=e=>{e.preventDefault();e.stopPropagation();openHistory(day,idx,$('.row-title',main).textContent)};tools.appendChild(b);
      }
      if(isPR(day,idx)&&!$('.pr-badge',main)){const badge=document.createElement('div');badge.className='pr-badge';badge.textContent='🏆 Yeni şəxsi rekord';main.appendChild(badge)}
    });
  }

  const obs=new MutationObserver(()=>{captureAndDecorate();enhanceExerciseHistory()});
  obs.observe($('#mealList'),{childList:true,subtree:true});
  obs.observe($('#exerciseList'),{childList:true,subtree:true});
  $('#dayTabs').addEventListener('click',()=>setTimeout(captureAndDecorate,30));
  $('#workoutTabs').addEventListener('click',()=>setTimeout(enhanceExerciseHistory,30));


  window.EldarFitNutrition = {
    allFoods: allFoods,
    parseFood: parseFood,
    macrosFor: macrosFor,
    matchQty: matchQty,
    foodSwaps: foodSwapMap,
    activeDay: activeDay,
    mode: function(){ return mode; },
    modeLabel: modeLabel,
    roundQty: roundQty
  };

  setTimeout(()=>{captureAndDecorate();enhanceExerciseHistory();syncMode();syncEquip()},120);
})();