(() => {
  'use strict';

  const SCHEMA = 14;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const get=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}};
  const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const uid=(p='id')=>p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=(n,d=1)=>Number.isFinite(+n)?(+n).toFixed(d):'—';
  const zero=()=>({kcal:0,p:0,c:0,f:0});
  const add=(a,b)=>({kcal:a.kcal+b.kcal,p:a.p+b.p,c:a.c+b.c,f:a.f+b.f});
  const scale=(m,f)=>({kcal:m.kcal*f,p:m.p*f,c:m.c*f,f:m.f*f});
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

  function openModal(title,eye,node){
    $('#modalTitle').textContent=title;
    $('#modalEyebrow').textContent=eye||'ELDARFIT';
    const body=$('#modalBody');body.innerHTML='';body.appendChild(node);
    $('#modalBackdrop').classList.add('open');
    $('#modalBackdrop').setAttribute('aria-hidden','false');
  }
  function closeModal(){
    $('#modalBackdrop').classList.remove('open');
    $('#modalBackdrop').setAttribute('aria-hidden','true');
  }

  function api(){return window.EldarFitNutrition||null}
  function customFoods(){return get('customFoods_v12',[])}
  function sourceFor(type,dataType){
    if(type==='personal') return {type:'personal',label:'Şəxsi etiket',priority:400};
    if(type==='manufacturer') return {type:'manufacturer',label:'İstehsalçı / USDA Branded',priority:300};
    const dt=String(dataType||'USDA');
    if(/Foundation/i.test(dt)) return {type:'usda_foundation',label:'USDA Foundation',priority:260};
    if(/FNDDS/i.test(dt)) return {type:'usda_fndds',label:'USDA FNDDS',priority:240};
    if(/SR Legacy/i.test(dt)) return {type:'usda_sr',label:'USDA SR Legacy',priority:220};
    if(/Branded/i.test(dt)) return {type:'manufacturer',label:'USDA Branded / istehsalçı',priority:300};
    return {type:'usda',label:'USDA FoodData Central',priority:200};
  }
  function normalizeProduct(x){
    if(!x||typeof x!=='object')return null;
    const name=String(x.name||'').trim();
    const kcal=+x.kcal,p=+x.p,c=+x.c,f=+x.f;
    if(!name||![kcal,p,c,f].every(Number.isFinite)||kcal<0||p<0||c<0||f<0)return null;
    const baseUnit=(x.baseUnit==='ml'||x.unit==='ml')?'ml':'g';
    const portions=Array.isArray(x.portions)?x.portions.map(z=>({
      id:String(z.id||uid('portion')),
      label:String(z.label||'').trim(),
      amount:+z.amount,
      baseUnit:(z.baseUnit==='ml'||baseUnit==='ml')?'ml':'g'
    })).filter(z=>z.label&&Number.isFinite(z.amount)&&z.amount>0):[];
    return {
      id:String(x.id||uid('food')),name,cat:String(x.cat||'other'),
      unit:baseUnit==='ml'?'ml':'q',baseUnit,kcal,p,c,f,
      portions,
      source:(x.source&&x.source.label)?x.source:sourceFor('personal'),
      fdcId:x.fdcId||null,brandOwner:x.brandOwner||null,dataType:x.dataType||null
    };
  }
  function saveProducts(arr){set('customFoods_v12',arr.map(normalizeProduct).filter(Boolean))}
  function productById(id){return customFoods().map(normalizeProduct).filter(Boolean).find(x=>x.id===id)||null}
  function macroForProduct(p,baseAmount){
    const k=(+baseAmount||0)/100;
    return {kcal:p.kcal*k,p:p.p*k,c:p.c*k,f:p.f*k};
  }

  function planAdds(){return get('planAdditions_v14',{})}
  function planOverrides(){return get('planOverrides_v14',{})}
  function currentDay(){const b=$('#dayTabs button.active');return b?+b.dataset.day:0}
  function mealKey(day,meal){return day+':'+meal}

  function repairData(showReport){
    let fixed=0,removed=0;
    const raw=customFoods();
    const clean=raw.map(normalizeProduct).filter(Boolean);
    if(clean.length!==raw.length){removed+=raw.length-clean.length}
    clean.forEach((x,i)=>{
      const old=raw[i]||{};
      if(!old.baseUnit||!Array.isArray(old.portions)||!old.source)fixed++;
    });
    saveProducts(clean);

    const validIds=new Set(clean.map(x=>x.id));
    const adds=planAdds();
    Object.keys(adds).forEach(k=>{
      if(!Array.isArray(adds[k])){delete adds[k];removed++;return}
      adds[k]=adds[k].filter(a=>{
        const ok=a&&a.id&&a.foodId&&validIds.has(a.foodId)&&Number.isFinite(+a.baseAmount)&&+a.baseAmount>0;
        if(!ok)removed++;
        return ok;
      });
      if(!adds[k].length)delete adds[k];
    });
    set('planAdditions_v14',adds);

    const ovs=planOverrides();
    Object.keys(ovs).forEach(k=>{
      const o=ovs[k];
      if(!o||typeof o!=='object'){delete ovs[k];removed++;return}
      if(o.macros && ![o.macros.kcal,o.macros.p,o.macros.c,o.macros.f].every(Number.isFinite)){
        delete o.macros;fixed++;
      }
    });
    set('planOverrides_v14',ovs);

    const swaps=get('foodSwaps_v12',{});
    Object.keys(swaps).forEach(k=>{
      const s=swaps[k];
      if(!s||typeof s!=='object'||!s.resultFood){delete swaps[k];removed++;return}
      if(String(s.resultFood).startsWith('custom_')||String(s.resultFood).startsWith('food_')){
        if(!validIds.has(s.resultFood)){delete swaps[k];removed++}
      }
    });
    set('foodSwaps_v12',swaps);

    localStorage.removeItem('foodSwaps_v11');
    set('eldarfitSchemaVersion',SCHEMA);
    const report={fixed,removed,products:clean.length,schema:SCHEMA};
    if(showReport)alert('Data yoxlaması tamamlandı. Düzəldilən: '+fixed+' · Silinən problemli qeyd: '+removed+'.');
    return report;
  }

  function migrate(){
    const old=Number(get('eldarfitSchemaVersion',0))||0;
    if(old<SCHEMA) repairData(false);
  }

  function prepLabel(text){
    const t=String(text||'').toLowerCase();
    if(t.includes('quru'))return 'QURU';
    if(t.includes('çiy'))return 'ÇİY';
    if(t.includes('süzülmüş'))return 'SÜZÜLMÜŞ';
    if(t.includes('bişmiş'))return 'BİŞMİŞ';
    return '';
  }

  function baseItemMacros(chip){
    const A=api();if(!A)return null;
    const key=chip.dataset.v12key;
    const ov=planOverrides()[key];
    if(ov&&ov.hidden)return null;
    if(ov&&ov.macros)return ov.macros;
    const sw=A.foodSwaps()[key];
    if(sw&&sw.macros)return sw.macros;
    const parsed=A.parseFood(chip.dataset.v12original||chip.textContent);
    return parsed?parsed.macros:null;
  }

  function currentDisplayAndQty(chip){
    const A=api();if(!A)return null;
    const key=chip.dataset.v12key,ov=planOverrides()[key];
    if(ov&&ov.display&&Number.isFinite(+ov.qty))return {display:ov.display,qty:+ov.qty,unit:ov.unit||'q',macros:ov.macros};
    const sw=A.foodSwaps()[key];
    const text=(sw&&sw.display)?sw.display:(chip.dataset.v12original||chip.textContent.replace('↔','').trim());
    const m=String(text).replace(',','.').match(/^(\d+(?:\.\d+)?)\s*(ml|q|ədəd)?\s*(.*)$/i);
    const parsed=sw&&sw.macros?{macros:sw.macros}:A.parseFood(text);
    if(!m)return {display:text,qty:null,unit:'',macros:parsed&&parsed.macros};
    return {display:text,qty:+m[1],unit:m[2]||'ədəd',name:m[3],macros:parsed&&parsed.macros};
  }

  function renderAdditionsForRow(row,day,mi){
    const desc=$('.row-desc',row);if(!desc)return;
    $$('.v14-plan-item',desc).forEach(x=>x.remove());
    const arr=planAdds()[mealKey(day,mi)]||[];
    arr.forEach(a=>{
      const p=productById(a.foodId);if(!p)return;
      const span=document.createElement('span');
      span.className='v14-plan-item';
      span.dataset.addId=a.id;
      span.innerHTML='<b>'+esc(a.display||formatAddition(p,a))+'</b><small>'+esc((p.source&&p.source.label)||'Şəxsi məhsul')+'</small>';
      desc.appendChild(span);
    });
  }

  function formatAddition(p,a){
    if(a.measureLabel&&a.measureLabel!==p.baseUnit){
      return (a.measureCount||1)+' × '+a.measureLabel+' ('+fmt(a.baseAmount,0)+' '+(p.baseUnit==='ml'?'ml':'q')+') '+p.name;
    }
    return fmt(a.baseAmount,0)+' '+(p.baseUnit==='ml'?'ml':'q')+' '+p.name;
  }

  function applyOverrides(row){
    const ovs=planOverrides();
    $$('.food-chip',row).forEach(chip=>{
      const key=chip.dataset.v12key;if(!key)return;
      const o=ovs[key];
      if(o&&o.hidden){
        chip.style.display='none';
        const parent=chip.parentElement;
        if(parent){
          const s=parent.querySelector('.skip-food[data-for="'+CSS.escape(key)+'"]');if(s)s.style.display='none';
          const p=parent.querySelector('.prep-badge[data-for="'+CSS.escape(key)+'"]');if(p)p.style.display='none';
        }
      }else{
        chip.style.display='';
        if(o&&o.display){
          const wanted=esc(o.display)+'<small>↔</small>';
          if(chip.innerHTML!==wanted)chip.innerHTML=wanted;
        }
      }
    });
  }

  function mealTotals(row){
    let m=zero();
    $$('.food-chip',row).forEach(chip=>{const x=baseItemMacros(chip);if(x)m=add(m,x)});
    const day=currentDay(),rows=$$('#mealList .meal-row'),mi=rows.indexOf(row);
    (planAdds()[mealKey(day,mi)]||[]).forEach(a=>{
      const p=productById(a.foodId);if(p)m=add(m,macroForProduct(p,a.baseAmount));
    });
    return m;
  }

  function fullTotals(){
    let planned=zero(),actual=zero();
    const sk=get('skippedFoods_v13',{});
    const day=currentDay(),rows=$$('#mealList .meal-row');
    rows.forEach((row,mi)=>{
      $$('.food-chip',row).forEach(chip=>{
        const x=baseItemMacros(chip);if(!x)return;
        planned=add(planned,x);
        const key=today()+'|'+chip.dataset.v12key;
        if(!sk[key])actual=add(actual,x);
      });
      (planAdds()[mealKey(day,mi)]||[]).forEach(a=>{
        const p=productById(a.foodId);if(!p)return;
        const x=macroForProduct(p,a.baseAmount);
        planned=add(planned,x);actual=add(actual,x);
      });
    });
    return {planned,actual};
  }

  function refreshTotals(){
    const {planned,actual}=fullTotals();
    if($('#macroKcal'))$('#macroKcal').textContent=Math.round(planned.kcal);
    if($('#macroProtein'))$('#macroProtein').textContent=fmt(planned.p,0)+' q';
    if($('#macroCarbs'))$('#macroCarbs').textContent=fmt(planned.c,0)+' q';
    if($('#macroFat'))$('#macroFat').textContent=fmt(planned.f,0)+' q';
    if($('#remainKcal'))$('#remainKcal').textContent=(2375-planned.kcal>=0?Math.round(2375-planned.kcal)+' kcal qalır':Math.abs(Math.round(2375-planned.kcal))+' kcal artıq');
    if($('#remainProtein'))$('#remainProtein').textContent=(147.5-planned.p>0?fmt(147.5-planned.p,0)+' q qalır':'hədəf tamam');
    if($('#plannedMacroSummary'))$('#plannedMacroSummary').textContent=Math.round(planned.kcal)+' kcal · P '+fmt(planned.p,0)+' · C '+fmt(planned.c,0)+' · F '+fmt(planned.f,0);
    if($('#actualMacroSummary'))$('#actualMacroSummary').textContent=Math.round(actual.kcal)+' kcal · P '+fmt(actual.p,0)+' · C '+fmt(actual.c,0)+' · F '+fmt(actual.f,0);

    $$('#mealList .meal-row').forEach(row=>{
      const main=row.children[1];if(!main)return;
      let line=$('.meal-macro-v14',main);
      if(!line){line=document.createElement('div');line.className='meal-macro-v14';main.appendChild(line)}
      const m=mealTotals(row);
      line.textContent=Math.round(m.kcal)+' kcal · P '+fmt(m.p,0)+' · C '+fmt(m.c,0)+' · F '+fmt(m.f,0);
    });
  }

  function decorateMeals(){
    const day=currentDay();
    const rows=$$('#mealList .meal-row');
    rows.forEach((row,mi)=>{
      renderAdditionsForRow(row,day,mi);
      applyOverrides(row);
      const main=row.children[1];if(!main)return;
      let tools=$('.meal-tools-v14',main);
      if(!tools){
        tools=document.createElement('div');tools.className='meal-tools-v14';
        const addBtn=document.createElement('button');addBtn.className='log-btn';addBtn.textContent='＋ Qida əlavə et';
        addBtn.onclick=e=>{e.preventDefault();e.stopPropagation();openAddFood(day,mi)};
        const editBtn=document.createElement('button');editBtn.className='swap-action';editBtn.textContent='✎ Yeməyi redaktə et';
        editBtn.onclick=e=>{e.preventDefault();e.stopPropagation();openMealEditor(day,mi,row)};
        tools.append(addBtn,editBtn);main.appendChild(tools);
      }
    });
    refreshTotals();
  }

  function portionOptions(p){
    const arr=[{id:'base',label:p.baseUnit==='ml'?'ml':'qram',amount:1,baseUnit:p.baseUnit}];
    (p.portions||[]).forEach(z=>arr.push(z));
    return arr;
  }

  function openAmountPicker(p,day,mi,existing){
    const root=document.createElement('div');root.className='custom-form';
    const portions=portionOptions(p);
    const selected=existing&&existing.measureId?existing.measureId:'base';
    root.innerHTML='<div class="source-pill">'+esc((p.source&&p.source.label)||'Şəxsi məhsul')+'</div>'+
      '<div class="macro-preview-v14">100 '+(p.baseUnit==='ml'?'ml':'q')+': <b>'+Math.round(p.kcal)+' kcal</b> · P '+fmt(p.p,1)+' · C '+fmt(p.c,1)+' · F '+fmt(p.f,1)+'</div>'+
      '<label>Ölçü<select id="v14Measure">'+portions.map(z=>'<option value="'+esc(z.id)+'" '+(z.id===selected?'selected':'')+'>'+esc(z.label)+(z.id!=='base'?' = '+z.amount+' '+(z.baseUnit==='ml'?'ml':'q'):'')+'</option>').join('')+'</select></label>'+
      '<label>Miqdar<input id="v14Amount" type="number" min="0.1" step="0.1" inputmode="decimal" value="'+esc(existing?existing.measureCount||existing.baseAmount||1:1)+'"></label>'+
      '<div class="macro-preview-v14" id="v14AmountPreview"></div>'+
      '<button class="primary" id="v14AmountSave">'+(existing?'Dəyişikliyi saxla':'Plana əlavə et')+'</button>';
    const measure=$('#v14Measure',root),amount=$('#v14Amount',root),preview=$('#v14AmountPreview',root);
    const calc=()=>{
      const z=portions.find(x=>x.id===measure.value)||portions[0];
      const count=Math.max(0,+amount.value||0);
      const base=z.id==='base'?count:count*z.amount;
      const m=macroForProduct(p,base);
      preview.textContent=fmt(base,0)+' '+(p.baseUnit==='ml'?'ml':'q')+' · '+Math.round(m.kcal)+' kcal · P '+fmt(m.p,1)+' · C '+fmt(m.c,1)+' · F '+fmt(m.f,1);
      return {z,count,base,m};
    };
    measure.onchange=calc;amount.oninput=calc;calc();
    $('#v14AmountSave',root).onclick=()=>{
      const x=calc();if(x.base<=0)return;
      const all=planAdds(),k=mealKey(day,mi),arr=all[k]||[];
      const obj={id:existing?existing.id:uid('add'),foodId:p.id,baseAmount:x.base,measureId:x.z.id,measureLabel:x.z.label,measureCount:x.count,macros:x.m};
      const idx=arr.findIndex(a=>a.id===obj.id);
      if(idx>=0)arr[idx]=obj;else arr.push(obj);
      all[k]=arr;set('planAdditions_v14',all);closeModal();decorateMeals();
    };
    openModal(p.name,'PLANA ƏLAVƏ ET',root);
  }

  function openAddFood(day,mi){
    const root=document.createElement('div');
    root.innerHTML='<div class="search-row-v14"><input id="v14LocalSearch" placeholder="Məhsullarımda axtar"><button id="v14OnlineOpen">🌐 Onlayn</button></div><div id="v14ProductList" class="choice-list"></div>';
    const list=$('#v14ProductList',root),inp=$('#v14LocalSearch',root);
    const render=()=>{
      const q=inp.value.trim().toLowerCase();
      const products=customFoods().map(normalizeProduct).filter(Boolean).filter(p=>!q||p.name.toLowerCase().includes(q));
      list.innerHTML='';
      if(!products.length)list.innerHTML='<p class="sub">Şəxsi məhsul yoxdur. “Onlayn” axtarışdan və ya Məhsullarım bölməsindən əlavə edə bilərsən.</p>';
      products.forEach(p=>{
        const b=document.createElement('button');b.className='choice-btn';
        b.innerHTML='<b>'+esc(p.name)+'</b><span>'+Math.round(p.kcal)+' kcal · P '+fmt(p.p,1)+' · C '+fmt(p.c,1)+' · F '+fmt(p.f,1)+' / 100 '+(p.baseUnit==='ml'?'ml':'q')+'</span><small class="source-line-v14">'+esc((p.source&&p.source.label)||'Şəxsi etiket')+'</small>';
        b.onclick=()=>openAmountPicker(p,day,mi,null);list.appendChild(b);
      });
    };
    inp.oninput=render;
    $('#v14OnlineOpen',root).onclick=()=>openOnlineSearch({day,mi});
    render();openModal('Qida əlavə et','PLAN',root);
  }

  function openMealEditor(day,mi,row){
    const root=document.createElement('div');root.className='meal-editor-v14';
    const baseWrap=document.createElement('div');baseWrap.className='choice-list';
    $$('.food-chip',row).forEach(chip=>{
      const key=chip.dataset.v12key;if(!key)return;
      const cur=currentDisplayAndQty(chip);
      const o=planOverrides()[key]||{};
      const item=document.createElement('div');item.className='edit-item-v14';
      item.innerHTML='<div><b>'+esc(cur.display)+'</b><small>'+esc(prepLabel(chip.dataset.v12original||cur.display))+'</small></div>'+
        '<div class="edit-actions-v14"><button data-act="qty">Miqdar</button><button data-act="hide">'+(o.hidden?'Geri qaytar':'Sil')+'</button></div>';
      $('[data-act="hide"]',item).onclick=()=>{
        const ovs=planOverrides();ovs[key]={...(ovs[key]||{}),hidden:!o.hidden};set('planOverrides_v14',ovs);closeModal();decorateMeals();
      };
      $('[data-act="qty"]',item).onclick=()=>openBaseQtyEditor(chip,key,cur);
      baseWrap.appendChild(item);
    });
    const additions=planAdds()[mealKey(day,mi)]||[];
    additions.forEach(a=>{
      const p=productById(a.foodId);if(!p)return;
      const item=document.createElement('div');item.className='edit-item-v14';
      item.innerHTML='<div><b>'+esc(formatAddition(p,a))+'</b><small>'+esc((p.source&&p.source.label)||'')+'</small></div><div class="edit-actions-v14"><button data-act="edit">Miqdar</button><button data-act="del">Sil</button></div>';
      $('[data-act="edit"]',item).onclick=()=>openAmountPicker(p,day,mi,a);
      $('[data-act="del"]',item).onclick=()=>{
        const all=planAdds(),k=mealKey(day,mi);all[k]=(all[k]||[]).filter(x=>x.id!==a.id);if(!all[k].length)delete all[k];set('planAdditions_v14',all);closeModal();decorateMeals();
      };
      baseWrap.appendChild(item);
    });
    root.appendChild(baseWrap);
    const addBtn=document.createElement('button');addBtn.className='primary';addBtn.textContent='＋ Qida əlavə et';addBtn.onclick=()=>openAddFood(day,mi);root.appendChild(addBtn);
    openModal('Yeməyi redaktə et','PLAN',root);
  }

  function openBaseQtyEditor(chip,key,cur){
    if(!cur||!Number.isFinite(cur.qty)||cur.qty<=0||!cur.macros){alert('Bu qidanın miqdarını avtomatik oxumaq mümkün olmadı.');return}
    const root=document.createElement('div');root.className='custom-form';
    root.innerHTML='<label>Yeni miqdar<input id="v14BaseQty" type="number" min="0.1" step="0.1" value="'+cur.qty+'"></label><div id="v14BasePreview" class="macro-preview-v14"></div><button class="primary" id="v14BaseSave">Saxla</button>';
    const inp=$('#v14BaseQty',root),prev=$('#v14BasePreview',root);
    const calc=()=>{
      const q=Math.max(0,+inp.value||0),factor=q/cur.qty,m=scale(cur.macros,factor);
      prev.textContent=Math.round(m.kcal)+' kcal · P '+fmt(m.p,1)+' · C '+fmt(m.c,1)+' · F '+fmt(m.f,1);
      return {q,m};
    };
    inp.oninput=calc;calc();
    $('#v14BaseSave',root).onclick=()=>{
      const x=calc();if(x.q<=0)return;
      const ovs=planOverrides();
      const name=(cur.name||cur.display.replace(/^\d+(?:[.,]\d+)?\s*(?:ml|q|ədəd)?\s*/i,'')).trim();
      ovs[key]={...(ovs[key]||{}),hidden:false,qty:x.q,unit:cur.unit,display:fmt(x.q,x.q%1?1:0)+' '+cur.unit+' '+name,macros:x.m};
      set('planOverrides_v14',ovs);closeModal();decorateMeals();
    };
    openModal('Miqdarı dəyiş','YEMƏK',root);
  }

  function productEditor(existing,prefill){
    const p=existing||prefill||normalizeProduct({id:uid('food'),name:'',cat:'other',unit:'q',baseUnit:'g',kcal:0,p:0,c:0,f:0,portions:[],source:sourceFor('personal')})||{};
    const root=document.createElement('div');root.className='custom-form product-editor-v14';
    root.innerHTML='<label>Məhsul adı<input id="peName" value="'+esc(p.name||'')+'" placeholder="məs: Ev yoqurdu"></label>'+
      '<div class="form-grid"><label>Qida qrupu<select id="peCat"><option value="protein">Protein</option><option value="carb">Karbohidrat</option><option value="dairy">Süd/protein</option><option value="fruit">Meyvə</option><option value="fat">Yağ</option><option value="other">Digər</option></select></label>'+
      '<label>Əsas ölçü<select id="peBase"><option value="g">qram</option><option value="ml">ml</option></select></label></div>'+
      '<div class="source-pill">Mənbə: '+esc((p.source&&p.source.label)||'Şəxsi etiket')+'</div>'+
      '<div class="form-grid"><label>kcal / 100<input id="peK" type="number" step="0.1" value="'+(+p.kcal||0)+'"></label><label>Protein / 100<input id="peP" type="number" step="0.1" value="'+(+p.p||0)+'"></label><label>Karbohidrat / 100<input id="peC" type="number" step="0.1" value="'+(+p.c||0)+'"></label><label>Yağ / 100<input id="peF" type="number" step="0.1" value="'+(+p.f||0)+'"></label></div>'+
      '<div class="section-head"><div><div class="eyebrow">ÖLÇÜ VAHİDLƏRİ</div><h3>Porsiyalar</h3></div><button class="compact-btn" id="peAddPortion">＋ Ölçü</button></div>'+
      '<div id="pePortions" class="portion-list-v14"></div>'+
      '<button class="primary" id="peSave">Məhsulu saxla</button>';
    $('#peCat',root).value=p.cat||'other';$('#peBase',root).value=p.baseUnit||'g';
    const portions=(p.portions||[]).map(x=>({...x}));
    const renderPortions=()=>{
      const wrap=$('#pePortions',root);wrap.innerHTML='';
      portions.forEach((z,i)=>{
        const row=document.createElement('div');row.className='portion-row-v14';
        row.innerHTML='<input data-x="label" placeholder="məs: 1 çay qaşığı" value="'+esc(z.label||'')+'"><input data-x="amount" type="number" min="0.1" step="0.1" value="'+(+z.amount||1)+'"><span>'+(($('#peBase',root).value==='ml')?'ml':'q')+'</span><button>×</button>';
        $('[data-x="label"]',row).oninput=e=>z.label=e.target.value;
        $('[data-x="amount"]',row).oninput=e=>z.amount=+e.target.value;
        $('button',row).onclick=()=>{portions.splice(i,1);renderPortions()};
        wrap.appendChild(row);
      });
    };
    $('#peBase',root).onchange=renderPortions;
    $('#peAddPortion',root).onclick=()=>{portions.push({id:uid('portion'),label:'1 çay qaşığı',amount:5,baseUnit:$('#peBase',root).value});renderPortions()};
    renderPortions();
    $('#peSave',root).onclick=()=>{
      const obj=normalizeProduct({
        ...p,id:p.id||uid('food'),name:$('#peName',root).value,cat:$('#peCat',root).value,
        baseUnit:$('#peBase',root).value,unit:$('#peBase',root).value==='ml'?'ml':'q',
        kcal:+$('#peK',root).value,p:+$('#peP',root).value,c:+$('#peC',root).value,f:+$('#peF',root).value,
        portions:portions.map(z=>({...z,baseUnit:$('#peBase',root).value})),
        source:p.source||sourceFor('personal'),fdcId:p.fdcId||null,brandOwner:p.brandOwner||null,dataType:p.dataType||null
      });
      if(!obj){alert('Məhsul məlumatlarını düzgün daxil et.');return}
      const arr=customFoods(),idx=arr.findIndex(x=>x.id===obj.id);if(idx>=0)arr[idx]=obj;else arr.push(obj);saveProducts(arr);closeModal();decorateMeals();
    };
    openModal(existing?'Məhsulu redaktə et':'Yeni məhsul','MƏHSULLARIM',root);
  }

  function openProductManager(){
    const root=document.createElement('div');
    root.innerHTML='<div class="tool-row"><button class="secondary" id="pmNew">＋ Yeni məhsul</button><button class="secondary" id="pmOnline">🌐 İnternetdən tap</button></div><div id="pmList" class="choice-list" style="margin-top:10px"></div>';
    const render=()=>{
      const list=$('#pmList',root);list.innerHTML='';
      const products=customFoods().map(normalizeProduct).filter(Boolean);
      if(!products.length)list.innerHTML='<p class="sub">Hələ şəxsi məhsul əlavə edilməyib.</p>';
      products.sort((a,b)=>(b.source?.priority||0)-(a.source?.priority||0)||a.name.localeCompare(b.name)).forEach(p=>{
        const row=document.createElement('div');row.className='product-row-v14';
        row.innerHTML='<div><b>'+esc(p.name)+'</b><span>'+Math.round(p.kcal)+' kcal · P '+fmt(p.p,1)+' · C '+fmt(p.c,1)+' · F '+fmt(p.f,1)+' / 100 '+(p.baseUnit==='ml'?'ml':'q')+'</span><small>'+esc((p.source&&p.source.label)||'')+' · '+(p.portions?.length||0)+' əlavə ölçü</small></div><div><button data-a="edit">✎</button><button data-a="del">🗑</button></div>';
        $('[data-a="edit"]',row).onclick=()=>productEditor(p,null);
        $('[data-a="del"]',row).onclick=()=>{if(!confirm(p.name+' silinsin?'))return;saveProducts(customFoods().filter(x=>x.id!==p.id));repairData(false);render();decorateMeals()};
        list.appendChild(row);
      });
    };
    $('#pmNew',root).onclick=()=>productEditor(null,null);
    $('#pmOnline',root).onclick=()=>openOnlineSearch(null);
    render();openModal('Məhsullarım','QİDA BAZASI',root);
  }

  function nutrient(food,names,numbers){
    const arr=Array.isArray(food.foodNutrients)?food.foodNutrients:[];
    for(const n of arr){
      const name=String(n.nutrientName||(n.nutrient&&n.nutrient.name)||'').toLowerCase();
      const num=String(n.nutrientNumber||(n.nutrient&&n.nutrient.number)||'');
      if(names.some(x=>name.includes(x))||numbers.includes(num)){
        let v=+(n.value??n.amount??0);
        const unit=String(n.unitName||(n.nutrient&&n.nutrient.unitName)||'').toUpperCase();
        if(names.includes('energy')&&unit==='KJ')v=v/4.184;
        return Number.isFinite(v)?v:0;
      }
    }
    return 0;
  }
  function usdaToProduct(food){
    const kcal=nutrient(food,['energy'],['208']);
    const p=nutrient(food,['protein'],['203']);
    const c=nutrient(food,['carbohydrate'],['205']);
    const f=nutrient(food,['total lipid','total fat'],['204']);
    const dt=String(food.dataType||'USDA');
    const source=sourceFor(/Branded/i.test(dt)?'manufacturer':'usda',dt);
    return normalizeProduct({
      id:uid('food'),name:String(food.description||food.lowercaseDescription||'USDA məhsulu'),
      cat:guessCategory(food.description||''),baseUnit:'g',unit:'q',kcal,p,c,f,portions:[],source,
      fdcId:food.fdcId||null,brandOwner:food.brandOwner||food.brandName||null,dataType:dt
    });
  }
  function guessCategory(name){
    const t=String(name).toLowerCase();
    if(/chicken|turkey|beef|fish|tuna|salmon|meat|poultry/.test(t))return 'protein';
    if(/rice|bulgur|wheat|pasta|potato|oat|bread|cereal/.test(t))return 'carb';
    if(/milk|yogurt|cheese|whey|kefir/.test(t))return 'dairy';
    if(/banana|apple|orange|fruit|berry/.test(t))return 'fruit';
    if(/oil|almond|walnut|nut|avocado/.test(t))return 'fat';
    return 'other';
  }

  const pending=new Map();
  function openOnlineSearch(context){
    const root=document.createElement('div');
    const key=get('usdaApiKey_v14','');
    root.innerHTML='<div class="search-row-v14"><input id="usdaQuery" placeholder="məs: bulgur, chicken breast"><button id="usdaGo">Axtar</button></div>'+
      '<div class="online-meta-v14"><span>USDA FoodData Central</span><button id="usdaTest">Bağlantını yoxla</button></div>'+
      '<details class="api-key-v14"><summary>USDA API açarı</summary><input id="usdaKey" value="'+esc(key)+'" placeholder="Boş saxla = DEMO_KEY"><small>Şəxsi açar yalnız bu cihazda saxlanır. DEMO_KEY-in limiti aşağıdır.</small></details>'+
      '<div id="usdaStatus" class="sub" style="margin:10px 0"></div><div id="usdaResults" class="choice-list"></div>';
    const status=$('#usdaStatus',root),results=$('#usdaResults',root);
    $('#usdaKey',root).onchange=e=>set('usdaApiKey_v14',e.target.value.trim());
    const doSearch=()=>{
      const q=$('#usdaQuery',root).value.trim();if(q.length<2){status.textContent='Ən azı 2 simvol yaz.';return}
      if(!window.EldarNative){status.textContent='Native internet körpüsü mövcud deyil.';return}
      const rid=uid('search');pending.set(rid,{type:'search',root,context});status.textContent='USDA-da axtarılır…';results.innerHTML='';
      window.EldarNative.searchUsda(q,rid,get('usdaApiKey_v14',''));
    };
    $('#usdaGo',root).onclick=doSearch;$('#usdaQuery',root).onkeydown=e=>{if(e.key==='Enter')doSearch()};
    $('#usdaTest',root).onclick=()=>{
      if(!window.EldarNative){status.textContent='Native internet körpüsü yoxdur.';return}
      const rid=uid('net');pending.set(rid,{type:'internet',root});status.textContent='Bağlantı yoxlanır…';window.EldarNative.testInternet(rid);
    };
    openModal('İnternetdən qida axtar','USDA',root);
  }

  function renderUsdaResults(ctx,wrapper){
    const root=ctx.root,status=$('#usdaStatus',root),results=$('#usdaResults',root);
    if(!wrapper||!wrapper.ok){status.textContent='Xəta: '+(wrapper&&wrapper.error?wrapper.error:'Naməlum xəta');return}
    const foods=Array.isArray(wrapper.payload&&wrapper.payload.foods)?wrapper.payload.foods:[];
    const parsed=foods.map(f=>({raw:f,p:usdaToProduct(f)})).filter(x=>x.p&&x.p.kcal>=0);
    parsed.sort((a,b)=>(b.p.source.priority-a.p.source.priority)||(Number(b.raw.score||0)-Number(a.raw.score||0)));
    status.textContent=parsed.length+' nəticə · mənbə prioritetinə görə sıralandı';
    results.innerHTML='';
    parsed.forEach(({raw,p})=>{
      const b=document.createElement('button');b.className='choice-btn';
      b.innerHTML='<b>'+esc(p.name)+'</b><span>'+Math.round(p.kcal)+' kcal · P '+fmt(p.p,1)+' · C '+fmt(p.c,1)+' · F '+fmt(p.f,1)+' / 100 q</span>'+
        '<small class="source-line-v14">'+esc(p.source.label)+(p.brandOwner?' · '+esc(p.brandOwner):'')+' · prioritet '+p.source.priority+'</small>';
      b.onclick=()=>{
        const arr=customFoods();arr.push(p);saveProducts(arr);
        if(ctx.context&&Number.isInteger(ctx.context.day))openAmountPicker(p,ctx.context.day,ctx.context.mi,null);
        else productEditor(p,null);
      };
      results.appendChild(b);
    });
  }

  function onNativeSearchResult(rid,wrapper){
    const ctx=pending.get(rid);if(!ctx)return;pending.delete(rid);renderUsdaResults(ctx,wrapper);
  }
  function onInternetTestResult(rid,wrapper){
    const ctx=pending.get(rid);if(!ctx)return;pending.delete(rid);
    const status=$('#usdaStatus',ctx.root);status.textContent=wrapper&&wrapper.ok?'✓ İnternet və USDA API işləyir.':'✕ '+(wrapper&&wrapper.error?wrapper.error:'Bağlantı alınmadı');
  }

  function backupObject(){
    const data={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);if(k&&(/^(food|custom|plan|workout|measurement|measure|inventory|equipment|skipped|macro|usda|eldarfit|restTimer)/.test(k)))data[k]=localStorage.getItem(k);
    }
    return {app:'EldarFit',schema:SCHEMA,version:'1.4.0',exportedAt:new Date().toISOString(),data};
  }
  function exportBackup(){
    if(!window.EldarNative){alert('Backup yalnız Android tətbiqində fayla çıxarıla bilər.');return}
    window.EldarNative.exportBackup(JSON.stringify(backupObject()));
  }
  function importBackup(){
    if(!window.EldarNative){alert('Restore yalnız Android tətbiqində işləyir.');return}
    window.EldarNative.importBackup();
  }
  function onBackupImported(text){
    if(!text){alert('Backup oxunmadı.');return}
    try{
      const obj=JSON.parse(text);if(obj.app!=='EldarFit'||!obj.data||typeof obj.data!=='object')throw new Error('Uyğun EldarFit backup deyil.');
      Object.keys(obj.data).forEach(k=>{if(typeof obj.data[k]==='string')localStorage.setItem(k,obj.data[k])});
      repairData(false);alert('Backup bərpa edildi. Tətbiq yenilənir.');location.reload();
    }catch(e){alert('Restore alınmadı: '+e.message)}
  }
  function onBackupExported(ok){alert(ok?'Backup faylı saxlanıldı.':'Backup faylı saxlanmadı.')}

  function openDataManager(){
    const root=document.createElement('div');root.className='choice-list';
    const buttons=[
      ['💾 Backup yarat','Bütün EldarFit məlumatlarını JSON faylına çıxarır.',exportBackup],
      ['♻ Restore et','Daha əvvəl çıxardığın EldarFit backup faylını bərpa edir.',importBackup],
      ['✓ Data yoxlaması','Məhsul, plan əlavələri və smart-swap əlaqələrini yoxlayıb zədələnmiş qeydləri düzəldir.',()=>repairData(true)],
      ['🧹 Problemli cache-i təmizlə','İstifadəçi məlumatını silmədən köhnə və müvəqqəti state-ləri təmizləyir.',()=>{
        ['foodSwaps_v11','planAnchor_v11','restTimer_v13'].forEach(k=>localStorage.removeItem(k));
        alert('Problemli cache təmizləndi.');location.reload();
      }]
    ];
    buttons.forEach(([n,d,fn])=>{const b=document.createElement('button');b.className='choice-btn';b.innerHTML='<b>'+n+'</b><span>'+d+'</span>';b.onclick=fn;root.appendChild(b)});
    openModal('Məlumatlar','BACKUP & MİQRASİYA',root);
  }

  function injectTopTools(){
    const box=$('.tool-row');if(!box||$('#v14DataBtn'))return;
    const products=document.createElement('button');products.className='secondary';products.id='v14ProductsBtn';products.textContent='📦 Məhsullarım';
    const online=document.createElement('button');online.className='secondary';online.id='v14OnlineBtn';online.textContent='🌐 Qida axtarışı';
    const data=document.createElement('button');data.className='secondary';data.id='v14DataBtn';data.textContent='💾 Məlumatlar';
    products.onclick=openProductManager;online.onclick=()=>openOnlineSearch(null);data.onclick=openDataManager;
    box.append(products,online,data);
  }

  function hijackLegacyCustomButton(){
    const b=$('#customFoodBtn');if(!b||b.dataset.v14==='1')return;
    b.dataset.v14='1';
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openProductManager()},true);
    b.textContent='＋ Məhsullarım';
  }

  let decorateQueued=false;
  function scheduleDecorate(){
    if(decorateQueued)return;decorateQueued=true;
    requestAnimationFrame(()=>{decorateQueued=false;decorateMeals();injectTopTools();hijackLegacyCustomButton()});
  }

  function selfTest(){
    const sample=normalizeProduct({id:'t',name:'Test',cat:'carb',baseUnit:'g',kcal:342,p:12,c:75,f:1.3,portions:[{id:'sp',label:'1 x.q.',amount:12}],source:sourceFor('personal')});
    const m=macroForProduct(sample,50);
    const sampleUsda=usdaToProduct({description:'Bulgur dry',dataType:'Foundation',fdcId:1,foodNutrients:[
      {nutrientName:'Energy',unitName:'KCAL',value:342},{nutrientName:'Protein',unitName:'G',value:12.3},
      {nutrientName:'Carbohydrate, by difference',unitName:'G',value:75.9},{nutrientName:'Total lipid (fat)',unitName:'G',value:1.3}
    ]});
    const ok=sample.portions.length===1&&Math.abs(m.kcal-171)<0.1&&sampleUsda&&sampleUsda.source.priority===260&&sampleUsda.p>12;
    return {ok,schema:SCHEMA,product:sample,macro50:m,usda:sampleUsda};
  }

  migrate();

  const observer=new MutationObserver(scheduleDecorate);
  const mealList=$('#mealList');if(mealList)observer.observe(mealList,{childList:true,subtree:true});
  $('#dayTabs')&&$('#dayTabs').addEventListener('click',()=>setTimeout(scheduleDecorate,30));

  setTimeout(()=>{injectTopTools();hijackLegacyCustomButton();scheduleDecorate()},220);

  window.EldarFitV14={
    schema:SCHEMA,repairData,selfTest,onNativeSearchResult,onInternetTestResult,onBackupImported,onBackupExported,
    openProductManager,openOnlineSearch,decorateMeals,exportBackup,importBackup
  };
})();