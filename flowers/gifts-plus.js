(() => {
  const events = window.EMOSEED_GIFT_EVENTS || [];
  const bouquets = window.EMOSEED_BOUQUETS || {};
  const PROFILE_KEY = 'emoseed-gift-profiles';
  const PLAN_KEY = 'emoseed-gift-plans';
  const PERSONAL_KEY = 'emoseed-personal-gift-dates';
  const CHECK_KEY = 'emoseed-gift-checklist';
  let calendarQuery = '';
  let calendarMonth = 'all';
  let selectedMessage = 0;
  let orderObserver;

  const pad = (value) => String(value).padStart(2, '0');
  const clean = (value = '') => String(value).replace(/[<>]/g, '').trim();
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const daysBetween = (a,b) => Math.round((a-b)/86400000);
  const formatDate = (date, year=false) => new Intl.DateTimeFormat('ko-KR',{...(year?{year:'numeric'}:{}),month:'long',day:'numeric',weekday:'short'}).format(date);
  const readJSON = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (_) { return fallback; } };
  const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };

  function nthWeekday(year, monthIndex, weekday, nth) {
    const first = new Date(year, monthIndex, 1);
    const offset = (weekday-first.getDay()+7)%7;
    return new Date(year, monthIndex, 1+offset+(nth-1)*7);
  }

  function eventDate(event, year) {
    if (event.rule === 'second-sunday-may') return nthWeekday(year,4,0,2);
    if (event.rule === 'third-monday-may') return nthWeekday(year,4,1,3);
    if (event.rule === 'third-sunday-june') return nthWeekday(year,5,0,3);
    return new Date(year,(event.month||1)-1,event.day||1);
  }

  function nextDate(event, from=today()) {
    let date=eventDate(event,from.getFullYear());
    if(date<from) date=eventDate(event,from.getFullYear()+1);
    return date;
  }

  function personalDates() {
    return readJSON(PERSONAL_KEY).map(item => {
      const original=new Date(`${item.date}T00:00:00`);
      let date=original;
      if(item.repeat){date=new Date(today().getFullYear(),original.getMonth(),original.getDate());if(date<today())date=new Date(today().getFullYear()+1,original.getMonth(),original.getDate());}
      return {...item,id:`personal-${item.id}`,type:'personal',date,leadDays:3,flowers:['맞춤 꽃다발'],meaning:item.note||'직접 저장한 소중한 날'};
    }).filter(item=>item.date>=today());
  }

  function allUpcoming() {
    return [...events.map(event=>({...event,date:nextDate(event)})),...personalDates()].sort((a,b)=>a.date-b.date);
  }

  function deadlineFor(event) {
    const lead=event.leadDays || (event.highDemand?7:3);
    const date=new Date(event.date || nextDate(event));
    date.setDate(date.getDate()-lead);
    return date;
  }

  function countdownLabel(date) {
    const days=daysBetween(date,today());
    if(days===0)return '오늘';
    if(days<0)return `${Math.abs(days)}일 지남`;
    return `D-${days}`;
  }

  function insertDashboard() {
    const upcoming=document.getElementById('upcoming');
    if(!upcoming || document.getElementById('gift-dashboard')) return;
    upcoming.insertAdjacentHTML('beforebegin',`<section class="gift-section" id="gift-dashboard">
      <div class="gift-section-head"><div><span class="eyebrow">Gift Readiness</span><h2>선물 준비 대시보드</h2></div><p>가장 가까운 날을 기준으로 주문 시점과 준비 상태를 한눈에 확인하세요.</p></div>
      <div class="gift-dashboard" id="giftDashboardCards"></div>
      <div class="prep-grid"><article class="prep-card"><h3 id="prepTitle">다음 선물 준비</h3><p id="prepDescription"></p><div class="prep-progress"><span id="prepProgressBar"></span></div><div class="checklist" id="giftChecklist"></div></article><article class="prep-card"><div class="deadline-box"><small>권장 주문 완료일</small><strong id="orderDeadline">-</strong><p id="deadlineDescription"></p></div><div class="result-actions" style="margin-top:14px"><button class="small-action" id="reminderCalendar" type="button">7일·1일 전 알림 추가</button><a class="small-action" href="#recipient-profiles">받는 사람 취향 저장</a></div></article></div>
    </section>`);
    document.getElementById('reminderCalendar')?.addEventListener('click',()=>downloadReminderICS(allUpcoming()[0]));
  }

  function renderDashboard() {
    const list=allUpcoming();
    const next=list[0];
    const within30=list.filter(item=>daysBetween(item.date,today())<=30).length;
    const profiles=readJSON(PROFILE_KEY);
    const plans=readJSON(PLAN_KEY);
    const deadline=next?deadlineFor(next):null;
    const deadlineDays=deadline?daysBetween(deadline,today()):0;
    document.getElementById('giftDashboardCards').innerHTML=`
      <article class="dashboard-card"><small>30일 안의 기념일</small><strong>${within30}개</strong><span>개인 기념일을 저장하면 함께 계산돼요.</span></article>
      <article class="dashboard-card"><small>가장 가까운 날</small><strong>${next?countdownLabel(next.date):'-'}</strong><span>${next?escapeHTML(next.title):'등록된 일정 없음'}</span></article>
      <article class="dashboard-card"><small>저장한 사람</small><strong>${profiles.length}명</strong><span>취향을 저장하면 추천 조건이 자동 입력돼요.</span></article>
      <article class="dashboard-card"><small>저장한 선물 플랜</small><strong>${plans.length}개</strong><span>주문 문구와 카드 메시지를 다시 볼 수 있어요.</span></article>`;
    if(!next)return;
    document.getElementById('prepTitle').textContent=`${next.title} 준비하기`;
    document.getElementById('prepDescription').textContent=`${formatDate(next.date,true)} · ${countdownLabel(next.date)} · 추천 꽃: ${(next.flowers||[]).join(' · ')}`;
    document.getElementById('orderDeadline').textContent=formatDate(deadline,true);
    document.getElementById('deadlineDescription').textContent=deadlineDays<0?'권장 주문일이 지났어요. 오늘 바로 가까운 꽃집의 당일 제작 가능 여부를 확인하세요.':deadlineDays===0?'오늘 주문을 마치는 것을 추천해요.':`${deadlineDays}일 뒤까지 주문하면 비교적 여유롭게 준비할 수 있어요.`;
    renderChecklist(next);
  }

  function checklistKey(event){return `${CHECK_KEY}-${event.id}-${event.date.getFullYear()}`;}
  function renderChecklist(event){
    const tasks=['예산과 선물 형태 정하기','받는 사람의 색·향·반려동물 확인','꽃집 예약 또는 주문 완료','카드 문구와 전달 방법 준비'];
    const state=readJSON(checklistKey(event),{});
    const target=document.getElementById('giftChecklist');
    target.innerHTML=tasks.map((task,index)=>`<label class="check-row"><input type="checkbox" data-prep-check="${index}" ${state[index]?'checked':''}><span>${task}</span></label>`).join('');
    const update=()=>{const current={};target.querySelectorAll('[data-prep-check]').forEach(box=>current[box.dataset.prepCheck]=box.checked);writeJSON(checklistKey(event),current);const done=Object.values(current).filter(Boolean).length;document.getElementById('prepProgressBar').style.width=`${done/tasks.length*100}%`;};
    target.querySelectorAll('[data-prep-check]').forEach(box=>box.addEventListener('change',update));update();
  }

  function insertCalendarTools(){
    const panel=document.querySelector('#all-calendar .gift-panel');
    if(!panel || document.getElementById('calendarSearch'))return;
    panel.insertAdjacentHTML('afterbegin',`<div class="calendar-search-row"><input id="calendarSearch" type="search" placeholder="기념일·대상·추천 꽃 검색"><button class="small-action" id="calendarSearchClear" type="button">검색 초기화</button></div><div class="month-strip" id="calendarMonths"><button class="month-button" data-month="all" aria-pressed="true">전체 월</button>${Array.from({length:12},(_,i)=>`<button class="month-button" data-month="${i+1}" aria-pressed="false">${i+1}월</button>`).join('')}</div>`);
    document.getElementById('calendarSearch').addEventListener('input',e=>{calendarQuery=e.target.value.toLowerCase().trim();applyCalendarView();});
    document.getElementById('calendarSearchClear').addEventListener('click',()=>{document.getElementById('calendarSearch').value='';calendarQuery='';calendarMonth='all';document.querySelectorAll('[data-month]').forEach(btn=>btn.setAttribute('aria-pressed',btn.dataset.month==='all'));applyCalendarView();});
    document.querySelectorAll('[data-month]').forEach(btn=>btn.addEventListener('click',()=>{calendarMonth=btn.dataset.month;document.querySelectorAll('[data-month]').forEach(item=>item.setAttribute('aria-pressed',item===btn));applyCalendarView();}));
    const list=document.getElementById('calendarList');
    new MutationObserver(()=>applyCalendarView()).observe(list,{childList:true});
  }

  function applyCalendarView(){
    document.querySelectorAll('#calendarList .calendar-row').forEach(row=>{
      const text=row.textContent.toLowerCase();
      const dateText=row.querySelector('.date')?.textContent||'';
      const monthMatch=dateText.match(/(\d+)월/);
      const matchesQuery=!calendarQuery||text.includes(calendarQuery);
      const matchesMonth=calendarMonth==='all'||String(monthMatch?.[1])===calendarMonth;
      row.hidden=!(matchesQuery&&matchesMonth);
    });
  }

  function insertProfiles(){
    const builder=document.getElementById('bouquet-builder');
    if(!builder || document.getElementById('recipient-profiles'))return;
    builder.insertAdjacentHTML('beforebegin',`<section class="gift-section" id="recipient-profiles"><div class="gift-section-head"><div><span class="eyebrow">Recipient Profiles</span><h2>받는 사람 취향 저장</h2></div><p>좋아하는 색, 향 민감도, 반려동물 여부를 저장하면 다음 선물 때 다시 묻지 않아도 돼요.</p></div><div class="recipient-layout"><form class="gift-panel" id="profileForm"><div class="field-grid"><div class="field"><label for="profileName">이름 또는 별칭</label><input id="profileName" name="name" required placeholder="예: 엄마"></div><div class="field"><label for="profileRelation">관계</label><select id="profileRelation" name="relation"><option value="lover">연인</option><option value="parent">부모님·가족</option><option value="teacher">선생님·멘토</option><option value="friend">친구</option><option value="colleague">동료·고객</option><option value="self">나 자신</option></select></div><div class="field"><label for="profileColor">좋아하는 색감</label><select id="profileColor" name="color"><option value="pastel">파스텔</option><option value="warm">노랑·주황</option><option value="white">화이트·그린</option><option value="purple">보라·블루</option><option value="vivid">선명한 컬러</option></select></div><div class="field"><label for="profileBudget">기본 예산</label><select id="profileBudget" name="budget"><option value="20000">2만원대</option><option value="30000" selected>3만원대</option><option value="50000">5만원대</option><option value="70000">7만원 이상</option></select></div><div class="field"><label for="profilePet">함께 사는 반려동물</label><select id="profilePet" name="pet"><option value="none">없음·모름</option><option value="cat">고양이</option><option value="dog">강아지</option><option value="other">기타 반려동물</option></select></div><div class="field"><label for="profileScent">향 민감도</label><select id="profileScent" name="scent"><option value="normal">상관없음</option><option value="low">은은한 향 선호</option><option value="avoid">향이 강한 꽃 제외</option></select></div><div class="field full"><label for="profileNotes">피해야 할 꽃·취향 메모</label><textarea id="profileNotes" name="notes" placeholder="예: 빨간색은 싫어함, 꽃병 없음, 백합 제외"></textarea></div></div><button class="primary-button" type="submit" style="margin-top:14px">프로필 저장</button></form><div class="gift-panel"><div class="recipient-list" id="recipientList"></div></div></div></section>`);
    document.getElementById('profileForm').addEventListener('submit',saveProfile);
    renderProfiles();
  }

  function saveProfile(event){
    event.preventDefault();const data=new FormData(event.currentTarget);const profile={id:`${Date.now()}`,name:clean(data.get('name')),relation:data.get('relation'),color:data.get('color'),budget:data.get('budget'),pet:data.get('pet'),scent:data.get('scent'),notes:clean(data.get('notes'))};if(!profile.name)return;const list=readJSON(PROFILE_KEY);list.push(profile);writeJSON(PROFILE_KEY,list);event.currentTarget.reset();renderProfiles();renderProfileSelect();renderDashboard();window.EmoSeedApp?.toast?.('받는 사람의 취향을 저장했어요.');
  }

  function renderProfiles(){
    const list=readJSON(PROFILE_KEY);const target=document.getElementById('recipientList');if(!target)return;
    target.innerHTML=list.length?list.map(profile=>`<article class="recipient-card"><h3>${escapeHTML(profile.name)}</h3><p>${relationLabel(profile.relation)} · ${colorLabel(profile.color)} · ${budgetLabel(profile.budget)}</p><div class="recipient-tags"><span class="occasion-tag">${profile.pet==='cat'?'🐱 고양이':profile.pet==='dog'?'🐶 강아지':profile.pet==='other'?'🐾 반려동물':'반려동물 정보 없음'}</span>${profile.scent==='avoid'?'<span class="occasion-tag">향 강한 꽃 제외</span>':''}</div>${profile.notes?`<p style="margin-top:9px">${escapeHTML(profile.notes)}</p>`:''}<div class="recipient-actions"><button class="small-action" data-apply-profile="${profile.id}" type="button">추천에 적용</button><button class="delete-date" data-delete-profile="${profile.id}" type="button">삭제</button></div></article>`).join(''):'<div class="empty-personal">아직 저장한 사람이 없어요. 자주 꽃을 선물하는 사람의 취향부터 저장해보세요.</div>';
    target.querySelectorAll('[data-apply-profile]').forEach(btn=>btn.addEventListener('click',()=>applyProfile(btn.dataset.applyProfile,true)));
    target.querySelectorAll('[data-delete-profile]').forEach(btn=>btn.addEventListener('click',()=>{writeJSON(PROFILE_KEY,readJSON(PROFILE_KEY).filter(item=>item.id!==btn.dataset.deleteProfile));renderProfiles();renderProfileSelect();renderDashboard();}));
  }

  const relationLabel=value=>({lover:'연인',parent:'부모님·가족',teacher:'선생님·멘토',friend:'친구',colleague:'동료·고객',self:'나 자신'}[value]||'소중한 사람');
  const colorLabel=value=>({pastel:'파스텔',warm:'노랑·주황',white:'화이트·그린',purple:'보라·블루',vivid:'선명한 컬러'}[value]||'색감 미정');
  const budgetLabel=value=>({20000:'2만원대',30000:'3만원대',50000:'5만원대',70000:'7만원 이상'}[value]||'예산 미정');

  function augmentBuilder(){
    const form=document.querySelector('#bouquet-builder .builder-form');const result=document.querySelector('#bouquet-builder .builder-result');if(!form||!result||document.getElementById('giftStyle'))return;
    form.insertAdjacentHTML('afterbegin',`<div class="profile-select-row"><select id="builderProfile"><option value="">저장한 사람 불러오기</option></select><button class="small-action" id="applyBuilderProfile" type="button">적용</button></div>`);
    const grid=form.querySelector('.field-grid');
    grid.insertAdjacentHTML('beforeend',`<div class="field"><label for="giftStyle">선물 형태</label><select id="giftStyle"><option value="bouquet">꽃다발</option><option value="single">한 송이·미니 꽃다발</option><option value="basket">꽃바구니</option><option value="vase">화병 포함 꽃</option><option value="potted">화분·식물</option></select></div><div class="field"><label for="deliveryMethod">전달 방법</label><select id="deliveryMethod"><option value="pickup">직접 픽업·전달</option><option value="delivery">꽃집 배송</option><option value="surprise">깜짝 전달</option></select></div><div class="field"><label for="giftDate">전달 예정일</label><input id="giftDate" type="date"></div><div class="field"><label for="petSafety">반려동물 안전</label><select id="petSafety"><option value="none">해당 없음·모름</option><option value="cat">고양이와 함께 살아요</option><option value="dog">강아지와 함께 살아요</option><option value="other">기타 반려동물이 있어요</option></select></div><div class="field full"><label><input id="preferSeasonal" type="checkbox" checked> 특정 꽃이 없으면 제철이고 상태 좋은 꽃을 우선</label></div>`);
    result.insertAdjacentHTML('beforeend',`<div class="safety-note" id="petSafetyNote">받는 사람의 향 민감도와 반려동물 여부를 확인하면 더 안전한 선물이 됩니다.</div><div class="message-panel"><h4>카드 문구 3가지</h4><div class="message-tabs" id="messageTabs"><button class="message-tab" data-message-index="0" aria-pressed="true">다정하게</button><button class="message-tab" data-message-index="1" aria-pressed="false">담백하게</button><button class="message-tab" data-message-index="2" aria-pressed="false">진심 있게</button></div><div class="message-copy" id="cardMessage"></div><div class="result-actions"><button class="small-action" id="copyMessage" type="button">문구 복사</button><button class="small-action" id="saveGiftPlan" type="button">선물 플랜 저장</button><button class="small-action" id="shareGiftPlan" type="button">플랜 공유</button></div></div>`);
    document.getElementById('applyBuilderProfile').addEventListener('click',()=>applyProfile(document.getElementById('builderProfile').value,true));
    ['giftStyle','deliveryMethod','giftDate','petSafety','preferSeasonal'].forEach(id=>document.getElementById(id).addEventListener('change',refreshBuilderPlus));
    document.querySelectorAll('[data-message-index]').forEach(btn=>btn.addEventListener('click',()=>{selectedMessage=Number(btn.dataset.messageIndex);document.querySelectorAll('[data-message-index]').forEach(item=>item.setAttribute('aria-pressed',item===btn));renderMessage();}));
    document.getElementById('copyMessage').addEventListener('click',()=>window.EmoSeedApp?.copyText?.(document.getElementById('cardMessage').textContent,'카드 문구를 복사했어요.'));
    document.getElementById('saveGiftPlan').addEventListener('click',savePlan);
    document.getElementById('shareGiftPlan').addEventListener('click',sharePlan);
    renderProfileSelect();
    orderObserver=new MutationObserver(()=>enhanceOrderText());orderObserver.observe(document.getElementById('orderText'),{childList:true,characterData:true,subtree:true});
    document.querySelectorAll('#bouquet-builder select,#bouquet-builder input').forEach(el=>el.addEventListener('change',()=>setTimeout(refreshBuilderPlus,0)));
    refreshBuilderPlus();
  }

  function renderProfileSelect(){const select=document.getElementById('builderProfile');if(!select)return;const current=select.value;select.innerHTML='<option value="">저장한 사람 불러오기</option>'+readJSON(PROFILE_KEY).map(p=>`<option value="${p.id}">${escapeHTML(p.name)} · ${relationLabel(p.relation)}</option>`).join('');select.value=current;}

  function applyProfile(id,scroll=false){const profile=readJSON(PROFILE_KEY).find(item=>item.id===id);if(!profile)return;document.getElementById('builderProfile').value=id;document.getElementById('bouquetRecipient').value=profile.relation;document.getElementById('bouquetColor').value=profile.color;document.getElementById('bouquetBudget').value=profile.budget;document.getElementById('petSafety').value=profile.pet;document.getElementById('bouquetFragrance').checked=profile.scent==='avoid';if(profile.notes)document.getElementById('customEventName').value=`${profile.name} 선물 · ${profile.notes}`;['bouquetRecipient','bouquetColor','bouquetBudget','petSafety','bouquetFragrance'].forEach(id=>document.getElementById(id).dispatchEvent(new Event('change',{bubbles:true})));refreshBuilderPlus();if(scroll)document.getElementById('bouquet-builder').scrollIntoView({behavior:'smooth'});window.EmoSeedApp?.toast?.(`${profile.name}님의 취향을 적용했어요.`);}

  function styleLabel(value){return {bouquet:'꽃다발',single:'한 송이 또는 미니 꽃다발',basket:'꽃바구니',vase:'화병을 포함한 꽃',potted:'화분 또는 식물'}[value]||'꽃다발';}
  function deliveryLabel(value){return {pickup:'직접 픽업해 전달',delivery:'꽃집 배송',surprise:'깜짝 전달'}[value]||'직접 전달';}

  function enhanceOrderText(){
    const target=document.getElementById('orderText');if(!target)return;
    const marker=' [EmoSeed 추가 조건] ';
    const base=target.textContent.split(marker)[0].trim();
    const style=styleLabel(document.getElementById('giftStyle')?.value);
    const delivery=deliveryLabel(document.getElementById('deliveryMethod')?.value);
    const seasonal=document.getElementById('preferSeasonal')?.checked?'특정 꽃이 없으면 제철이고 상태 좋은 꽃으로 자연스럽게 대체해주세요.':'';
    const pet=document.getElementById('petSafety')?.value;
    let petText='';
    if(pet==='cat')petText='고양이와 함께 사는 집이므로 백합속·원추리속 꽃과 꽃가루 위험 소재는 완전히 제외하고, 고양이 안전성을 확인한 꽃으로 구성해주세요.';
    else if(pet==='dog')petText='강아지와 함께 사는 집이므로 반려견에게 안전한지 확인한 꽃으로 구성해주세요.';
    else if(pet==='other')petText='반려동물이 있는 집이므로 동물 종류별 안전성을 확인한 꽃으로 구성해주세요.';
    target.textContent=`${base}${marker}선물 형태는 ${style}, 전달 방식은 ${delivery}입니다. ${seasonal} ${petText}`.trim();
  }

  function renderSafety(){const value=document.getElementById('petSafety')?.value;const target=document.getElementById('petSafetyNote');if(!target)return;target.classList.toggle('danger',value==='cat');if(value==='cat')target.textContent='고양이가 있는 집: 백합속(Lilium)과 원추리속(Hemerocallis)은 꽃가루와 꽃병 물까지 위험할 수 있어 완전히 제외하도록 꽃집에 반드시 알려주세요.';else if(value==='dog')target.textContent='강아지가 있는 집: 꽃과 잎을 씹을 수 있으므로 동물 안전성을 꽃집에 확인하고, 전달 후 손이 닿지 않는 곳에 두도록 안내하세요.';else if(value==='other')target.textContent='기타 반려동물이 있는 집: 동물 종류를 꽃집에 정확히 알려 안전성을 확인한 뒤 구성하세요.';else target.textContent='받는 사람의 향 민감도와 반려동물 여부를 확인하면 더 안전한 선물이 됩니다.';}

  function currentRecipe(){return bouquets[document.getElementById('bouquetOccasion')?.value]||bouquets.thanks;}
  function renderMessage(){const messages=currentRecipe()?.messages||['당신에게 전하고 싶은 마음을 꽃에 담았습니다.'];document.getElementById('cardMessage').textContent=messages[selectedMessage]||messages[0];}
  function refreshBuilderPlus(){enhanceOrderText();renderSafety();renderMessage();}

  function insertPlans(){const personal=document.getElementById('personal-dates');if(!personal||document.getElementById('saved-plans'))return;personal.insertAdjacentHTML('beforebegin',`<section class="gift-section" id="saved-plans"><div class="gift-section-head"><div><span class="eyebrow">Saved Plans</span><h2>저장한 꽃 선물 플랜</h2></div><p>주문 문구와 카드 메시지, 전달일을 저장해 꽃집에 갈 때 바로 꺼내보세요.</p></div><div class="plan-list" id="planList"></div></section>`);renderPlans();}

  function buildPlan(){const recipe=currentRecipe();return {id:`${Date.now()}`,title:clean(document.getElementById('customEventName').value)||recipe.title,date:document.getElementById('giftDate').value,profileId:document.getElementById('builderProfile').value,occasion:document.getElementById('bouquetOccasion').value,recipient:document.getElementById('bouquetRecipient').value,budget:document.getElementById('bouquetBudget').value,color:document.getElementById('bouquetColor').value,style:document.getElementById('giftStyle').value,delivery:document.getElementById('deliveryMethod').value,pet:document.getElementById('petSafety').value,flowers:recipe.flowers,order:document.getElementById('orderText').textContent,message:document.getElementById('cardMessage').textContent,completed:false,createdAt:new Date().toISOString()};}
  function savePlan(){const list=readJSON(PLAN_KEY);list.unshift(buildPlan());writeJSON(PLAN_KEY,list.slice(0,30));renderPlans();renderDashboard();window.EmoSeedApp?.toast?.('꽃 선물 플랜을 저장했어요.');}
  function planText(plan){return `${plan.title}\n전달일: ${plan.date||'미정'}\n추천 꽃: ${(plan.flowers||[]).join(', ')}\n주문 문구: ${plan.order}\n카드 문구: ${plan.message}`;}
  function sharePlan(){const plan=buildPlan();window.EmoSeedApp?.share?.({title:`${plan.title} | EmoSeed 꽃 선물`,text:planText(plan),url:location.href});}

  function renderPlans(){const target=document.getElementById('planList');if(!target)return;const list=readJSON(PLAN_KEY);target.innerHTML=list.length?list.map(plan=>`<article class="plan-card"><span class="status-pill ${plan.completed?'':'urgent'}">${plan.completed?'✓ 준비 완료':'준비 중'}</span><h3>${escapeHTML(plan.title)}</h3><p>${plan.date?escapeHTML(plan.date):'전달일 미정'} · ${budgetLabel(plan.budget)} · ${styleLabel(plan.style)}</p><p>🌸 ${(plan.flowers||[]).map(escapeHTML).join(' · ')}</p><div class="plan-summary">${escapeHTML(plan.message||'')}</div><div class="plan-actions"><button class="small-action" data-copy-plan="${plan.id}" type="button">내용 복사</button><button class="small-action" data-calendar-plan="${plan.id}" type="button">알림 추가</button><button class="small-action" data-complete-plan="${plan.id}" type="button">${plan.completed?'다시 준비 중':'준비 완료'}</button><button class="delete-date" data-delete-plan="${plan.id}" type="button">삭제</button></div></article>`).join(''):'<div class="empty-personal">아직 저장한 선물 플랜이 없어요. 추천 결과에서 ‘선물 플랜 저장’을 눌러보세요.</div>';
    target.querySelectorAll('[data-copy-plan]').forEach(btn=>btn.addEventListener('click',()=>{const p=list.find(x=>x.id===btn.dataset.copyPlan);window.EmoSeedApp?.copyText?.(planText(p),'선물 플랜을 복사했어요.');}));
    target.querySelectorAll('[data-calendar-plan]').forEach(btn=>btn.addEventListener('click',()=>{const p=list.find(x=>x.id===btn.dataset.calendarPlan);downloadPlanICS(p);}));
    target.querySelectorAll('[data-complete-plan]').forEach(btn=>btn.addEventListener('click',()=>{const updated=list.map(p=>p.id===btn.dataset.completePlan?{...p,completed:!p.completed}:p);writeJSON(PLAN_KEY,updated);renderPlans();}));
    target.querySelectorAll('[data-delete-plan]').forEach(btn=>btn.addEventListener('click',()=>{writeJSON(PLAN_KEY,list.filter(p=>p.id!==btn.dataset.deletePlan));renderPlans();renderDashboard();}));
  }

  function icsEscape(value=''){return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
  function downloadICS({id,title,date,description,yearly=false,alarms=[7,1]}){if(!date)return window.EmoSeedApp?.toast?.('날짜를 먼저 선택해주세요.');const d=new Date(date);const start=`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;const endDate=new Date(d);endDate.setDate(d.getDate()+1);const end=`${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}`;const alarmLines=alarms.flatMap(day=>['BEGIN:VALARM',`TRIGGER:-P${day}D`,'ACTION:DISPLAY',`DESCRIPTION:${icsEscape(title)} 준비 알림`,'END:VALARM']);const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EmoSeed//Gift Planner//KO','BEGIN:VEVENT',`UID:${id}-${start}@emoseed.lavalabs.co.kr`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${icsEscape(title)}`,`DESCRIPTION:${icsEscape(description)}`,yearly?'RRULE:FREQ=YEARLY':'',...alarmLines,'END:VEVENT','END:VCALENDAR'].filter(Boolean);const blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`EmoSeed_${title}.ics`;link.click();URL.revokeObjectURL(link.href);window.EmoSeedApp?.toast?.('7일 전·1일 전 알림 파일을 저장했어요.');}
  function downloadReminderICS(event){if(!event)return;downloadICS({id:event.id,title:`${event.title} 꽃 선물 준비`,date:event.date,description:`추천 꽃: ${(event.flowers||[]).join(', ')}\n권장 주문일: ${formatDate(deadlineFor(event),true)}`,yearly:event.type!=='personal'});}
  function downloadPlanICS(plan){if(!plan?.date)return window.EmoSeedApp?.toast?.('이 플랜에는 전달일이 없어요.');downloadICS({id:plan.id,title:`${plan.title} 꽃 선물`,date:new Date(`${plan.date}T00:00:00`),description:planText(plan),yearly:false});}

  function initialize(){insertDashboard();insertCalendarTools();insertProfiles();augmentBuilder();insertPlans();renderDashboard();setTimeout(()=>{applyCalendarView();refreshBuilderPlus();},100);window.addEventListener('storage',()=>{renderDashboard();renderProfiles();renderPlans();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
