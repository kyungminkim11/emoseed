(() => {
  if (window.__EMOSEED_MOBILE_APP__) return;
  window.__EMOSEED_MOBILE_APP__ = true;

  const body = document.body;
  if (!body) return;

  const base = body.dataset.base || '';
  const current = body.dataset.page || '';
  const path = (value) => `${base}${value}`;
  const mobileQuery = window.matchMedia('(max-width: 720px)');

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
    test: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c4.5-2.7 7-6 7-10.2A5.8 5.8 0 0 0 13.2 5c-.4 0-.8 0-1.2.1A5.8 5.8 0 0 0 5 10.8C5 15 7.5 18.3 12 21Z"/><path d="M12 5.2c-.2-1.7.5-3 2.2-4"/><path d="M12 8.5c-1.5.2-2.5 1.1-3 2.7"/></svg>',
    today: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3M17 3v3"/><rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17"/><path d="m9 15 2 2 4-4"/></svg>',
    flowers: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2.2"/><path d="M12 9.8c-2-1.3-3-3-2.2-4.6.8-1.5 3-1.6 4.2-.1.9 1.2.5 3.1-2 4.7Z"/><path d="M14.2 12c1.3-2 3-3 4.6-2.2 1.5.8 1.6 3 .1 4.2-1.2.9-3.1.5-4.7-2Z"/><path d="M12 14.2c2 1.3 3 3 2.2 4.6-.8 1.5-3 1.6-4.2.1-.9-1.2-.5-3.1 2-4.7Z"/><path d="M9.8 12c-1.3 2-3 3-4.6 2.2-1.5-.8-1.6-3-.1-4.2 1.2-.9 3.1-.5 4.7 2Z"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>'
  };

  const navItems = [
    { key: 'home', label: '홈', href: 'index.html', pages: ['home'] },
    { key: 'test', label: '테스트', href: 'mbti/index.html', pages: ['type'] },
    { key: 'today', label: '오늘', href: 'fortune/index.html', pages: ['fortune'] },
    { key: 'flowers', label: '꽃', href: 'flowers/index.html', pages: ['flowers', 'gifts'] },
    { key: 'more', label: '더보기', pages: ['name', 'match', 'programs', 'contact'] }
  ];

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function renderBottomNav() {
    if (document.querySelector('.app-bottom-nav')) return;

    const nav = document.createElement('nav');
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', '앱 주요 메뉴');

    nav.innerHTML = navItems.map((item) => {
      const active = item.pages.includes(current);
      if (item.key === 'more') {
        return `<button type="button" data-app-more class="${active ? 'is-current' : ''}" aria-label="전체 메뉴 열기">${icons[item.key]}<span>${item.label}</span></button>`;
      }
      return `<a href="${path(item.href)}"${active ? ' aria-current="page"' : ''}>${icons[item.key]}<span>${item.label}</span></a>`;
    }).join('');

    document.body.appendChild(nav);
    nav.querySelector('[data-app-more]')?.addEventListener('click', () => {
      document.getElementById('menuOpen')?.click();
      if (navigator.vibrate) navigator.vibrate(8);
    });
  }

  function greetingForHour(hour) {
    if (hour < 6) return '조용한 밤이에요';
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '오늘도 잘 지내고 있나요?';
    return '오늘 하루는 어땠나요?';
  }

  function renderMobileIntro() {
    if (current !== 'home' || document.querySelector('.mobile-app-intro')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const now = new Date();
    const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(now);
    const intro = document.createElement('section');
    intro.className = 'mobile-app-intro';
    intro.setAttribute('aria-label', '오늘의 정원');
    intro.innerHTML = `
      <div>
        <p>${now.getMonth() + 1}월 ${now.getDate()}일 ${weekday}</p>
        <h1>${greetingForHour(now.getHours())}</h1>
      </div>
      <span class="mobile-app-status">정원 운영 중</span>`;
    hero.before(intro);
  }

  let deferredInstallPrompt = null;

  function installDismissed() {
    try {
      return localStorage.getItem('emoseed-install-dismissed') === '1';
    } catch (_) {
      return false;
    }
  }

  function dismissInstallPrompt(prompt) {
    prompt?.remove();
    try { localStorage.setItem('emoseed-install-dismissed', '1'); } catch (_) {}
  }

  function renderInstallPrompt() {
    if (!deferredInstallPrompt || isStandalone() || installDismissed() || document.querySelector('.app-install-prompt')) return;
    const target = document.querySelector('.hero') || document.querySelector('.page-hero') || document.querySelector('main');
    if (!target) return;

    const prompt = document.createElement('aside');
    prompt.className = 'app-install-prompt';
    prompt.setAttribute('aria-label', '홈 화면 설치 안내');
    prompt.innerHTML = `
      <span class="app-install-icon" aria-hidden="true">🌱</span>
      <span class="app-install-copy"><strong>EmoSeed를 앱처럼 사용하기</strong><span>홈 화면에 추가하면 더 빠르게 열 수 있어요.</span></span>
      <span class="app-install-actions">
        <button type="button" data-install-app>추가</button>
        <button type="button" class="app-install-dismiss" data-dismiss-install aria-label="설치 안내 닫기">×</button>
      </span>`;
    target.after(prompt);

    prompt.querySelector('[data-install-app]')?.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice.catch(() => null);
      deferredInstallPrompt = null;
      prompt.remove();
    });

    prompt.querySelector('[data-dismiss-install]')?.addEventListener('click', () => dismissInstallPrompt(prompt));
  }

  function syncThemeColor() {
    const style = getComputedStyle(document.documentElement);
    const color = (style.getPropertyValue('--bg') || '#f6fbf6').trim();
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }

  function bindPressFeedback() {
    const selector = 'a, button, .choice-card, .feature-card, .plant-card, .related-card';
    document.addEventListener('pointerdown', (event) => {
      if (!mobileQuery.matches) return;
      const target = event.target.closest(selector);
      if (!target || target.closest('.drawer-backdrop')) return;
      target.classList.add('is-pressed');
    }, { passive: true });

    const clear = () => document.querySelectorAll('.is-pressed').forEach((element) => element.classList.remove('is-pressed'));
    document.addEventListener('pointerup', clear, { passive: true });
    document.addEventListener('pointercancel', clear, { passive: true });
    document.addEventListener('scroll', clear, { passive: true });
  }

  function bindKeyboardVisibility() {
    if (!window.visualViewport) return;
    const initialHeight = window.visualViewport.height;
    const update = () => {
      const keyboardOpen = window.visualViewport.height < initialHeight * 0.72;
      document.body.classList.toggle('keyboard-open', keyboardOpen);
    };
    window.visualViewport.addEventListener('resize', update, { passive: true });
  }

  function enhanceDrawerForBottomNav() {
    const more = document.querySelector('[data-app-more]');
    const drawer = document.getElementById('mobileDrawer');
    if (!more || !drawer) return;

    const observer = new MutationObserver(() => {
      const open = drawer.classList.contains('open');
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    observer.observe(drawer, { attributes: true, attributeFilter: ['class'] });
  }

  function initialize() {
    document.documentElement.classList.toggle('is-standalone', isStandalone());
    renderMobileIntro();
    renderBottomNav();
    bindPressFeedback();
    bindKeyboardVisibility();
    enhanceDrawerForBottomNav();
    syncThemeColor();

    const themeObserver = new MutationObserver(syncThemeColor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    mobileQuery.addEventListener?.('change', () => {
      renderBottomNav();
      renderMobileIntro();
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    renderInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.querySelector('.app-install-prompt')?.remove();
    document.documentElement.classList.add('is-standalone');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
