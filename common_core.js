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
/* ── 모듈 S: 공유 감시 명단 (SYNC_WATCH_KEYS) ──────────────────────
   선생님이 이 키들 중 하나를 저장하면 "변경 시각 도장(somi_sync_meta)"을
   찍어 학생 페이지가 재동기화하도록 신호한다.
   ※ 여기서는 "명단(목록)"만 공용으로 둔다. 도장을 찍는 동작은 각 페이지에 그대로.
   ※ 새 공유 항목이 생기면 이 한 곳만 고치면 모든 페이지에 반영된다. */
window.SOMI_SYNC_WATCH_KEYS = window.SOMI_SYNC_WATCH_KEYS || [
  'somi_pattern_locks',
  'somi_pattern_levels',
  'somi_level_settings',
  'somi_class_settings',
  'somi_rest_start_dates',
  'somi_teacher_stamps'
];

/* ── 모듈 D: 데이터 저장/불러오기 (공용 표준) ──────────────────────
   모든 페이지가 공유하는 localStorage 저장·불러오기 기본형.
   ⚠️ 할당형(window.xxx =)으로 둔다 — 페이지 인라인의 function 선언과
      이름이 겹쳐도 충돌나지 않게 하기 위함.

   [loadData] 키로 값을 읽어 JSON 파싱. 없거나 깨지면 기본값(d) 반환.
        + 배열 타입방어: 기본값이 배열인데 저장값이 배열이 아니면 버리고 기본값.
   [saveData] 값을 JSON으로 저장 + (서버연결 시) 서버 전송.
      ⛔ 서버전송 차단 두 가지 (둘 다 없으면 전부 전송 = 기존과 동일):
        ① window.__SOMI_NO_SERVER (깃발): 켜지면 이 페이지 saveData는
           서버로 아무것도 안 보냄. index처럼 "saveData는 로컬 전용,
           서버는 _fsSet/안전가드로 따로"가 원칙인 페이지용. 키가 동적
           (somi_student_session_+id)이어도 전부 차단되어 안전.
        ② window.__SOMI_NO_SERVER_KEYS (목록): 이 목록의 키만 전송 제외.
           student처럼 명단(somi_profiles) 하나만 빼고 싶은 페이지용.
      추가 동작(도장): 이 페이지가 "선생님"일 때만(window.__SOMI_IS_TEACHER)
        & 저장 키가 감시 명단(SOMI_SYNC_WATCH_KEYS)에 들면
        → somi_sync_meta에 변경 시각(ts) 기록 → 학생 페이지가 감지.
      ※ 학생/연습 페이지엔 깃발이 없으므로 도장 코드가 있어도 절대 안 켜진다.
        = 기존 "그냥 저장+전송"과 100% 동일하게 동작. */
window.loadData = function(k, d){
  try {
    const v = localStorage.getItem(k);
    if (v === null) return d;
    const p = JSON.parse(v);
    // 배열 타입방어: 기본값이 배열인데 저장값이 배열이 아니면(손상) → 버리고 기본값.
    //   명단(somi_profiles) 등 배열 데이터가 깨진 객체로 흘러가 앱이 멈추는 것을 막음.
    //   기본값이 배열이 아닌 호출에는 영향 없음 = 기존 동작 유지.
    if (Array.isArray(d) && !Array.isArray(p)) { localStorage.removeItem(k); return d; }
    return p;
  } catch(e) { return d; }
};
window.saveData = function(k, v){
  try {
    const json = JSON.stringify(v);
    localStorage.setItem(k, json);
    // 서버전송 차단: ① 페이지 전체 끄기 깃발(__SOMI_NO_SERVER) ② 키별 제외목록(__SOMI_NO_SERVER_KEYS)
    //   둘 중 하나라도 해당하면 서버(_fsSet)로 보내지 않는다. 둘 다 없으면 전부 전송 = 기존과 동일.
    //   - index: "saveData로는 서버 전송 안 함"이 원칙 → 깃발 사용(키가 동적이어도 전부 차단).
    //   - student: 명단(somi_profiles)만 제외 → 목록 사용.
    const noServer = window.__SOMI_NO_SERVER || (window.__SOMI_NO_SERVER_KEYS || []).includes(k);
    if (window._fsSet && !noServer) window._fsSet(k, json);
    // 선생님 페이지에서, 감시 대상 키가 바뀐 경우에만 변경 도장(ts) 갱신
    if (window.__SOMI_IS_TEACHER && (window.SOMI_SYNC_WATCH_KEYS || []).includes(k)) {
      const mj = JSON.stringify({ ts: Date.now() });
      localStorage.setItem('somi_sync_meta', mj);
      if (window._fsSet) window._fsSet('somi_sync_meta', mj);
    }
  } catch(e) {}
};

