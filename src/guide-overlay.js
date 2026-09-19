(function (root) {
  const game = root.JQGame;
  const overlay = document.getElementById('guide-overlay');
  const app = document.getElementById('app');
  const title = document.getElementById('guide-title');
  const loading = document.getElementById('guide-loading');
  const closeButton = document.getElementById('guide-close');
  const retry = document.getElementById('guide-retry');
  const progress = document.getElementById('guide-progress');
  const percent = document.getElementById('guide-percent');
  const status = document.getElementById('guide-status');
  const loaded = new Set();
  let previousFocus, previousInert = false, loadingPromise;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function resources() {
    return [...new Set([
      ...Array.from(overlay.querySelectorAll('img'), img => img.getAttribute('src')),
      'assets/card-back.jpg',
      ...game.buildDeckDefinition().map(card => card.asset),
      ...Object.values(game.TREASURES).map(treasure => treasure.asset)
    ])];
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => finish(false), 20000);
      function finish(ok) {
        clearTimeout(timer); image.onload = image.onerror = null;
        ok ? resolve() : reject(new Error(url));
      }
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.src = url;
    });
  }

  function open(mode = 'manual') {
    if (!overlay.hidden && overlay.dataset.mode === 'manual') return;
    previousFocus = document.activeElement;
    previousInert = app.inert;
    app.inert = true;
    overlay.dataset.mode = mode;
    overlay.hidden = false;
    overlay.classList.remove('is-leaving');
    document.documentElement.classList.add('guide-open');
    title.textContent = mode === 'loading' ? '游戏资源加载中' : '游戏说明';
    loading.hidden = mode !== 'loading';
    closeButton.hidden = mode === 'loading';
    overlay.querySelector('.guide-pages').scrollTop = 0;
    title.focus();
  }

  function close() {
    if (overlay.dataset.mode !== 'manual') return;
    overlay.hidden = true;
    document.documentElement.classList.remove('guide-open');
    app.inert = previousInert;
    previousFocus?.focus();
  }

  async function load() {
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      open('loading');
      const urls = resources();
      const update = () => {
        const value = Math.floor(loaded.size / urls.length * 100);
        progress.value = value; percent.textContent = value + '%';
      };
      while (loaded.size < urls.length) {
        status.textContent = '请稍候，资源加载完成后将自动进入游戏';
        retry.hidden = true;
        const queue = urls.filter(url => !loaded.has(url));
        await Promise.all(Array.from({length: 4}, async () => {
          while (queue.length) {
            const url = queue.shift();
            try {
              await loadImage(url);
              for (const img of overlay.querySelectorAll('img')) {
                if (img.getAttribute('src') === url && !img.naturalWidth) img.src = url;
              }
              loaded.add(url); update();
            } catch { /* Retry failed resources below. */ }
          }
        }));
        if (loaded.size < urls.length) {
          status.textContent = `还有 ${urls.length - loaded.size} 项图片未加载，请检查网络后重试。`;
          retry.hidden = false;
          await new Promise(resolve => { retry.onclick = () => { retry.onclick = null; resolve(); }; });
        }
      }
      status.textContent = '资源加载完成，即将进入游戏';
      await delay(750);
      overlay.classList.add('is-leaving');
      await delay(200);
      overlay.hidden = true;
      app.inert = false;
      document.documentElement.classList.remove('guide-open', 'guide-booting');
    })();
    return loadingPromise;
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'Tab') {
      const controls = [closeButton, retry, overlay.querySelector('.guide-pages')].filter(el => !el.hidden);
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  });
  game.GuideOverlay = {open, close, load, resources};
})(globalThis);
