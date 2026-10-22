(() => {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const get = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  function isoDate(d) {
    d = d || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function autoDayIndex() {
    const jsDay = new Date().getDay(); // Sun=0, Mon=1 ... Sat=6
    return (jsDay + 6) % 7;           // Mon=0 ... Sun=6
  }
  function workoutForPlanDay(dayIndex) {
    return dayIndex === 0 ? 'A' : dayIndex === 2 ? 'B' : dayIndex === 4 ? 'C' : null;
  }

  const modal = $('#modalBackdrop');
  const modalTitle = $('#modalTitle');
  const modalEyebrow = $('#modalEyebrow');
  const modalBody = $('#modalBody');

  function openModal(title, eyebrow, body) {
    modalTitle.textContent = title;
    modalEyebrow.textContent = eyebrow || 'SEÇİM';
    modalBody.innerHTML = '';
    if (typeof body === 'string') modalBody.innerHTML = body;
    else if (body) modalBody.appendChild(body);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  $('#closeModal').addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });

  function navTo(name) {
    const btn = $('.bottom-nav [data-nav="' + name + '"]');
    if (btn) btn.click();
  }

  function applyAutoDay() {
    const idx = autoDayIndex();
    const btns = $$('#dayTabs button');
    if (btns[idx]) btns[idx].click();
    const d = new Date();
    const dayName = d.toLocaleDateString('az-AZ', {weekday:'long'});
    $('#autoDayLabel').textContent = 'Bugün avtomatik: ' + (idx + 1) + '-ci gün';
    $('#autoDayDate').textContent = dayName + ' · ' + d.toLocaleDateString('az-AZ', {day:'2-digit', month:'long'});
    enhanceMealsSoon();
    renderTodayCard();
  }

  function renderTodayCard() {
    const idx = autoDayIndex();
    const w = workoutForPlanDay(idx);
    $('#todayPlanTitle').textContent = (idx + 1) + '-ci gün' + (w ? ' · Gün ' + w : ' · İstirahət');
    $('#todayPlanSub').textContent = w ? 'Qidalanma planı + Full Body ' + w : 'Qidalanma planı · aktiv bərpa / istirahət';
    $('#openTodayPlan').textContent = w ? 'Məşqə keç' : 'Qidanı aç';
    $('#openTodayPlan').onclick = function() {
      if (w) {
        navTo('workout');
        const wb = $('#workoutTabs [data-work="' + w + '"]');
        if (wb) wb.click();
        enhanceWorkoutSoon();
      } else {
        navTo('food');
        applyAutoDay();
      }
    };
  }

  $('#jumpTodayFood').addEventListener('click', applyAutoDay);

  const foodAlternatives = [
    {re:/yumurta/i, opts:[
      ['150 q yumurta ağı + 1 tam yumurta','Protein yüksək, yağ bir qədər aşağı'],
      ['100 q kəsmik + 1 tam yumurta','Səhər üçün protein alternativi']
    ]},
    {re:/yulaf/i, opts:[
      ['Eyni kaloriyə yaxın tam taxıllı çörək','Karbohidrat və lif mənbəyi'],
      ['Tam taxıllı müsli — şəkərsiz','Etiketə görə miqdarı uyğunlaşdır']
    ]},
    {re:/süd/i, opts:[
      ['Eyni miqdarda 2–2.5% süd','Ən yaxın birbaşa əvəz'],
      ['Kefir','Protein/kalori yaxınlığı üçün etiketə bax']
    ]},
    {re:/banan/i, opts:[
      ['180–200 q alma','Meyvə karbohidratına yaxın praktik seçim'],
      ['180–200 q portağal','Kalorini təxminən yaxın saxlamaq üçün']
    ]},
    {re:/alma/i, opts:[
      ['120–140 q banan','Karbohidratı yaxınlaşdırmaq üçün'],
      ['180–200 q portağal','Meyvə alternativi']
    ]},
    {re:/portağal/i, opts:[
      ['180–200 q alma','Meyvə alternativi'],
      ['120–140 q banan','Karbohidratı yaxınlaşdırmaq üçün']
    ]},
    {re:/toyuq/i, opts:[
      ['Eyni çəkidə hinduşka filesi','Yağsız proteinə çox yaxın'],
      ['Bir qədər artıq ağ balıq','Protein profilinə yaxın'],
      ['Tuna — süzülmüş çəkiyə görə','Etiketdəki proteinə görə miqdarı uyğunlaşdır']
    ]},
    {re:/mal əti/i, opts:[
      ['Eyni proteinə uyğun yağsız dana filesi','Ən yaxın seçim'],
      ['Toyuq/hinduşka + 5–10 q zeytun yağı','Protein və yağ balansını yaxınlaşdırmaq üçün']
    ]},
    {re:/somon/i, opts:[
      ['Eyni çəkidə alabalıq','Yağlı balıq alternativi'],
      ['Ağ balıq + 10 q zeytun yağı','Protein + yağ profilini yaxınlaşdırmaq üçün']
    ]},
    {re:/ağ balıq/i, opts:[
      ['Eyni proteinə uyğun toyuq filesi','Yağsız protein alternativi'],
      ['Tuna — süzülmüş','Yağsız protein alternativi']
    ]},
    {re:/düyü/i, opts:[
      ['Eyni quru çəkidə bulqur','Kalori baxımından praktik yaxın seçim'],
      ['Eyni quru çəkidə Borges tam taxıllı makaron','Karbohidrat miqdarı yaxın'],
      ['Kartof — porsiyanı böyüdərək','Daha aşağı enerji sıxlığı']
    ]},
    {re:/bulqur/i, opts:[
      ['Eyni quru çəkidə Borges tam taxıllı makaron','Praktik 1:1 əvəz'],
      ['Eyni quru çəkidə düyü','Kalori yaxınlığı yaxşıdır'],
      ['Eyni quru çəkidə qarabaşaq','Kompleks karbohidrat alternativi']
    ]},
    {re:/qarabaşaq/i, opts:[
      ['Eyni quru çəkidə bulqur','Kalori yaxınlığı yaxşıdır'],
      ['Eyni quru çəkidə tam taxıllı makaron','Karbohidrat alternativi']
    ]},
    {re:/kartof/i, opts:[
      ['Düyü — quru çəkini kalori üzrə uyğunlaşdır','Daha sıx karbohidrat mənbəyi'],
      ['Bulqur — quru çəkini kalori üzrə uyğunlaşdır','Lifli alternativ']
    ]},
    {re:/Yunan yoqurtu/i, opts:[
      ['30 q whey + 100–150 ml süd','Protein yüksək; kalorini süd ilə yaxınlaşdır'],
      ['Az yağlı kəsmik','Protein yönümlü alternativ'],
      ['Kefir + whey','Maye alternativ']
    ]},
    {re:/kəsmik/i, opts:[
      ['30 q whey','Protein yönümlü rahat seçim'],
      ['Yunan yoqurtu','Süd məhsulu alternativi'],
      ['1–2 yumurta','Menyuya görə istifadə et']
    ]},
    {re:/kefir/i, opts:[
      ['Süd','Maye süd məhsulu alternativi'],
      ['Yunan yoqurtu + su','Protein daha yüksək ola bilər']
    ]},
    {re:/badam/i, opts:[
      ['Eyni kaloriyə uyğun qoz','Yağ və enerji mənbəyi'],
      ['Fındıq','Eyni qida qrupu']
    ]},
    {re:/qoz/i, opts:[
      ['Eyni kaloriyə uyğun badam','Yağ və enerji mənbəyi'],
      ['Fındıq','Eyni qida qrupu']
    ]},
    {re:/zeytun yağı/i, opts:[
      ['Eyni kaloriyə uyğun qoz/badam','Yağ mənbəyi'],
      ['Avokado — porsiyanı kalori üzrə uyğunlaşdır','Mono-doymamış yağ alternativi']
    ]},
    {re:/çörək/i, opts:[
      ['Yulaf — quru çəkini kalori üzrə uyğunlaşdır','Kompleks karbohidrat'],
      ['Tam taxıllı makaron/bulqur','Başqa yeməyə keçirmək üçün']
    ]},
    {re:/ağ pendir/i, opts:[
      ['Az yağlı kəsmik','Protein daha yüksək'],
      ['Yunan yoqurtu','Yüngül alternativ']
    ]}
  ];

  function optionsForFood(text) {
    for (let i = 0; i < foodAlternatives.length; i++) {
      if (foodAlternatives[i].re.test(text)) return foodAlternatives[i].opts;
    }
    return [];
  }
  function currentFoodDay() {
    const btn = $('#dayTabs button.active');
    return btn ? Number(btn.dataset.day) : autoDayIndex();
  }
  function foodSwapKey(day, meal, part) { return day + ':' + meal + ':' + part; }
  function foodSwaps() { return get('foodSwaps_v11', {}); }

  function openFoodSwap(day, mealIdx, partIdx, original) {
    const list = document.createElement('div');
    list.className = 'choice-list';
    const swaps = foodSwaps();
    const key = foodSwapKey(day, mealIdx, partIdx);
    const opts = optionsForFood(original);

    const originalBtn = document.createElement('button');
    originalBtn.className = 'choice-btn primary-choice';
    originalBtn.innerHTML = '<b>Əsas plana qaytar</b><span>' + original + '</span>';
    originalBtn.onclick = function() {
      delete swaps[key];
      set('foodSwaps_v11', swaps);
      closeModal();
      enhanceMealsSoon();
    };
    list.appendChild(originalBtn);

    if (!opts.length) {
      const p = document.createElement('p');
      p.className = 'sub';
      p.textContent = 'Bu qida üçün hazır alternativ bazasında uyğun seçim yoxdur. Növbəti versiyada fərdi qida bazası genişləndiriləcək.';
      list.appendChild(p);
    } else {
      opts.forEach(function(opt) {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.innerHTML = '<b>' + opt[0] + '</b><span>' + opt[1] + '</span>';
        b.onclick = function() {
          swaps[key] = {original:original, value:opt[0], note:opt[1]};
          set('foodSwaps_v11', swaps);
          closeModal();
          enhanceMealsSoon();
        };
        list.appendChild(b);
      });
    }
    openModal(original, 'QİDA ƏVƏZLƏMƏ', list);
  }

  function enhanceMeals() {
    const day = currentFoodDay();
    const swaps = foodSwaps();
    $$('#mealList .meal-row').forEach(function(row, mealIdx) {
      const desc = $('.row-desc', row);
      if (!desc || desc.dataset.smart === '1') return;
      const originalText = desc.textContent;
      const parts = originalText.split(' · ');
      desc.dataset.smart = '1';
      desc.innerHTML = '';
      parts.forEach(function(part, partIdx) {
        const key = foodSwapKey(day, mealIdx, partIdx);
        const choice = swaps[key];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'food-chip' + (choice ? ' swapped' : '');
        b.innerHTML = (choice ? choice.value : part) + '<small>↔</small>';
        b.addEventListener('click', function(e) {
          e.preventDefault(); e.stopPropagation();
          openFoodSwap(day, mealIdx, partIdx, choice ? choice.original : part);
        });
        desc.appendChild(b);
      });
    });
  }
  function enhanceMealsSoon() { setTimeout(enhanceMeals, 20); }
  $('#dayTabs').addEventListener('click', enhanceMealsSoon);

  const alternatives = {
    'Smith Squat':[
      ['Hack Squat','Eyni knee-dominant pattern; quadriceps fokus'],
      ['Pendulum Squat','Quadriceps yönümlü alternativ'],
      ['Leg Press','Texnikası daha sadə maşın alternativi']
    ],
    'Flat Bench Press Machine':[
      ['Smith Machine Bench Press','Stabil press alternativi'],
      ['Dumbbell Bench Press','Sərbəst çəki alternativi'],
      ['Chest Press Machine','Eyni horizontal press patterni']
    ],
    'Chest-Supported Row':[
      ['Chest-Supported T-Bar Row','Sinə dəstəyi saxlanır'],
      ['Machine Row','Stabil horizontal pull'],
      ['Seated Cable Row','Horizontal pull alternativi']
    ],
    'Leg Curl':[
      ['Seated Leg Curl','Hamstring knee-flexion'],
      ['Lying Leg Curl','Hamstring knee-flexion']
    ],
    'Machine Shoulder Press':[
      ['Dumbbell Shoulder Press','Vertical press'],
      ['Smith Shoulder Press','Stabil vertical press']
    ],
    'Incline Dumbbell Curl':[
      ['Bayesian Cable Curl','Long-head uzun mövqedə'],
      ['Incline Cable Curl','Long-head vurğusu']
    ],
    'Rope Triceps Pushdown':[
      ['Cable Bar Pushdown','Eyni elbow-extension patterni'],
      ['Single-Arm Cable Pushdown','Birtərəfli alternativ']
    ],
    'Calf Raise':[
      ['Standing Calf Raise','Gastrocnemius vurğusu'],
      ['Seated Calf Raise','Soleus vurğusu'],
      ['Leg Press Calf Raise','Maşın alternativi']
    ],
    'Leg Press':[
      ['Hack Squat','Knee-dominant alternativ'],
      ['Smith Squat','Compound alternativ']
    ],
    'Incline Smith / DB Press':[
      ['Incline Chest Press Machine','Üst sinə vurğusu'],
      ['Incline Dumbbell Press','Sərbəst çəki'],
      ['Incline Smith Press','Stabil variant']
    ],
    'Lat Pulldown':[
      ['Assisted Pull-Up','Vertical pull'],
      ['Neutral-Grip Pulldown','Lat yönümlü'],
      ['Single-Arm Cable Pulldown','Birtərəfli lat işi']
    ],
    'Hip Thrust':[
      ['Glute Bridge Machine','Hip-extension alternativi'],
      ['Smith Hip Thrust','Stabil variant']
    ],
    'Lateral Raise':[
      ['Cable Lateral Raise','Lateral deltoid'],
      ['Machine Lateral Raise','Stabil alternativ']
    ],
    'Reverse Pec Deck':[
      ['Cable Reverse Fly','Posterior deltoid'],
      ['Rear-Delt Machine Fly','Eyni funksional alternativ']
    ],
    'Hammer Curl':[
      ['Rope Hammer Curl','Brachialis/brachioradialis'],
      ['Cross-Body Hammer Curl','Eyni vurğu']
    ],
    'Overhead Cable Triceps Extension':[
      ['Single-Arm Overhead Cable Extension','Long-head vurğusu'],
      ['Dumbbell Overhead Extension','Long-head alternativi']
    ],
    'Cable Crunch':[
      ['Machine Crunch','Spinal flexion'],
      ['Weighted Crunch','Eyni əsas funksiya']
    ],
    'Smith Squat / Hack Squat':[
      ['Hack Squat','Quadriceps fokus'],
      ['Smith Squat','Compound alternativ'],
      ['Leg Press','Maşın alternativi']
    ],
    'Slight Decline Chest Press / Assisted Dips':[
      ['Decline Chest Press Machine','Aşağı/orta sinə'],
      ['Assisted Dips','Sinə yönümlü'],
      ['High-to-Low Cable Press','Aşağı liflərə yönümlü']
    ],
    'Seated Cable Row — neutral grip':[
      ['Machine Row — neutral grip','Lat + midback'],
      ['Single-Arm Cable Row','Birtərəfli horizontal pull'],
      ['Chest-Supported Row','Stabil alternativ']
    ],
    'Face Pull':[
      ['Cable Rear-Delt Row','Arxa çiyin + midback'],
      ['High Cable Reverse Fly','Posterior deltoid']
    ],
    'Preacher Curl':[
      ['Machine Preacher Curl','Short-head vurğusu'],
      ['Spider Curl','Biceps alternativi']
    ],
    'Hanging / Lying Leg Raise':[
      ['Captain Chair Knee Raise','Hip flexion + abs'],
      ['Reverse Crunch','Alt qarın yönümlü']
    ]
  };

  function exerciseSelections() { return get('exerciseSelections_v11', {}); }
  function exKey(day, idx) { return day + ':' + idx; }

  function openExerciseSwap(day, idx, original) {
    const list = document.createElement('div');
    list.className = 'choice-list';
    const selections = exerciseSelections();
    const key = exKey(day, idx);

    const reset = document.createElement('button');
    reset.className = 'choice-btn primary-choice';
    reset.innerHTML = '<b>Əsas hərəkət</b><span>' + original + '</span>';
    reset.onclick = function() {
      delete selections[key]; set('exerciseSelections_v11', selections); closeModal(); enhanceWorkoutSoon();
    };
    list.appendChild(reset);

    (alternatives[original] || []).forEach(function(opt) {
      const b = document.createElement('button');
      b.className = 'choice-btn';
      b.innerHTML = '<b>' + opt[0] + '</b><span>' + opt[1] + '</span>';
      b.onclick = function() {
        selections[key] = {original:original, value:opt[0], note:opt[1]};
        set('exerciseSelections_v11', selections);
        closeModal(); enhanceWorkoutSoon();
      };
      list.appendChild(b);
    });
    openModal(original, 'HƏRƏKƏT ALTERNATİVİ', list);
  }

  function workoutLogs() { return get('workoutLogs_v11', []); }
  function setWorkoutLogs(v) { set('workoutLogs_v11', v); }
  function lastLog(day, idx) {
    const logs = workoutLogs().filter(function(x){ return x.day === day && x.index === idx; });
    return logs.length ? logs[logs.length - 1] : null;
  }
  function parseSetCount(tag) {
    const m = String(tag).match(/(\d+)(?:\s*[–-]\s*(\d+))?\s*×/);
    return m ? Number(m[2] || m[1]) : 3;
  }
  function parseTopRep(tag) {
    const m = String(tag).match(/×\s*(\d+)\s*[–-]\s*(\d+)/);
    return m ? Number(m[2]) : null;
  }
  function progressiveText(log, tag) {
    if (!log || !log.sets || !log.sets.length) return '';
    const top = parseTopRep(tag);
    if (!top) return '';
    const valid = log.sets.filter(function(x){ return Number(x.reps) > 0; });
    if (!valid.length) return '';
    const hit = valid.every(function(x){ return Number(x.reps) >= top && (x.rir === '' || Number(x.rir) <= 2); });
    return hit ? '✓ Növbəti dəfə ən kiçik mümkün çəki artımını sına.' : '';
  }

  function openSetLog(day, idx, exerciseName, tag) {
    const old = lastLog(day, idx);
    const count = parseSetCount(tag);
    const root = document.createElement('div');
    const info = document.createElement('p');
    info.className = 'sub';
    info.textContent = old ? 'Son qeyd: ' + old.date + '. Dəyərləri dəyişib yeni qeyd kimi saxla.' : 'İş setlərinin çəkisini, təkrarını və RIR-ni yaz.';
    root.appendChild(info);

    const head = document.createElement('div');
    head.className = 'set-row';
    head.innerHTML = '<div></div><div class="set-head">ÇƏKİ, KG</div><div class="set-head">REP</div><div class="set-head">RIR</div>';
    root.appendChild(head);

    const table = document.createElement('div'); table.className = 'set-table';
    for (let i=0; i<count; i++) {
      const previous = old && old.sets && old.sets[i] ? old.sets[i] : {};
      const row = document.createElement('div'); row.className = 'set-row';
      row.innerHTML =
        '<b>Set ' + (i+1) + '</b>' +
        '<input inputmode="decimal" type="number" step="0.5" min="0" data-field="weight" value="' + (previous.weight || '') + '">' +
        '<input inputmode="numeric" type="number" step="1" min="0" data-field="reps" value="' + (previous.reps || '') + '">' +
        '<input inputmode="numeric" type="number" step="1" min="0" max="5" data-field="rir" value="' + (previous.rir === 0 ? '0' : (previous.rir || '')) + '">';
      table.appendChild(row);
    }
    root.appendChild(table);

    const actions = document.createElement('div'); actions.className = 'sheet-actions';
    const clear = document.createElement('button'); clear.className = 'danger-btn'; clear.textContent = 'Son qeydi sil';
    const save = document.createElement('button'); save.className = 'primary'; save.textContent = 'Setləri saxla'; save.style.marginTop = '0';
    actions.appendChild(clear); actions.appendChild(save); root.appendChild(actions);

    clear.onclick = function() {
      let logs = workoutLogs();
      for (let i=logs.length-1; i>=0; i--) {
        if (logs[i].day === day && logs[i].index === idx) { logs.splice(i,1); break; }
      }
      setWorkoutLogs(logs); closeModal(); enhanceWorkoutSoon();
    };
    save.onclick = function() {
      const sets = $$('.set-row', table).map(function(row) {
        const w = $('[data-field="weight"]', row).value;
        const r = $('[data-field="reps"]', row).value;
        const rir = $('[data-field="rir"]', row).value;
        return {weight:w, reps:r, rir:rir};
      }).filter(function(x){ return x.weight !== '' || x.reps !== '' || x.rir !== ''; });
      if (!sets.length) { alert('Ən azı bir set daxil et.'); return; }
      const logs = workoutLogs();
      logs.push({date:isoDate(), day:day, index:idx, exercise:exerciseName, tag:tag, sets:sets});
      setWorkoutLogs(logs.slice(-300));
      closeModal(); enhanceWorkoutSoon();
    };
    openModal(exerciseName, 'SET JURNALI', root);
  }

  function currentWorkoutDay() {
    const b = $('#workoutTabs button.active');
    return b ? b.dataset.work : 'A';
  }

  function enhanceWorkout() {
    const day = currentWorkoutDay();
    const selections = exerciseSelections();
    $$('#exerciseList .exercise-row').forEach(function(row, idx) {
      const main = row.children[1];
      if (!main || main.dataset.smart === '1') return;
      main.dataset.smart = '1';
      const title = $('.row-title', main);
      const desc = $('.row-desc', main);
      const tag = $('.tag', row);
      if (!title || !tag) return;
      const original = title.textContent;
      const selection = selections[exKey(day, idx)];
      if (selection) {
        title.textContent = selection.value;
        if (desc) desc.textContent = selection.note + ' · əsas: ' + original;
      }
      const shownName = selection ? selection.value : original;

      const tools = document.createElement('div'); tools.className = 'exercise-tools';
      const swap = document.createElement('button'); swap.type='button'; swap.className='swap-action'; swap.textContent='↔ Alternativ';
      const log = document.createElement('button'); log.type='button'; log.className='log-btn'; log.textContent='＋ Setləri yaz';
      [swap, log].forEach(function(b){ b.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); }); });
      swap.addEventListener('click', function(){ openExerciseSwap(day, idx, selection ? selection.original : original); });
      log.addEventListener('click', function(){ openSetLog(day, idx, shownName, tag.textContent); });
      tools.appendChild(swap); tools.appendChild(log); main.appendChild(tools);

      const last = lastLog(day, idx);
      if (last) {
        const line = document.createElement('div'); line.className='last-log';
        const summary = last.sets.map(function(x){ return (x.weight || '—') + 'kg×' + (x.reps || '—'); }).join(' · ');
        line.textContent = 'Son: ' + summary;
        main.appendChild(line);
        const note = progressiveText(last, tag.textContent);
        if (note) {
          const n = document.createElement('div'); n.className='progress-note'; n.textContent=note; main.appendChild(n);
        }
      }
    });
  }
  function enhanceWorkoutSoon(){ setTimeout(enhanceWorkout, 20); }
  $('#workoutTabs').addEventListener('click', enhanceWorkoutSoon);

  $$('.bottom-nav button').forEach(function(b) {
    b.addEventListener('click', function() {
      if (b.dataset.nav === 'food') {
        setTimeout(function(){ applyAutoDay(); }, 10);
      }
      if (b.dataset.nav === 'workout') {
        setTimeout(function(){
          const w = workoutForPlanDay(autoDayIndex());
          if (w) {
            const wb = $('#workoutTabs [data-work="' + w + '"]');
            if (wb) wb.click();
          }
          enhanceWorkoutSoon();
        }, 10);
      }
    });
  });

  setTimeout(function() {
    renderTodayCard();
    applyAutoDay();
    enhanceWorkout();
  }, 30);
})();