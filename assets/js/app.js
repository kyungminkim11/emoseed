(() => {
  const body = document.body;
  const base = body?.dataset.base || '';
  const current = body?.dataset.page || '';
  const themes = [
    ['mint', '🌿 민트'],
    ['beige', '☕ 베이지'],
    ['lavender', '💜 연보라'],
    ['pink', '🍑 살구'],
    ['sky', '💧 하늘']
  ];

  const path = (value) => `${base}${value}`;

  function navLink(page, href, label) {
    const active = current === page ? ' aria-current="page"' : '';
    return `<a href="${path(href)}"${active}>${label}</a>`;
  }

  function renderHeader() {
    const target = document.getElementById('site-header');
    if (!target) return;
    target.innerHTML = `
      <a class="skip-link" href="#main-content">본문으로 바로가기</a>
      <header class="site-header" id="stickyHeader">
        <div class="nav-shell">
          <a class="brand" href="${path('index.html')}" aria-label="EmoSeed 홈">
            <span class="brand-mark" aria-hidden="true">🌱</span>
            <span class="brand-text">EmoSeed<small>Digital Garden</small></span>
          </a>
          <nav class="desktop-nav" aria-label="주요 메뉴">
            ${navLink('home', 'index.html', '홈')}
            ${navLink('type', 'mbti/index.html', '나와 닮은 식물')}
            ${navLink('fortune', 'fortune/index.html', '오늘의 운세')}
            ${navLink('name', 'name-generator/index.html', '식물 이름')}
            ${navLink('match', 'compatibility/index.html', '식물 궁합')}
            ${navLink('flowers', 'flowers/index.html', '꽃 도감')}
            ${navLink('programs', 'event.html', '프로그램')}
            ${navLink('contact', 'location.html', '소개·문의')}
          </nav>
          <div class="nav-actions">
            <button class="icon-button" type="button" data-theme-quick aria-label="테마 바꾸기" title="테마 바꾸기">🎨</button>
            <button class="icon-button menu-button" type="button" id="menuOpen" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobileDrawer">☰</button>
          </div>
        </div>
      </header>
      <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
        <div class="drawer-backdrop" data-close-drawer></div>
        <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="모바일 메뉴">
          <div class="drawer-head">
            <a class="brand" href="${path('index.html')}"><span class="brand-mark">🌱</span><span class="brand-text">EmoSeed<small>Digital Garden</small></span></a>
            <button class="icon-button" type="button" data-close-drawer aria-label="메뉴 닫기">✕</button>
          </div>
          <nav class="drawer-nav" aria-label="모바일 주요 메뉴">
            ${navLink('home', 'index.html', '<span>🏠 홈</span><span>›</span>')}
            ${navLink('type', 'mbti/index.html', '<span>🌱 나와 닮은 식물</span><span>›</span>')}
            ${navLink('fortune', 'fortune/index.html', '<span>🔮 오늘의 식물 운세</span><span>›</span>')}
            ${navLink('name', 'name-generator/index.html', '<span>🌼 나만의 식물 이름</span><span>›</span>')}
            ${navLink('match', 'compatibility/index.html', '<span>💘 식물 궁합</span><span>›</span>')}
            ${navLink('flowers', 'flowers/index.html', '<span>🌸 꽃 도감·추천</span><span>›</span>')}
            ${navLink('programs', 'event.html', '<span>🎉 프로그램</span><span>›</span>')}
            ${navLink('contact', 'location.html', '<span>💬 소개·문의</span><span>›</span>')}
          </nav>
          <div class="theme-panel">
            <p>화면 분위기 바꾸기</p>
            <div class="theme-options">
              ${themes.map(([key, label]) => `<button class="theme-chip" type="button" data-theme="${key}">${label}</button>`).join('')}
            </div>
          </div>
        </aside>
      </div>`;
  }

  function renderFooter() {
    const target = document.getElementById('site-footer');
    if (!target) return;
    target.innerHTML = `
      <footer class="site-footer">
        <div class="footer-shell">
          <div class="footer-brand">
            <a class="brand" href="${path('index.html')}"><span class="brand-mark">🌱</span><span class="brand-text">EmoSeed<small>by LAVALABS</small></span></a>
            <p>하루의 감정을 식물처럼 천천히 들여다보는 작은 디지털 정원입니다.</p>
          </div>
          <nav class="footer-links" aria-label="하단 메뉴">
            <a href="${path('flowers/index.html')}">꽃 도감</a>
            <a href="${path('location.html')}">소개·문의</a>
            <a href="${path('privacy.html')}">개인정보 안내</a>
            <a href="https://lavalabs.co.kr" target="_blank" rel="noopener">LAVALABS ↗</a>
          </nav>
          <details class="business-details">
            <summary>사업자 정보 보기</summary>
            <p>상호: 라바랩스 · 대표: 김경민 · 사업자등록번호: 455-23-01867 · 문의: info@lavalabs.co.kr</p>
          </details>
          <div class="footer-copy">© <span data-current-year></span> LAVALABS. All rights reserved.</div>
        </div>
      </footer>`;
  }

  function getTheme() {
    try {
      const saved = localStorage.getItem('emoseed-theme');
      return themes.some(([key]) => key === saved) ? saved : 'mint';
    } catch (_) {
      return document.documentElement.dataset.theme || 'mint';
    }
  }

  function applyTheme(theme, announce = false) {
    const safeTheme = themes.some(([key]) => key === theme) ? theme : 'mint';
    document.documentElement.dataset.theme = safeTheme;
    try { localStorage.setItem('emoseed-theme', safeTheme); } catch (_) {}
    document.querySelectorAll('.theme-chip[data-theme]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.theme === safeTheme ? 'true' : 'false');
    });
    if (announce) {
      const label = themes.find(([key]) => key === safeTheme)?.[1] || '민트';
      toast(`${label} 테마로 바꿨어요.`);
    }
  }

  function cycleTheme() {
    const currentTheme = getTheme();
    const index = themes.findIndex(([key]) => key === currentTheme);
    applyTheme(themes[(index + 1) % themes.length][0], true);
  }

  let previousFocus = null;
  function openDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const button = document.getElementById('menuOpen');
    if (!drawer || !button) return;
    previousFocus = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    drawer.querySelector('[data-close-drawer]')?.focus();
  }

  function closeDrawer() {
    const drawer = document.getElementById('mobileDrawer');
    const button = document.getElementById('menuOpen');
    if (!drawer || !button) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    previousFocus?.focus?.();
  }

  let toastTimer;
  function toast(message) {
    let target = document.getElementById('toast');
    if (!target) {
      target = document.createElement('div');
      target.id = 'toast';
      target.className = 'toast';
      target.setAttribute('role', 'status');
      target.setAttribute('aria-live', 'polite');
      document.body.appendChild(target);
    }
    target.textContent = message;
    target.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove('show'), 2300);
  }

  async function copyText(text, success = '링크를 복사했어요.') {
    try {
      await navigator.clipboard.writeText(text);
      toast(success);
      return true;
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const result = document.execCommand('copy');
      area.remove();
      toast(result ? success : '복사하지 못했어요. 주소창의 링크를 복사해주세요.');
      return result;
    }
  }

  async function share({ title = document.title, text = '', url = location.href } = {}) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (error) {
        if (error?.name === 'AbortError') return false;
      }
    }
    await copyText(url, '공유 링크를 복사했어요.');
    return false;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 5) {
    const chars = [...String(text)];
    const lines = [];
    let line = '';
    for (const char of chars) {
      const test = line + char;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = char;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((value, index) => ctx.fillText(value, x, y + lineHeight * index));
    return y + lineHeight * Math.min(lines.length, maxLines);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function createResultCanvas({
    kicker = 'EMOSEED RESULT',
    title,
    subtitle = '',
    keywords = [],
    message = '',
    quote = '',
    imageSrc = ''
  }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, '#edf8ef');
    gradient.addColorStop(1, '#d7eadc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255,255,255,.94)';
    roundedRect(ctx, 70, 70, 940, 1210, 46);
    ctx.fill();

    ctx.fillStyle = '#2f6f50';
    ctx.font = '800 28px sans-serif';
    ctx.fillText('🌱 EmoSeed', 120, 140);
    ctx.fillStyle = '#728076';
    ctx.font = '700 21px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(kicker, 960, 138);
    ctx.textAlign = 'left';

    if (imageSrc) {
      try {
        const image = await loadImage(imageSrc);
        ctx.save();
        roundedRect(ctx, 120, 195, 840, 455, 34);
        ctx.clip();
        const ratio = Math.max(840 / image.width, 455 / image.height);
        const width = image.width * ratio;
        const height = image.height * ratio;
        ctx.drawImage(image, 120 + (840 - width) / 2, 195 + (455 - height) / 2, width, height);
        ctx.restore();
      } catch (_) {
        ctx.fillStyle = '#d9eadf';
        roundedRect(ctx, 120, 195, 840, 455, 34);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#183c2d';
    ctx.font = '900 58px sans-serif';
    let cursorY = wrapText(ctx, title, 120, 740, 840, 72, 2) + 12;

    if (subtitle) {
      ctx.fillStyle = '#60746a';
      ctx.font = '700 27px sans-serif';
      cursorY = wrapText(ctx, subtitle, 120, cursorY, 840, 40, 2) + 18;
    }

    if (keywords.length) {
      let x = 120;
      const y = cursorY;
      ctx.font = '800 20px sans-serif';
      keywords.slice(0, 4).forEach((keyword) => {
        const width = ctx.measureText(keyword).width + 42;
        ctx.fillStyle = '#e7f2e9';
        roundedRect(ctx, x, y, width, 44, 22);
        ctx.fill();
        ctx.fillStyle = '#245b41';
        ctx.fillText(keyword, x + 21, y + 29);
        x += width + 10;
      });
      cursorY += 74;
    }

    ctx.fillStyle = '#52665b';
    ctx.font = '500 26px sans-serif';
    cursorY = wrapText(ctx, message, 120, cursorY, 840, 42, 4) + 20;

    if (quote) {
      ctx.fillStyle = '#2f6f50';
      ctx.font = '800 27px sans-serif';
      wrapText(ctx, `“${quote}”`, 120, cursorY, 840, 43, 3);
    }

    ctx.fillStyle = '#8a978f';
    ctx.font = '600 18px sans-serif';
    ctx.fillText('emoseed.lavalabs.co.kr', 120, 1230);
    return canvas;
  }

  async function downloadResultImage(options) {
    try {
      toast('결과 이미지를 만들고 있어요…');
      const canvas = await createResultCanvas(options);
      const link = document.createElement('a');
      link.download = options.filename || 'emoseed-result.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast('결과 이미지를 저장했어요.');
    } catch (error) {
      console.error(error);
      toast('이미지를 만들지 못했어요. 화면을 캡처해주세요.');
    }
  }

  async function shareResultImage(options, shareOptions = {}) {
    try {
      toast('공유 이미지를 준비하고 있어요…');
      const canvas = await createResultCanvas(options);
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('blob failed')), 'image/png'));
      const file = new File([blob], options.filename || 'emoseed-result.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareOptions.title || document.title, text: shareOptions.text || '' });
        return true;
      }
      return share(shareOptions);
    } catch (error) {
      if (error?.name === 'AbortError') return false;
      console.error(error);
      return share(shareOptions);
    }
  }

  function track(eventName, detail = {}) {
    window.dispatchEvent(new CustomEvent('emoseed:analytics', { detail: { eventName, ...detail } }));
  }

  function initialize() {
    applyTheme(getTheme());
    renderHeader();
    renderFooter();
    applyTheme(getTheme());

    document.querySelectorAll('[data-current-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    document.getElementById('menuOpen')?.addEventListener('click', openDrawer);
    document.querySelectorAll('[data-close-drawer]').forEach((el) => el.addEventListener('click', closeDrawer));
    document.querySelectorAll('.theme-chip[data-theme]').forEach((button) => button.addEventListener('click', () => applyTheme(button.dataset.theme, true)));
    document.querySelectorAll('[data-theme-quick]').forEach((button) => button.addEventListener('click', cycleTheme));
    document.querySelectorAll('[data-copy-link]').forEach((button) => button.addEventListener('click', () => copyText(button.dataset.copyLink || location.href)));
    document.querySelectorAll('[data-share]').forEach((button) => button.addEventListener('click', () => share({ title: button.dataset.shareTitle || document.title, text: button.dataset.shareText || '', url: button.dataset.shareUrl || location.href })));

    window.addEventListener('scroll', () => {
      document.getElementById('stickyHeader')?.classList.toggle('scrolled', window.scrollY > 6);
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeDrawer();
    });

    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register(path('service-worker.js')).catch(() => {});
    }
  }

  window.EmoSeedApp = { path, toast, copyText, share, downloadResultImage, shareResultImage, track, applyTheme };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
