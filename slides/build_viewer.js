const fs = require('fs');
const path = require('path');

const slidesDir = path.resolve(__dirname);
const slideFiles = [
  'slide-01.html',
  'slide-02.html',
  'slide-03.html',
  'slide-04.html',
  'slide-05.html',
  'slide-06.html',
  'slide-07.html',
  'slide-08.html',
  'slide-09.html'
];

const slides = slideFiles.map(f => {
  return fs.readFileSync(path.join(slidesDir, f), 'utf8');
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const iframes = slides.map((content, idx) => {
  const active = idx === 0 ? ' active' : '';
  const num = idx + 1;
  return `        <iframe class="slide-frame${active}" data-slide="${num}" srcdoc="${escapeHtml(content)}" sandbox="allow-same-origin allow-scripts"></iframe>`;
}).join('\n');

const dots = slides.map((_, i) => {
  return `      <div class="dot${i === 0 ? ' active' : ''}" data-idx="${i + 1}" title="Slide ${i + 1}"></div>`;
}).join('\n');

const viewerHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>안티그래비티 2달간 작업 세션 타임라인 리포트</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #090d16;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #f8fafc;
    }

    .viewer-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Top Navigation bar */
    .nav-bar {
      height: 52px;
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      flex-shrink: 0;
      z-index: 100;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(59, 130, 246, 0.35);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #60a5fa;
    }

    .nav-title {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }

    .nav-center {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-bar button {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 6px 16px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .nav-bar button:hover:not(:disabled) {
      background: #2563eb;
      border-color: #3b82f6;
    }

    .nav-bar button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .slide-counter {
      color: #f8fafc;
      font-size: 14px;
      font-weight: 600;
      min-width: 70px;
      text-align: center;
      font-variant-numeric: tabular-nums;
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn-fs {
      padding: 6px 12px !important;
      font-size: 12px !important;
    }

    /* Slide viewport */
    .viewport {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
      background: #020617;
    }

    /* Scaler for 720pt x 405pt = 960px x 540px */
    .scaler {
      width: 960px;
      height: 540px;
      position: relative;
      transform-origin: center center;
      flex-shrink: 0;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    .slide-frame {
      width: 960px;
      height: 540px;
      border: none;
      position: absolute;
      top: 0;
      left: 0;
      display: none;
      background: #ffffff;
    }

    .slide-frame.active {
      display: block;
    }

    /* Bottom quick navigation dots */
    .bottom-dots {
      height: 38px;
      background: #090d16;
      border-top: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .dot {
      width: 24px;
      height: 5px;
      background: #334155;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dot.active {
      background: #3b82f6;
      width: 44px;
    }
  </style>
</head>
<body>
  <div class="viewer-container">
    <!-- Top Navigation -->
    <div class="nav-bar">
      <div class="nav-left">
        <span class="brand-badge">slides-grab</span>
        <span class="nav-title">안티그래비티 작업 세션 타임라인 리포트</span>
      </div>

      <div class="nav-center">
        <button id="btn-prev" title="Previous (Left Arrow)">← 이전</button>
        <div class="slide-counter" id="counter">1 / ${slides.length}</div>
        <button id="btn-next" title="Next (Right Arrow / Space)">다음 →</button>
      </div>

      <div class="nav-right">
        <button id="btn-fs" class="btn-fs" title="Fullscreen (F)">전체화면 [F]</button>
      </div>
    </div>

    <!-- Viewport Area -->
    <div class="viewport" id="viewport">
      <div class="scaler" id="scaler">
${iframes}
      </div>
    </div>

    <!-- Bottom Indicator -->
    <div class="bottom-dots" id="dots-container">
${dots}
    </div>
  </div>

  <script>
    const TOTAL = ${slides.length};
    let current = 1;

    const frames = document.querySelectorAll('.slide-frame');
    const dots = document.querySelectorAll('.dot');
    const counter = document.getElementById('counter');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const scaler = document.getElementById('scaler');
    const viewport = document.getElementById('viewport');

    function goTo(n) {
      n = Math.max(1, Math.min(TOTAL, n));
      if (n === current) return;
      frames[current - 1].classList.remove('active');
      dots[current - 1].classList.remove('active');
      current = n;
      frames[current - 1].classList.add('active');
      dots[current - 1].classList.add('active');
      counter.textContent = current + ' / ' + TOTAL;
      btnPrev.disabled = (current === 1);
      btnNext.disabled = (current === TOTAL);
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    btnPrev.addEventListener('click', prev);
    btnNext.addEventListener('click', next);
    btnPrev.disabled = true;

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-idx'), 10);
        goTo(idx);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(TOTAL);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    });

    // Fullscreen toggle
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen();
      }
    }
    document.getElementById('btn-fs').addEventListener('click', toggleFullscreen);

    // Auto-rescale to fit viewport
    function rescale() {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      const slideW = 960;
      const slideH = 540;
      const scale = Math.min((vw - 32) / slideW, (vh - 32) / slideH);
      scaler.style.transform = 'scale(' + Math.max(0.2, scale) + ')';
    }

    window.addEventListener('resize', rescale);
    document.addEventListener('fullscreenchange', () => setTimeout(rescale, 100));
    rescale();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(slidesDir, 'viewer.html'), viewerHtml, 'utf8');
console.log('Successfully generated viewer.html');
