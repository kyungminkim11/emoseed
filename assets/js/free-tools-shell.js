(() => {
  if (window.__EMOSEED_FREE_TOOLS_SHELL__) return;
  window.__EMOSEED_FREE_TOOLS_SHELL__ = true;
  const body = document.body;
  const base = body?.dataset.base || '';
  const current = body?.dataset.page || '';
  const path = (value) => `${base}${value}`;
  function createLink(className, label, mobile = false) {
    const link = document.createElement('a');
    link.className = className || '';
    link.href = path('tools/index.html');
    if (mobile) link.innerHTML = '<span>🧰 무료 감정·꽃 도구</span><span>›</span>';
    else link.textContent = label;
    if (current === 'tools') link.setAttribute('aria-current', 'page');
    return link;
  }
  function enhanceNavigation() {
    const desktop = document.querySelector('.desktop-nav');
    if (desktop && !desktop.querySelector('a[href$="tools/index.html"]')) {
      const link = createLink('', '무료 도구');
      const programs = [...desktop.querySelectorAll('a')].find((item) => item.textContent.trim() === '프로그램');
      desktop.insertBefore(link, programs || null);
    }
    const drawer = document.querySelector('.drawer-nav');
    if (drawer && !drawer.querySelector('a[href$="tools/index.html"]')) {
      const link = createLink('', '', true);
      const programs = [...drawer.querySelectorAll('a')].find((item) => item.textContent.includes('프로그램'));
      drawer.insertBefore(link, programs || null);
    }
    const footer = document.querySelector('.footer-links');
    if (footer && !footer.querySelector('a[href$="tools/index.html"]')) {
      const link = createLink('', '무료 도구');
      footer.insertBefore(link, footer.firstChild);
    }
    if (current === 'tools') document.querySelector('[data-app-more]')?.classList.add('is-current');
  }
  function injectHomeSection() {
    if (current !== 'home' || document.getElementById('freeToolsPreview')) return;
    const programs = document.getElementById('programs');
    if (!programs) return;
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'freeToolsPreview';
    section.innerHTML = `
      <div class="section-heading">
        <div><span class="eyebrow">Free Tools</span><h2>필요한 순간 바로 쓰는<br>무료 감정·꽃 도구</h2></div>
        <p>감정 기록부터 꽃 선물, 카드 문구, 반려동물 안전 확인과 꽃 관리까지 회원가입 없이 이용할 수 있습니다.</p>
      </div>
      <div class="feature-grid">
        <a class="feature-card" href="${path('tools/index.html#mood')}"><div><div class="feature-icon">😊</div><h3>오늘의 감정 체크인</h3><p>지금의 감정을 고르면 오늘의 식물과 작은 행동을 추천하고 최근 7일 기록을 남겨요.</p></div><div class="feature-meta"><span>브라우저에만 저장</span><span>감정 기록하기 →</span></div></a>
        <a class="feature-card" href="${path('tools/index.html#gift')}"><div><div class="feature-icon">💐</div><h3>무료 꽃 선물 추천</h3><p>대상·상황·예산·색상·반려동물 여부를 반영해 꽃 구성과 주문 문구를 만듭니다.</p></div><div class="feature-meta"><span>꽃집 전달 문구 포함</span><span>추천받기 →</span></div></a>
        <a class="feature-card" href="${path('tools/index.html#message')}"><div><div class="feature-icon">💌</div><h3>카드 메시지 생성기</h3><p>생일, 기념일, 감사, 사과, 응원 등 상황과 말투에 맞는 카드 문구를 제안해요.</p></div><div class="feature-meta"><span>문구 3개 즉시 생성</span><span>메시지 만들기 →</span></div></a>
        <a class="feature-card" href="${path('tools/index.html#pet')}"><div><div class="feature-icon">🐾</div><h3>반려동물 안전 꽃</h3><p>고양이와 강아지가 있는 집에서 대표적인 꽃의 주의 수준과 대체 꽃을 확인하세요.</p></div><div class="feature-meta"><span>안전·주의·위험 구분</span><span>확인하기 →</span></div></a>
        <a class="feature-card" href="${path('tools/index.html#care')}"><div><div class="feature-icon">🚿</div><h3>꽃 관리 도우미</h3><p>물 교체, 줄기 정리, 보관 장소와 예상 감상 기간을 확인하고 관리 기록을 남겨요.</p></div><div class="feature-meta"><span>물 갈기 기록 저장</span><span>관리 시작 →</span></div></a>
        <a class="feature-card" href="${path('tools/index.html')}"><div><div class="feature-icon">🧰</div><h3>무료 도구 10가지</h3><p>꽃말 역검색, 색상 추천, 탄생화, 꽃다발 조합까지 모든 무료 기능을 한 번에 이용하세요.</p></div><div class="feature-meta"><span>회원가입 없이 무료</span><span>전체 보기 →</span></div></a>
      </div>`;
    programs.after(section);
  }
  function initialize() {
    enhanceNavigation();
    injectHomeSection();
    const observer = new MutationObserver(() => { enhanceNavigation(); injectHomeSection(); });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
