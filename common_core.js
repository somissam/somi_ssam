/* ════════════════════════════════════════════════════════════════
   common_core.js — 소미쌤 앱 공통 토대
   ────────────────────────────────────────────────────────────────
   모든 페이지가 공유하는 "그릇 성격" 기능을 한 곳에 모은다.
   (페이지마다 복붙하지 않고 이 파일 하나만 고치면 전체 반영)

   ※ 연습 패턴 로직(호흡/발성/리듬)은 여기 넣지 않는다 — 그건 페이지별 독립.
   ※ 앞으로 추가될 공통 기능(예: 로딩 꿀팁, 도장 인센티브 공통부 등)도
      이 파일에 모듈처럼 덧붙인다.

   [현재 포함 모듈]
   - A. 세로 강제 (가로 차단막) : 폰을 가로로 눕히면 "세로로 돌려주세요" 안내.
        가로모드를 정식으로 만들 때 이 모듈만 걷어내고 교체하면 됨.
   ════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── 모듈 A: 세로 강제 (가로 차단막) ──────────────────────────────
     동작: 폰을 가로로 눕혔을 때만 전체를 덮는 안내 오버레이를 띄운다.
           세로로 돌리면 자동으로 사라진다.
     판정: '가로( landscape ) + 세로높이 500px 이하' = 폰 가로.
           → 태블릿/노트북의 넓은 가로 화면은 높이가 커서 걸리지 않음.
     교체: 정식 가로모드 도입 시 window.__SOMI_DISABLE_PORTRAIT_LOCK=true 로
           이 모듈을 끌 수 있게 해 둠(특정 화면만 가로 허용하는 7번 기능 대비). */

  function _isPhoneLandscape(){
    if (window.__SOMI_DISABLE_PORTRAIT_LOCK) return false;
    var landscape = window.matchMedia('(orientation:landscape)').matches;
    var shortSide = Math.min(window.screen.width, window.screen.height);
    var lowHeight = window.innerHeight <= 500;
    // 폰(짧은쪽<=480)이면서 가로이고 화면 높이가 낮을 때만 차단
    return landscape && lowHeight && shortSide <= 480;
  }

  var _overlayId = 'somi-portrait-guard';

  function _ensureOverlay(){
    var el = document.getElementById(_overlayId);
    if (el) return el;
    el = document.createElement('div');
    el.id = _overlayId;
    el.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'display:none','flex-direction:column',
      'align-items:center','justify-content:center','gap:16px',
      'background:#f5f0e8','color:#5a5048',
      'font-family:inherit','text-align:center','padding:24px'
    ].join(';');
    el.innerHTML =
      '<div style="font-size:3rem;line-height:1">\uD83D\uDCF1</div>' +
      '<div style="font-size:1.15rem;font-weight:700">\uC138\uB85C\uB85C \uB3CC\uB824\uC8FC\uC138\uC694</div>' +
      '<div style="font-size:0.9rem;opacity:0.7;max-width:18rem">' +
      '\uC18C\uBBF8\uC30C\uC740 \uC138\uB85C \uD654\uBA74\uC5D0 \uB9DE\uCDB0\uC838 \uC788\uC5B4\uC694.</div>';
    document.body.appendChild(el);
    return el;
  }

  function _apply(){
    if (!document.body) return;
    var el = _ensureOverlay();
    el.style.display = _isPhoneLandscape() ? 'flex' : 'none';
  }

  function _init(){
    _apply();
    window.addEventListener('resize', _apply);
    window.addEventListener('orientationchange', function(){ setTimeout(_apply, 50); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // 외부에서 수동 제어할 수 있게 노출 (정식 가로모드 연동 대비)
  window.SomiPortraitGuard = {
    refresh: _apply,
    disable: function(){ window.__SOMI_DISABLE_PORTRAIT_LOCK = true; _apply(); },
    enable:  function(){ window.__SOMI_DISABLE_PORTRAIT_LOCK = false; _apply(); }
  };
})();
