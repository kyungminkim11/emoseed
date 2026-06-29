(() => {
  const events = window.EMOSEED_GIFT_EVENTS || [];
  const bouquets = window.EMOSEED_BOUQUETS || {};
  const typeLabels = { official:'법정 기념일', global:'국제 기념일', popular:'대중문화 기념일', seasonal:'추천 시기', personal:'개인 기념일' };
  const colors = { pastel:'파스텔 핑크·화이트', warm:'노랑·주황 계열', white:'화이트·그린', purple:'보라·블루 계열', vivid:'선명한 컬러 믹스' };
  const budgets = { '20000':'2만원대의 작고 단정한', '30000':'3만원대의 부담 없이 풍성한', '50000':'5만원대의 풍성하고 완성도 높은', '70000':'7만원 이상의 특별하고 볼륨감 있는' };
  const recipients = { lover:'연인에게', parent:'부모님께', teacher:'선생님·멘토께', friend:'친구에게', colleague:'동료·고객에게', self:'나 자신에게' };
  let activeFilter = 'all';

  const pad = (value) => String(value).padStart(2, '0');
  const todayStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const diffDays = (a, b) => Math.round((a - b) / 86400000);
  const formatDate = (date) => new Intl.DateTimeFormat('ko-KR', { month:'long', day:'numeric', weekday:'short' }).format(date);
  const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;

  function nthWeekday(year, monthIndex, weekday, nth) {
    const first = new Date(year, monthIndex, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(year, monthIndex, 1 + offset + (nth - 1) * 7);
  }

  function eventDate(event, year) {
    if (event.rule === 'second-sunday-may') return nthWeekday(year, 4, 0, 2);
    if (event.rule === 'third-monday-may') return nthWeekday(year, 4, 1, 3);
    if (event.rule === 'third-sunday-june') return nthWeekday(year, 5, 0, 3);
    return new Date(year, event.month - 1, event.day);
  }

  function nextOccurrence(event, from = todayStart()) {
    let date = eventDate(event, from.getFullYear());
    if (date < from) date = eventDate(event, from.getFullYear() + 1);
    return date;
  }

  function getPersonalDates() {
    try { return JSON.parse(localStorage.getItem('emoseed-personal-gift-dates') || '[]'); }
    catch (_) { return []; }
  }

  function savePersonalDates(list) {
    localStorage.setItem('emoseed-personal-gift-dates', JSON.stringify(list));
  }

  function personalNext(item, from = todayStart()) {
    const original = new Date(`${item.date}T00:00:00`);
    if (!item.repeat) return original;
    let date = new Date(from.getFullYear(), original.getMonth(), original.getDate());
    if (date < from) date = new Date(from.getFullYear() + 1, original.getMonth(), original.getDate());
    return date;
  }

  function combinedEvents() {
    const builtIn = events.map(event => ({ ...event, date: nextOccurrence(event) }));
    const personal = getPersonalDates().map(item => ({
      ...item,
      id: `personal-${item.id}`,
      type:'personal',
      title:item.title,
      recipient:item.recipient || '소중한 사람',
      meaning:item.note || '직접 저장한 소중한 날',
      flowers:['상황에 맞춘 꽃다발'],
      message:item.message || '오늘을 함께 기념할 수 있어 기뻐요.',
      date:personalNext(item)
    })).filter(item => item.date >= todayStart());
    return [...builtIn, ...personal].sort((a,b) => a.date - b.date);
  }

  function dday(date) {
    const days = diffDays(date, todayStart());
    if (days === 0) return '오늘';
    return `D-${days}`;
  }

  function occasionCard(event) {
    const flowers = (event.flowers || []).slice(0,3).join(' · ');
    return `<article class="occasion-card">
      <div class="occasion-top"><span class="occasion-date">${formatDate(event.date)}</span><span class="d-day">${dday(event.date)}</span></div>
      <div><span class="type-badge">${typeLabels[event.type] || '기념일'}</span></div>
      <h3>${event.title}</h3>
      <p>${event.meaning}</p>
      <div class="occasion-meta"><span class="occasion-tag">🎁 ${event.recipient}</span><span class="occasion-tag">🌸 ${flowers}</span></div>
      <div class="occasion-actions"><button class="small-action" type="button" data-use-event="${event.id}">꽃다발 추천</button><button class="small-action" type="button" data-calendar-event="${event.id}">캘린더 추가</button></div>
    </article>`;
  }

  function renderUpcoming() {
    const list = combinedEvents().slice(0,6);
    document.getElementById('upcomingGrid').innerHTML = list.map(occasionCard).join('');
    const next = list[0];
    if (next) {
      document.getElementById('nextCountdown').textContent = dday(next.date);
      document.getElementById('nextTitle').textContent = next.title;
      document.getElementById('nextDate').textContent = `${formatDate(next.date)} · ${next.meaning}`;
      document.getElementById('nextFlowers').textContent = `추천: ${(next.flowers || []).join(' · ')}`;
    }
    bindEventButtons();
  }

  function renderCalendar() {
    const list = combinedEvents().filter(item => activeFilter === 'all' || item.type === activeFilter);
    const target = document.getElementById('calendarList');
    target.innerHTML = list.map(event => `<article class="calendar-row">
      <div class="date">${formatDate(event.date)}<br><small>${dday(event.date)}</small></div>
      <div><h3>${event.title}</h3><span class="type-badge">${typeLabels[event.type] || '기념일'}</span></div>
      <p>${event.meaning}<br>추천 꽃: ${(event.flowers || []).join(' · ')}</p>
      <div class="occasion-actions"><button class="small-action" type="button" data-use-event="${event.id}">추천</button><button class="small-action" type="button" data-calendar-event="${event.id}">저장</button></div>
    </article>`).join('') || '<div class="empty-personal">표시할 기념일이 없어요.</div>';
    bindEventButtons();
  }

  function findEvent(id) { return combinedEvents().find(item => item.id === id); }

  function eventToOccasion(event) {
    if (!event) return 'thanks';
    const map = {
      valentine:'love','white-day':'love','rose-day':'love',christmas:'anniversary','parents-day':'parents',
      'mothers-day':'parents','teachers-day':'thanks','world-teachers-day':'thanks','friendship-day':'friendship',
      graduation:'graduation','coming-of-age':'graduation','new-year':'graduation','arbor-day':'self',
      'older-persons-day':'parents','family-day':'thanks','womens-day':'thanks','year-end':'thanks'
    };
    return map[event.id] || (event.type === 'personal' ? 'anniversary' : 'thanks');
  }

  function bindEventButtons() {
    document.querySelectorAll('[data-use-event]').forEach(button => {
      button.onclick = () => {
        const event = findEvent(button.dataset.useEvent);
        const occasion = eventToOccasion(event);
        document.getElementById('bouquetOccasion').value = occasion;
        document.getElementById('customEventName').value = event?.title || '';
        renderBouquet();
        document.getElementById('bouquet-builder').scrollIntoView({ behavior:'smooth' });
      };
    });
    document.querySelectorAll('[data-calendar-event]').forEach(button => {
      button.onclick = () => downloadICS(findEvent(button.dataset.calendarEvent));
    });
  }

  function renderBouquet() {
    const occasion = document.getElementById('bouquetOccasion').value;
    const recipient = document.getElementById('bouquetRecipient').value;
    const budget = document.getElementById('bouquetBudget').value;
    const color = document.getElementById('bouquetColor').value;
    const fragrance = document.getElementById('bouquetFragrance').checked;
    const eventName = document.getElementById('customEventName').value.trim();
    const recipe = bouquets[occasion] || bouquets.thanks;
    const fragranceText = fragrance ? '향이 강한 꽃은 제외하고' : '자연스러운 향은 괜찮고';
    const order = `${budgets[budget]} 꽃다발로 부탁드립니다. ${recipients[recipient]} ${eventName ? `${eventName} 선물로 드릴 예정이고, ` : ''}${colors[color]} 분위기에 ${recipe.flowers.join('·')} 중 당일 상태가 좋은 꽃을 중심으로 구성해주세요. ${fragranceText}, 포장도 꽃 색과 어울리게 부탁드려요.`;
    document.getElementById('bouquetTitle').textContent = recipe.title;
    document.getElementById('bouquetMeaning').textContent = recipe.meaning;
    document.getElementById('bouquetFlowers').innerHTML = recipe.flowers.map(name => `<span class="flower-pill">🌸 ${name}</span>`).join('');
    document.getElementById('orderText').textContent = order;
  }

  function escapeICS(value='') { return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }

  function downloadICS(event) {
    if (!event) return;
    const date = event.date || nextOccurrence(event);
    const start = `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}`;
    const endDate = new Date(date); endDate.setDate(date.getDate()+1);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}`;
    const description = `${event.meaning}\n추천 꽃: ${(event.flowers || []).join(', ')}\n메시지: ${event.message || ''}`;
    const recurring = event.type !== 'personal' || getPersonalDates().find(item => `personal-${item.id}` === event.id)?.repeat;
    const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//EmoSeed//Flower Gift Calendar//KO','BEGIN:VEVENT',`UID:${event.id}-${start}@emoseed.lavalabs.co.kr`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${escapeICS(event.title)} 꽃 선물 준비`,`DESCRIPTION:${escapeICS(description)}`,recurring?'RRULE:FREQ=YEARLY':'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
    const blob = new Blob([content], { type:'text/calendar;charset=utf-8' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `EmoSeed_${event.title}.ics`; link.click(); URL.revokeObjectURL(link.href);
    window.EmoSeedApp?.toast?.('캘린더 파일을 저장했어요.');
  }

  function renderPersonal() {
    const list = getPersonalDates().sort((a,b) => personalNext(a) - personalNext(b));
    const target = document.getElementById('personalList');
    target.innerHTML = list.length ? list.map(item => {
      const date = personalNext(item);
      return `<article class="personal-item"><div><h3>${item.title}</h3><p>${formatDate(date)} · ${dday(date)} · ${item.recipient || '소중한 사람'}${item.repeat ? ' · 매년 반복' : ''}</p></div><button class="delete-date" type="button" data-delete-personal="${item.id}">삭제</button></article>`;
    }).join('') : '<div class="empty-personal">생일, 첫 만남, 결혼기념일처럼 잊고 싶지 않은 날을 저장해보세요.</div>';
    document.querySelectorAll('[data-delete-personal]').forEach(button => button.onclick = () => {
      savePersonalDates(getPersonalDates().filter(item => item.id !== button.dataset.deletePersonal));
      renderPersonal(); renderUpcoming(); renderCalendar();
    });
  }

  function cleanInput(value) { return String(value || '').replace(/[<>]/g, '').trim(); }

  function savePersonal(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const item = {
      id: `${Date.now()}`,
      title:cleanInput(data.get('title')),
      date:String(data.get('date') || ''),
      recipient:cleanInput(data.get('recipient')),
      note:cleanInput(data.get('note')),
      message:cleanInput(data.get('message')),
      repeat:data.get('repeat') === 'on'
    };
    if (!item.title || !item.date) return;
    const list = getPersonalDates(); list.push(item); savePersonalDates(list);
    form.reset(); document.getElementById('personalRepeat').checked = true;
    renderPersonal(); renderUpcoming(); renderCalendar();
    window.EmoSeedApp?.toast?.('소중한 날을 저장했어요.');
  }

  function initialize() {
    document.querySelectorAll('[data-calendar-filter]').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.calendarFilter;
      document.querySelectorAll('[data-calendar-filter]').forEach(item => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
      renderCalendar();
    }));
    ['bouquetOccasion','bouquetRecipient','bouquetBudget','bouquetColor','bouquetFragrance','customEventName'].forEach(id => document.getElementById(id)?.addEventListener('change', renderBouquet));
    document.getElementById('customEventName')?.addEventListener('input', renderBouquet);
    document.getElementById('copyOrder')?.addEventListener('click', () => window.EmoSeedApp?.copyText?.(document.getElementById('orderText').textContent, '꽃집 주문 문구를 복사했어요.'));
    document.getElementById('findFlowerShop')?.addEventListener('click', () => window.open('https://map.naver.com/p/search/%EA%BD%83%EC%A7%91','_blank','noopener'));
    document.getElementById('personalForm')?.addEventListener('submit', savePersonal);
    renderUpcoming(); renderCalendar(); renderBouquet(); renderPersonal();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize); else initialize();
})();