/* ── 모듈 Y: 동기화 공용 (연습 페이지 4종이 공유) ──────────────────
   - _mergeLogs : 기기 간 연습기록 병합(중복 제거). 네 페이지 본문이 완전 동일했음 → 1벌로.
   - _readSyncTs: somi_sync_meta의 변경 도장(ts) 읽기. rhythm판이 가장 견고
                  (옛 형식 m.value도 폴백, Number 방어) → 그 형태로 통일.
   - 화면 의존부(_checkAndResync 뒷처리·_afterSync·렌더)는 페이지마다 다르므로
     여기 넣지 않고 각 페이지에 남긴다(연습별 의도된 차이).
   - 할당형(window.xxx=)으로 둠 → 페이지 인라인 function 선언과 충돌 안 함.
     각 페이지는 폴백(typeof window.xxx!=='function'일 때만 자체 정의)으로 안전망. */
window._mergeLogs = function(local, remote){
  local = local || {}; remote = remote || {};
  const out = {};
  const ids = new Set([...Object.keys(local), ...Object.keys(remote)]);
  ids.forEach(id=>{
    const a = Array.isArray(local[id]) ? local[id] : [];
    const b = Array.isArray(remote[id]) ? remote[id] : [];
    const seen = new Set(); const merged = [];
    [...a, ...b].forEach(rec=>{
      if(!rec) return;
      const key = (rec.date||'')+'|'+(rec.time||'')+'|'+(rec.exercise||'')+'|'+(rec.duration||'');
      if(seen.has(key)) return;
      seen.add(key); merged.push(rec);
    });
    out[id] = merged;
  });
  return out;
};
window._readSyncTs = function(){
  try{
    const m = JSON.parse(localStorage.getItem('somi_sync_meta')||'{}');
    return Number(m.ts || m.value || 0) || 0;
  }catch(e){ return 0; }
};

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

/* ── 모듈 Z: 연습기록 저장 그릇 (연습 페이지 3종이 공유) ──────────────────
   STEP G — logPractice의 "그릇"(중복방지·재병합·저장·전송)을 1벌로 통일.
   음식(chapter·exercise 이름 조립)은 각 페이지에 남는다(연습 고유 = 의도된 차이).

   ★★★ 중복방지의 단일 주체 = 이 함수의 window.__SOMI_LOGGED_THIS_RUN 플래그 ★★★
   세 페이지(호흡·리듬·발성) 모두 이 공통 플래그로 "한 재생당 1건"을 보장한다.
   → 다음 세션 점검 시 주의: 호흡·리듬의 자동완료 직후 'elapsedSeconds=0'은
     중복방지가 아니라 "연습 종료 시 타이머/일시정지 상태 초기화"(화면 동작)다.
     발성엔 그 줄이 없다고 해서 드리프트가 아니다 — 중복방지는 셋 다 이 플래그로 통일됨.
     (elapsed=0은 호흡·리듬에 원래 있던 이중 안전망이고, 빼면 타이머 표시가 깨진다.)
   각 페이지는 "새 재생 시작" 시 window.__SOMI_LOGGED_THIS_RUN=false 로 플래그를 푼다.

   _appendPracticeLog(profileId, chapter, exercise, duration)
     → ① 중복방지: 이번 재생분이 이미 저장됐으면 막는다(위 플래그).
     → ② 재병합: 저장 직전 디스크 최신본을 다시 읽어 "디스크 ∪ 이번 1건"으로 합친다.
        (흠① 수정 — 메모리를 디스크로 통째 덮지 않는다. 디스크 최신을 살리고 1건만 추가.)
     → ③ 저장+전송: 공용 saveData 경유(localStorage + 서버, 깃발/목록 분기까지 그대로).
     → 저장이 실제 반영됐는지 확인 후, 실패 시 콘솔 경고+플래그 되돌림(흠② 수정).

   반환: 저장하면 true, 중복/무효/실패로 안 했으면 false. */
