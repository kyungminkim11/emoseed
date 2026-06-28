(() => {
  const flowers = window.EMOSEED_FLOWERS || [];
  const meta = window.EMOSEED_FLOWER_META || { situations: {}, moods: {} };
  const state = { query: '', season: 'all', color: 'all', favorites: loadFavorites() };
  const seasonNames = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
  const colorNames = { red:'빨강', pink:'분홍', white:'흰색', yellow:'노랑', orange:'주황', purple:'보라', blue:'파랑' };

  function loadFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem('emoseed-flower-favorites') || '[]')); }
    catch (_) { return new Set(); }
  }
  function saveFavorites() { try { localStorage.setItem('emoseed-flower-favorites', JSON.stringify([...state.favorites])); } catch (_) {} }
  function normalize(value='') { return String(value).toLowerCase().replace(/\s+/g, ''); }
  function petalPath(shape) {
    if (shape === 'notched') return '<path d="M0,-54 C24,-48 34,-24 28,-4 C18,21 -12,29 -28,4 C-35,-17 -22,-44 0,-54Z"/>';
    if (shape === 'cup') return '<path d="M0,-58 C30,-48 36,-10 22,18 C8,38 -10,38 -24,17 C-37,-10 -29,-48 0,-58Z"/>';
    if (shape === 'frill') return '<path d="M0,-58 C10,-52 15,-47 20,-38 C32,-36 38,-27 35,-16 C44,-6 40,8 30,14 C31,28 18,38 7,35 C-3,46 -18,41 -22,30 C-36,27 -41,13 -33,3 C-41,-8 -34,-22 -23,-25 C-23,-40 -12,-53 0,-58Z"/>';
    if (shape === 'trumpet') return '<path d="M0,-60 C30,-46 36,-16 23,7 C13,22 6,31 0,45 C-7,31 -14,22 -24,7 C-37,-16 -30,-47 0,-60Z"/>';
    if (shape === 'tiny') return '<ellipse cx="0" cy="-32" rx="16" ry="29"/>';
    if (shape === 'cross') return '<ellipse cx="0" cy="-39" rx="25" ry="37"/>';
    if (shape === 'poppy') return '<path d="M0,-57 C35,-57 48,-24 33,7 C18,34 -18,34 -33,7 C-49,-24 -35,-57 0,-57Z"/>';
    return '<ellipse cx="0" cy="-43" rx="29" ry="44"/>';
  }
  function flowerArt(flower, size='card') {
    const petals = Math.max(4, flower.petals || 8);
    const [main, light, center] = flower.palette;
    const radius = flower.shape === 'cluster' ? 39 : flower.shape === 'spike' ? 28 : 45;
    const petal = petalPath(flower.shape);
    const petalSvg = Array.from({ length: petals }, (_, i) => {
      const a = (360 / petals) * i;
      const scale = flower.shape === 'cluster' ? .52 : flower.shape === 'spike' ? .48 : flower.shape === 'lotus' ? .8 + (i%2)*.15 : 1;
      const y = flower.shape === 'spike' ? -20 - (i%5)*18 : -radius;
      const x = flower.shape === 'cluster' ? Math.cos(i*1.9)*32 : 0;
      return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${scale})" fill="${i%3===0?light:main}" opacity="${.86+(i%2)*.1}">${petal}</g>`;
    }).join('');
    const smalls = flower.shape === 'cluster' ? Array.from({length:9},(_,i)=>{const a=i*40;const x=95+Math.cos(a*Math.PI/180)*42;const y=90+Math.sin(a*Math.PI/180)*34;return `<circle cx="${x}" cy="${y}" r="16" fill="${i%2?main:light}"/><circle cx="${x}" cy="${y}" r="5" fill="${center}"/>`;}).join('') : '';
    return `<svg viewBox="0 0 220 250" role="img" aria-label="${flower.name} EmoSeed 일러스트" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="shadow-${flower.id}" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#315f47" flood-opacity=".16"/></filter></defs>
      <path d="M108 112 C105 156 108 191 103 232" stroke="#4f8a63" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M104 176 C77 157 57 169 49 190 C71 193 90 188 104 176Z" fill="#7eae85"/>
      <path d="M106 198 C133 176 153 187 160 207 C139 211 119 207 106 198Z" fill="#5e976d"/>
      ${flower.shape==='cluster' ? `<g filter="url(#shadow-${flower.id})">${smalls}</g>` : `<g transform="translate(110 102)" filter="url(#shadow-${flower.id})">${petalSvg}<circle cx="0" cy="0" r="${flower.shape==='ray'?29:flower.shape==='tiny'?10:22}" fill="${center}"/><circle cx="-7" cy="-7" r="7" fill="rgba(255,255,255,.25)"/></g>`}
    </svg>`;
  }

  function searchableText(f) { return normalize([f.name,f.english,f.scientific,...f.meanings,f.meaningNote,...f.seasons.map(id=>seasonNames[id]||id),...f.colors.map(id=>colorNames[id]||id),...f.situations.map(id=>meta.situations[id]?.[0]||''),...f.moods.map(id=>meta.moods[id]?.[0]||'')].join(' ')); }
  function filteredFlowers() {
    const q = normalize(state.query);
    return flowers.filter(f => (!q || searchableText(f).includes(q)) && (state.season==='all'||f.seasons.includes(state.season)) && (state.color==='all'||f.colors.includes(state.color)));
  }
  function flowerCard(f) {
    return `<article class="flower-card"><button type="button" data-flower-id="${f.id}" aria-label="${f.name} 상세 보기"><div class="flower-art">${flowerArt(f)}</div><div class="flower-body"><div class="flower-title-row"><div><h3>${f.name}</h3><div class="flower-english">${f.english} · <i>${f.scientific}</i></div></div><span aria-hidden="true">${state.favorites.has(f.id)?'♥':'＋'}</span></div><div class="meaning-tags">${f.meanings.map(v=>`<span class="meaning-tag">${v}</span>`).join('')}</div><div class="flower-meta"><span>${f.bloom}</span><span>자세히 보기 →</span></div></div></button></article>`;
  }
  function renderGrid() {
    const list = filteredFlowers();
    document.getElementById('flowerCount').textContent = `${list.length}개의 꽃`;
    const grid = document.getElementById('flowerGrid');
    grid.innerHTML = list.length ? list.map(flowerCard).join('') : '<div class="empty-state"><strong>검색 결과가 없어요.</strong><p>꽃 이름이나 꽃말을 조금 짧게 입력해보세요.</p></div>';
    grid.querySelectorAll('[data-flower-id]').forEach(btn=>btn.addEventListener('click',()=>openFlower(btn.dataset.flowerId,true)));
  }
  function openFlower(id, updateHash=false) {
    const f = flowers.find(x=>x.id===id); if(!f) return;
    const dialog=document.getElementById('flowerDialog');
    document.getElementById('dialogArt').innerHTML=flowerArt(f,'large');
    document.getElementById('dialogName').textContent=f.name;
    document.getElementById('dialogEnglish').textContent=`${f.english} · ${f.scientific}`;
    document.getElementById('dialogMeanings').innerHTML=f.meanings.map(v=>`<span class="meaning-tag">${v}</span>`).join('');
    document.getElementById('dialogMeaningNote').textContent=f.meaningNote;
    document.getElementById('dialogBloom').textContent=f.bloom;
    document.getElementById('dialogSeason').textContent=f.seasons.map(v=>seasonNames[v]).join(' · ');
    document.getElementById('dialogColors').textContent=f.colors.map(v=>colorNames[v]).join(' · ');
    document.getElementById('dialogPhotoTip').textContent=f.photoTip;
    const fav=document.getElementById('favoriteFlower'); fav.dataset.id=f.id; fav.setAttribute('aria-pressed',state.favorites.has(f.id)); fav.textContent=state.favorites.has(f.id)?'♥ 즐겨찾기됨':'♡ 즐겨찾기';
    document.getElementById('shareFlower').onclick=()=>window.EmoSeedApp?.share?.({title:`${f.name} 꽃말 | EmoSeed 꽃 도감`,text:`${f.name}의 꽃말: ${f.meanings.join(', ')}`,url:`${location.origin}${location.pathname}#${f.id}`});
    document.getElementById('shopFlower').href=`https://map.naver.com/p/search/${encodeURIComponent(f.name+' 꽃집')}`;
    if(updateHash) history.replaceState(null,'',`#${f.id}`);
    dialog.showModal();
  }
  function closeDialog(){ document.getElementById('flowerDialog').close(); }

  function miniCard(f, reason='') { return `<button type="button" class="mini-flower" data-flower-id="${f.id}">${flowerArt(f)}<span><h4>${f.name}</h4><p><strong>${f.meanings[0]}</strong> · ${reason||f.meaningNote}</p></span></button>`; }
  function recommendBy(kind,id) {
    const list=flowers.filter(f=>f[kind].includes(id)).slice(0,3);
    const target=document.getElementById(kind==='situations'?'situationResult':'moodResult');
    const info=(kind==='situations'?meta.situations:meta.moods)[id];
    target.innerHTML=list.map(f=>miniCard(f,info?.[1])).join('');
    target.querySelectorAll('[data-flower-id]').forEach(btn=>btn.addEventListener('click',()=>openFlower(btn.dataset.flowerId,true)));
    if(kind==='situations') {
      const names=list.map(f=>f.name).join('·');
      const message=`${info?.[0]||'오늘의 순간'}에 ${names}을 추천해요. “${info?.[1]||'마음을 담아 전해보세요'}”라는 마음으로 골라보세요.`;
      document.getElementById('giftMessageText').textContent=message;
    }
  }

  function mapUrl(provider,query,lat,lng){
    if(provider==='google'&&lat!=null)return `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},14z`;
    if(provider==='kakao')return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
    return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
  }
  function findNearby(query){
    const status=document.getElementById('locationStatus'); status.textContent='현재 위치를 확인하고 있어요…';
    if(!navigator.geolocation){ status.textContent='이 브라우저는 위치 기능을 지원하지 않아요. 지도 검색 버튼을 이용해주세요.'; return; }
    navigator.geolocation.getCurrentPosition(pos=>{ status.textContent='현재 위치 근처 검색을 새 창에서 열었어요.'; window.open(mapUrl('google',query,pos.coords.latitude,pos.coords.longitude),'_blank','noopener'); },()=>{ status.textContent='위치 권한을 사용할 수 없어 지도 검색으로 연결할게요.'; window.open(mapUrl('naver',query),'_blank','noopener'); },{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  }

  function injectFlowerNav(){
    const desktop=document.querySelector('.desktop-nav');
    if(desktop&&!desktop.querySelector('[data-flower-nav]')){const a=document.createElement('a');a.href='../flowers/index.html';a.textContent='꽃 도감';a.dataset.flowerNav='';a.setAttribute('aria-current','page');desktop.insertBefore(a,desktop.children[5]||null);}
    const drawer=document.querySelector('.drawer-nav');
    if(drawer&&!drawer.querySelector('[data-flower-nav]')){const a=document.createElement('a');a.href='../flowers/index.html';a.dataset.flowerNav='';a.setAttribute('aria-current','page');a.innerHTML='<span>🌸 꽃 도감·추천</span><span>›</span>';drawer.insertBefore(a,drawer.children[5]||null);}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectFlowerNav();
    const search=document.getElementById('flowerSearch'); search.addEventListener('input',()=>{state.query=search.value;renderGrid();});
    document.getElementById('clearSearch').addEventListener('click',()=>{search.value='';state.query='';state.season='all';state.color='all';document.querySelectorAll('.filter-chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.filterSeason==='all'||b.dataset.filterColor==='all'?'true':'false'));renderGrid();search.focus();});
    document.querySelectorAll('[data-filter-season]').forEach(btn=>btn.addEventListener('click',()=>{state.season=btn.dataset.filterSeason;document.querySelectorAll('[data-filter-season]').forEach(b=>b.setAttribute('aria-pressed',b===btn));renderGrid();}));
    document.querySelectorAll('[data-filter-color]').forEach(btn=>btn.addEventListener('click',()=>{state.color=btn.dataset.filterColor;document.querySelectorAll('[data-filter-color]').forEach(b=>b.setAttribute('aria-pressed',b===btn));renderGrid();}));
    document.querySelectorAll('[data-search-example]').forEach(btn=>btn.addEventListener('click',()=>{search.value=btn.dataset.searchExample;state.query=search.value;renderGrid();document.getElementById('guide').scrollIntoView({behavior:'smooth'});}));
    document.querySelectorAll('[data-situation]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-situation]').forEach(b=>b.setAttribute('aria-pressed',b===btn));recommendBy('situations',btn.dataset.situation);}));
    document.querySelectorAll('[data-mood]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',b===btn));recommendBy('moods',btn.dataset.mood);}));
    document.getElementById('copyGiftMessage').addEventListener('click',()=>window.EmoSeedApp?.copyText?.(document.getElementById('giftMessageText').textContent,'추천 문구를 복사했어요.'));
    document.querySelectorAll('[data-nearby]').forEach(btn=>btn.addEventListener('click',()=>findNearby(btn.dataset.nearby)));
    document.getElementById('dialogClose').addEventListener('click',closeDialog);
    document.getElementById('flowerDialog').addEventListener('click',e=>{if(e.target.id==='flowerDialog')closeDialog();});
    document.getElementById('favoriteFlower').addEventListener('click',e=>{const id=e.currentTarget.dataset.id;if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);saveFavorites();renderGrid();e.currentTarget.setAttribute('aria-pressed',state.favorites.has(id));e.currentTarget.textContent=state.favorites.has(id)?'♥ 즐겨찾기됨':'♡ 즐겨찾기';window.EmoSeedApp?.toast?.(state.favorites.has(id)?'즐겨찾기에 저장했어요.':'즐겨찾기에서 뺐어요.');});
    renderGrid(); recommendBy('situations','thanks'); recommendBy('moods','tired');
    const hash=location.hash.slice(1); if(hash&&flowers.some(f=>f.id===hash))setTimeout(()=>openFlower(hash,false),100);
  });
})();