window._appendPracticeLog = function(profileId, chapter, exercise, duration){
  if (!profileId) return false;
  if (window.__SOMI_LOGGED_THIS_RUN) return false; // 이번 재생분 이미 저장됨 — 중복 방지
  try {
    // 디스크 최신본을 다시 읽어 병합(다른 기기/탭이 추가한 기록 유실 방지)
    var disk = {};
    try { disk = JSON.parse(localStorage.getItem('somi_logs') || '{}') || {}; } catch(e){ disk = {}; }
    if (!Array.isArray(disk[profileId])) disk[profileId] = [];
    var now = new Date();
    disk[profileId].push({
      date: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),
      time: now.getHours()+':'+String(now.getMinutes()).padStart(2,'0'),
      chapter: chapter,
      exercise: exercise,
      duration: Math.floor(duration),
    });
    window.__SOMI_LOGGED_THIS_RUN = true; // 저장 완료 표시
    // 공용 saveData 경유 — localStorage + 서버 전송(깃발/목록 분기 포함)
    var j = JSON.stringify(disk);
    if (typeof window.saveData === 'function') {
      window.saveData('somi_logs', disk);
    } else {
      localStorage.setItem('somi_logs', j);
      if (window._fsSet) window._fsSet('somi_logs', j);
    }
    // 흠② — 저장이 실제로 반영됐는지 확인(saveData가 내부에서 예외를 삼켜도 여기서 잡는다)
    if (localStorage.getItem('somi_logs') !== j) {
      window.__SOMI_LOGGED_THIS_RUN = false; // 저장 안 됐으니 플래그 되돌림(다음 시도 허용)
      console.warn('[_appendPracticeLog] 연습기록이 저장소에 반영되지 않음');
      return false;
    }
    return true;
  } catch(e) {
    console.warn('[_appendPracticeLog] 연습기록 저장 실패:', e);
    return false;
  }
};

/* ── 모듈 U: 날짜 문자열 유틸 (공용 1벌) ──────────────────────────────
   STEP H — 페이지마다 복붙돼 있던 toDateStr(연-월-일 zero-pad)을 1벌로 통일.
   home·student가 실사용(폴백으로 자기 정의 유지), breath·rhythm은 호출 0이라
   각 페이지에서 죽은 정의를 삭제했다. 동작은 모든 페이지에서 동일.
   toDateStr(Date) → "YYYY-MM-DD" (예: 2026-01-05) */
window.toDateStr = function(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
};

/* ════════════════════════════════════════════════════════════════
   모듈 V: 로딩 오버레이 제어 + CSS + HTML 인젝션 (STEP I)
   ────────────────────────────────────────────────────────────────
   각 페이지에 복붙돼 있던 somiShowLoading / somiHideLoading /
   somiStartSlowTimer 3함수 + CSS + HTML 구조를 1벌로 통일.

   ▸ CSS  → <head>에 <style> 인젝션 (z-index:99999 전체 통일)
   ▸ HTML → #somi-load-overlay가 없을 때만 <body> 앞에 삽입
             (이미 있는 페이지는 중복 삽입 안 함)
   ▸ JS   → window.somiShowLoading / somiHideLoading 등록
             (페이지에 남은 복사본은 모두 삭제 예정 — STEP I)
════════════════════════════════════════════════════════════════ */
(function(){
  /* ── CSS 인젝션 ── */
  const style = document.createElement('style');
  style.textContent = `
@keyframes spin{to{transform:rotate(360deg)}}
.somi-load-overlay{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  background:rgba(10,10,15,0.82);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);opacity:1;transition:opacity 0.35s ease;}
.theme-ivory .somi-load-overlay{background:rgba(245,240,232,0.85);}
.somi-load-overlay.hide{opacity:0;pointer-events:none;}
.somi-load-img-slot{width:84px;height:84px;display:flex;align-items:center;justify-content:center;}
.somi-load-img-slot img{width:100%;height:100%;object-fit:contain;border-radius:20px;}
.somi-load-spinner{width:52px;height:52px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;}
/* 회전은 가상요소 링만 담당 → 안쪽 아이콘은 고정 */
.somi-load-spinner::before{content:"";position:absolute;inset:0;border:4px solid var(--border);border-top:4px solid var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;}
/* 회전 링 안쪽에 정지된 웹앱 아이콘을 틈 없이 딱 맞게 겹침
   (링 안지름 = 52 - 4*2 = 44px). 링만 회전, 아이콘은 고정. */
.somi-load-spinner .somi-load-icon{position:relative;width:44px;height:44px;border-radius:50%;object-fit:cover;}
.somi-load-text{color:var(--text);font-size:0.95rem;font-weight:600;letter-spacing:0.5px;}
.somi-load-sub{color:var(--text2);font-size:0.8rem;margin-top:-8px;}
.somi-load-slow{color:var(--counting);font-size:0.8rem;display:none;text-align:center;line-height:1.6;max-width:280px;}
.somi-load-slow.show{display:block;}
.somi-load-slow button{margin-top:10px;padding:8px 18px;border-radius:10px;border:1px solid var(--counting);background:transparent;color:var(--counting);font-size:0.8rem;font-weight:600;font-family:inherit;cursor:pointer;}
`;
  document.head.appendChild(style);

  /* ── HTML 인젝션 (없을 때만) ──
     원본은 막이 HTML에 박혀 첫 페인트부터 보였다. 통합본도 깜빡임이 없도록
     body가 준비되는 즉시 삽입한다(DOMContentLoaded 대기 최소화).
     화면 구성은 원본 그대로(회전 스피너) + 사장님 요청대로 스피너 링
     안쪽에 웹앱 아이콘(icon-192.png)을 틈 없이 겹쳐 표시. */
  function _injectOverlay(){
    if(document.getElementById('somi-load-overlay')) return; // 이미 있으면 스킵
    if(!document.body){ requestAnimationFrame(_injectOverlay); return; } // body 대기
    const div = document.createElement('div');
    div.id = 'somi-load-overlay';
    /* 원본에서 일부 페이지(home)는 막을 hide 상태로 시작했다(먼저 다른 화면을
       보여주고 동기화 때만 막을 켜는 흐름). 페이지가 window.__SOMI_LOAD_HIDDEN
       =true로 알리면 동일하게 숨긴 채 생성한다. 그 외 페이지는 보이게 시작. */
    div.className = window.__SOMI_LOAD_HIDDEN ? 'somi-load-overlay hide' : 'somi-load-overlay';
    div.innerHTML = `
  <div class="somi-load-img-slot"><div class="somi-load-spinner"><img class="somi-load-icon" src="./icon-192.png" alt=""></div></div>
  <div class="somi-load-text">데이터 불러오는 중...</div>
  <div class="somi-load-sub">SOMI_SSAM</div>
  <div class="somi-load-slow">
    연결이 평소보다 느려요.<br>계속 다시 시도하고 있어요.
    <br><button onclick="somiHideLoading()">오프라인으로 계속하기</button>
  </div>`;
    document.body.insertBefore(div, document.body.firstChild);
  }
  _injectOverlay();

  /* ── JS 함수 ── */
  let _somiLoadTimer = null;
  window.somiStartSlowTimer = function(){
    const o = document.getElementById('somi-load-overlay'); if(!o) return;
    const slow = o.querySelector('.somi-load-slow');
    if(slow) slow.classList.remove('show');
    clearTimeout(_somiLoadTimer);
    _somiLoadTimer = setTimeout(()=>{ if(slow) slow.classList.add('show'); }, 25000);
  };
  window.somiShowLoading = function(text){
    const o = document.getElementById('somi-load-overlay'); if(!o) return;
    if(text){ const t = o.querySelector('.somi-load-text'); if(t) t.textContent = text; }
    o.classList.remove('hide');
    window.somiStartSlowTimer();
  };
  window.somiHideLoading = function(){
    const o = document.getElementById('somi-load-overlay'); if(!o) return;
    clearTimeout(_somiLoadTimer);
    o.classList.add('hide');
  };
  /* 단계 텍스트 업데이트용 헬퍼 */
  window.somiSetLoadText = function(text){
    const o = document.getElementById('somi-load-overlay'); if(!o) return;
    const t = o.querySelector('.somi-load-text'); if(t) t.textContent = text;
  };
})();
