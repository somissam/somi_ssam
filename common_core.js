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
/* 연습기록 서버 병합 저장 (C작업 — 여러 학생이 somi_logs 한 덩어리를 공유하므로
   통째 덮어쓰기하면 다른 학생의 방금 기록이 서버에서 지워질 수 있다. 그래서
   ① 서버 최신본을 읽어 ② 내 학생(profileId) 기록만 이번 1건 추가한 것으로 교체하고
   ③ 다른 학생 기록은 서버 것 그대로 둔 뒤 올린다. 학생 도장에 쓴 방식과 동일.)
   - window._somiServerRead(key) : 페이지가 연결해준 서버 읽기 함수(있을 때만 동작).
   - 실패/오프라인이어도 로컬 저장은 이미 됐으므로 화면은 정상. 다음 접속 때 병합됨. */
window._mergeLogsToServer = async function(profileId){
  try{
    if(typeof window._somiServerRead !== 'function' || !window._fsSet) return;
    var remoteRaw = await window._somiServerRead('somi_logs');
    var remote = {};
    try{ remote = remoteRaw ? (JSON.parse(remoteRaw)||{}) : {}; }catch(e){ remote = {}; }
    var localAll = {};
    try{ localAll = JSON.parse(localStorage.getItem('somi_logs')||'{}')||{}; }catch(e){ localAll = {}; }
    // 서버본을 기준으로, 내 학생 기록만 로컬(방금 추가분 포함)로 교체
    remote[profileId] = Array.isArray(localAll[profileId]) ? localAll[profileId] : [];
    var mj = JSON.stringify(remote);
    localStorage.setItem('somi_logs', mj);   // 로컬도 병합본으로 맞춤(다른 학생 기록까지 최신 유지)
    window._fsSet('somi_logs', mj);
  }catch(e){ /* 오프라인 — 로컬엔 이미 저장됨, 다음 접속 때 병합 */ }
};

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
    // C작업 — 서버엔 통째 덮어쓰기 대신 "내 학생만 병합"해서 다시 올림(다른 학생 기록 유실 방지)
    if (typeof window._mergeLogsToServer === 'function') { window._mergeLogsToServer(profileId); }
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
.somi-load-img-slot{width:100px;height:100px;display:flex;align-items:center;justify-content:center;}
.somi-load-img-slot img{width:100%;height:100%;object-fit:contain;border-radius:20px;}
.somi-load-spinner{width:80px;height:80px;border-radius:50%;position:relative;display:flex;align-items:center;justify-content:center;}
/* 회전은 가상요소 링만 담당 → 안쪽 아이콘은 고정 */
.somi-load-spinner::before{content:"";position:absolute;inset:0;border:5px solid var(--border);border-top:5px solid var(--accent);border-radius:50%;animation:spin 0.8s linear infinite;}
/* 회전 링 안쪽에 정지된 웹앱 아이콘을 틈 없이 딱 맞게 겹침
   (링 안지름 = 80 - 5*2 = 70px). 링만 회전, 아이콘은 고정. */
.somi-load-spinner .somi-load-icon{position:relative;width:70px;height:70px;border-radius:50%;object-fit:cover;}
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

/* ════════════════════════════════════════════════════════════════
   [공통 모듈] 날짜 숫자입력 생성기 (makeNumericDateInput)
   ────────────────────────────────────────────────────────────────
   type=date 대신 숫자 키보드(text + inputmode=numeric)로 날짜 입력.
   - 핸드폰/태블릿에서 숫자 키보드만 뜸
   - 8자리(YYYYMMDD) 입력 시 화면엔 YYYY.MM.DD 자동 점 삽입
   - 유효한 날짜면 onCommit('YYYY-MM-DD'), 불완전/무효면 onCommit('')
   사용: const inp = makeNumericDateInput(초기값YYYY-MM-DD, (v)=>{ ... });
   ════════════════════════════════════════════════════════════════ */
window.makeNumericDateInput = function(initVal, onCommit){
  const inp = document.createElement('input');
  inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
  inp.maxLength = 10; inp.placeholder = '예: 2026.01.15';
  inp.value = initVal ? String(initVal).replace(/-/g, '.') : '';
  inp.oninput = function(){
    let d = inp.value.replace(/[^0-9]/g, '').slice(0, 8);
    let shown = d;
    if (d.length > 6)      shown = d.slice(0,4) + '.' + d.slice(4,6) + '.' + d.slice(6);
    else if (d.length > 4) shown = d.slice(0,4) + '.' + d.slice(4);
    inp.value = shown;
    if (d.length === 8){
      const y = +d.slice(0,4), mo = +d.slice(4,6), da = +d.slice(6,8);
      const dt = new Date(y, mo-1, da);
      const valid = dt.getFullYear()===y && dt.getMonth()===mo-1 && dt.getDate()===da && y>=1900 && y<=2100;
      onCommit(valid ? (d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8)) : '');
    } else {
      onCommit('');
    }
  };
  return inp;
};

/* [공통 모듈] 기존 input 요소에 숫자날짜 동작 입히기 (정적 input용)
   - input의 .value는 항상 YYYY-MM-DD 유지(기존 코드 호환), 화면 표시만 YYYY.MM.DD
   - 핸드폰/태블릿 숫자 키보드, 8자리 입력 시 자동 점
   사용: attachNumericDate(document.getElementById('s-birth-input')); */
window.attachNumericDate = function(inp){
  if(!inp) return;
  inp.type='text'; inp.inputMode='numeric'; inp.autocomplete='off';
  inp.maxLength=10; inp.placeholder='예: 2026.01.15';
  // 내부 실제값(YYYY-MM-DD)을 별도 보관, .value는 표시용이지만 코드 호환 위해 동기화
  let _val = (inp.value||'').trim();
  function render(){ inp.dataset.isodate = _val; }
  // 표시 초기화
  if(_val){ inp.value = _val.replace(/-/g,'.'); }
  render();
  inp.addEventListener('input', function(){
    let d = inp.value.replace(/[^0-9]/g,'').slice(0,8);
    let shown = d;
    if(d.length>6) shown = d.slice(0,4)+'.'+d.slice(4,6)+'.'+d.slice(6);
    else if(d.length>4) shown = d.slice(0,4)+'.'+d.slice(4);
    inp.value = shown;
    if(d.length===8){
      const y=+d.slice(0,4),mo=+d.slice(4,6),da=+d.slice(6,8);
      const dt=new Date(y,mo-1,da);
      const valid=dt.getFullYear()===y&&dt.getMonth()===mo-1&&dt.getDate()===da&&y>=1900&&y<=2100;
      _val = valid ? (d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8)) : '';
    } else { _val=''; }
    render();
  });
  // 외부에서 .value(YYYY-MM-DD) 세팅 시 표시도 갱신하도록 헬퍼 제공
  inp.setISODate = function(iso){ _val=(iso||'').trim(); inp.value=_val?_val.replace(/-/g,'.'):''; render(); };
  inp.getISODate = function(){ return _val; };
};

/* [공통 모듈] 날짜 숫자입력 — 순수 변환/검증 코어 (위 두 함수와 index가 공유)
   입력 문자열(점/숫자 섞임) → {shown:'YYYY.MM.DD 표시용', iso:'YYYY-MM-DD 또는 빈문자'} */
window.parseNumericDate = function(raw){
  let d = String(raw||'').replace(/[^0-9]/g,'').slice(0,8);
  let shown = d;
  if(d.length>6) shown = d.slice(0,4)+'.'+d.slice(4,6)+'.'+d.slice(6);
  else if(d.length>4) shown = d.slice(0,4)+'.'+d.slice(4);
  let iso='';
  if(d.length===8){
    const y=+d.slice(0,4),mo=+d.slice(4,6),da=+d.slice(6,8);
    const dt=new Date(y,mo-1,da);
    const valid=dt.getFullYear()===y&&dt.getMonth()===mo-1&&dt.getDate()===da&&y>=1900&&y<=2100;
    iso = valid ? (d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6,8)) : '';
  }
  return {shown, iso};
};

/* ════════════════════════════════════════════════════════════════
   모듈 R: 회차(레슨완) 계산기 — 등록대장 ↔ 도장 연동 (공용 1벌)
   ────────────────────────────────────────────────────────────────
   목적: 세 화면(등록대장·선생 달력·학생 달력)이 "몇 번째 회차인가"를
        똑같이 계산하도록 단 하나의 계산기를 공유한다(규칙 5: 공통).

   방아쇠 = 도장(A안). 선생님이 레슨완 도장을 찍은 날짜를 세어
   등록대장의 회차권(4/8/특수)에 순서대로 배정한다.

   ★ 원칙(설계도 5-1): 과거는 소급하지 않는다.
     - 각 등록 묶음은 firstClass(첫 사용일) 이후의 레슨완 도장만 센다.
     - 기존 학생은 baseline(이미 쓴 회차)을 등록건에 넣어 그만큼 건너뛴다.

   읽기 전용: somi_ledger_sales(등록대장)·somi_teacher_stamps(도장)만 읽음.
   아무 데이터도 쓰지 않음 → 앱 본체 안전(규칙 5).
   ──────────────────────────────────────────────────────────────── */
(function(){
  var LESSON_STAMPS = ['lessondone','lessondonefinal','lessonabsent','lessonabsentfinal'];

  function readJSON(key){
    try{ return JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ return []; }
  }
  function readObj(key){
    try{ return JSON.parse(localStorage.getItem(key)||'{}'); }catch(e){ return {}; }
  }
  /* 회차 총량: '4'|'8'|숫자 → 정수. 'custom'/빈값/기타는 0(=회차관리 안 함) */
  function totalOf(rec){
    var n = parseInt(rec && rec.sessions, 10);
    return (isFinite(n) && n>0) ? n : 0;
  }
  /* 이미 쓴 회차(기준선): 기존 학생 전환용. 없으면 0 */
  function baselineOf(rec){
    var b = parseInt(rec && rec.baselineUsed, 10);
    return (isFinite(b) && b>0) ? b : 0;
  }

  /* 한 학생의 레슨 등록 묶음 목록 — 첫사용일(없으면 입금일) 오름차순 */
  function bundlesFor(studentId, sales){
    return (sales||[])
      .filter(function(r){
        return r && r.studentId===studentId
            && (r.kind==='lesson' || !r.kind)   // 레슨만(옛 데이터 kind 없으면 레슨 취급)
            && totalOf(r) > 0;                   // 회차권만
      })
      .map(function(r){
        return {
          id: r.id,
          total: totalOf(r),
          baseline: baselineOf(r),
          start: (r.firstClass || r.paydate || r.regdate || '')  // 카운팅 시작 기준일
        };
      })
      .sort(function(a,b){ return String(a.start).localeCompare(String(b.start)); });
  }

  /* 한 학생의 레슨완 도장 날짜 목록(오름차순) */
  function lessonStampDatesFor(studentId, stamps){
    var out=[];
    var prefix = studentId + '_';
    Object.keys(stamps||{}).forEach(function(k){
      if(k.indexOf(prefix)!==0) return;
      var v = stamps[k];
      if(v && LESSON_STAMPS.indexOf(v.stamp)>=0){
        out.push(v.date || k.slice(prefix.length));
      }
    });
    out.sort(function(a,b){ return String(a).localeCompare(String(b)); });
    return out;
  }

  /* ── 핵심: 한 학생의 회차 현황 전체 계산 ──
     반환:
       bundles: [{id,total,baseline,start,used,remaining,done}]  각 등록권 현황
       stampMap: { 'YYYY-MM-DD': {index,total,isFinal,bundleId} }  날짜별 그 도장의 회차정보
       needReenroll: 마지막 묶음이 소진돼 재등록이 필요한가(boolean)
  */
  window.somiRoundsForStudent = function(studentId){
    var sales  = readJSON('somi_ledger_sales');
    var stamps = readObj('somi_teacher_stamps');
    var bundles = bundlesFor(studentId, sales);
    var dates   = lessonStampDatesFor(studentId, stamps);

    var result = bundles.map(function(b){
      return { id:b.id, total:b.total, baseline:b.baseline, start:b.start,
               used:0, remaining:b.total - b.baseline, done:false, _dates:[] };
    });
    var stampMap = {};

    /* 도장을 순서대로 묶음에 배정.
       각 묶음은 자기 시작일(b.start=첫사용일, 없으면 입금일) 이후 도장만 센다.
       → 첫 사용일 이전(과거) 도장은 이 등록권 것이 아님(설계도 5-1 소급 방지).
       과거에 이미 쓴 회차는 baseline(이미 쓴 회차) 숫자로만 반영.
       여러 권이 있으면 시작일 순서대로 각자 자기 구간의 도장을 가져감. */
    var di = 0; // 도장 인덱스
    for(var bi=0; bi<result.length; bi++){
      var b = result[bi];
      var capacity = b.total - b.baseline;  // 이 묶음이 실제로 셀 도장 수
      if(capacity <= 0){ b.done=true; b.remaining=0; continue; }
      var filled = 0;
      while(di < dates.length && filled < capacity){
        var d = dates[di];
        // 이 묶음 시작일 이전 도장은 이 권 것이 아님 → 건너뜀(과거 소급 방지)
        if(b.start && String(d) < String(b.start)){ di++; continue; }
        filled++;
        var indexInBundle = b.baseline + filled;      // 사람이 보는 회차 번호(기준선 포함)
        var isFinal = (indexInBundle >= b.total);
        stampMap[d] = { index:indexInBundle, total:b.total, isFinal:isFinal, bundleId:b.id };
        b._dates.push(d);
        di++;
      }
      b.used = filled;
      b.remaining = capacity - filled;
      b.done = (b.remaining <= 0);
    }

    var last = result.length ? result[result.length-1] : null;
    var needReenroll = !!(last && last.done);

    return { bundles: result, stampMap: stampMap, needReenroll: needReenroll };
  };

  /* ── 편의: 특정 날짜의 레슨완 도장이 몇 번째/마지막인지 ──
     반환 {index,total,isFinal} 또는 null(회차권에 안 물린 도장) */
  window.somiRoundAt = function(studentId, dateStr){
    var r = window.somiRoundsForStudent(studentId);
    return r.stampMap[dateStr] || null;
  };

  /* ── 편의: 등록대장 목록용 요약 문자열 ──
     예: {used:3,total:4,remaining:1,done:false} → "3 / 4회 · 1회 남음" */
  window.somiRoundSummary = function(bundleStatus){
    if(!bundleStatus || !bundleStatus.total) return '';
    var used = bundleStatus.baseline + bundleStatus.used; // 화면 표기(기준선 포함)
    var s = used + ' / ' + bundleStatus.total + '회';
    if(bundleStatus.done) s += ' · 소진(재등록 필요)';
    else s += ' · ' + bundleStatus.remaining + '회 남음';
    return s;
  };
})();

/* ── 모듈 R 부록: 연습 자동 도장(학생 미선택 시) — 연한 회색 점선 원 (공용 1벌) ──
   학생이 그날 도장을 직접 고르지 않았는데 연습기록이 있으면 이 그림을 쓴다.
   당일결석(진한 회색 꽉참)과 확실히 구분되도록 연한 회색 + 점선으로.
   선생님·학생 화면이 똑같이 보이도록 공통 함수로 둠(규칙 5). */
window.somiAutoStampSVG = function(){
  return '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">'
       + '<circle cx="40" cy="40" r="30" fill="none" stroke="#B4B2A9" stroke-width="3" stroke-dasharray="6 5" stroke-linecap="round"/>'
       + '</svg>';
};

/* ══════════════════════════════════════════════════════════════
   모듈 N: 전체 공지 (로드맵 D, 2026-07-08)
   - 데이터 그릇: somi_notice = 공지 목록(배열).
     지금은 선생님 화면에서 1개만 관리하지만, 나중에 여러 개로 늘려도
     데이터를 갈아엎지 않도록 처음부터 목록으로 저장한다.
     항목 모양: { id, text, active(게시중 여부), endDate('YYYY-MM-DD' 또는 ''), createdAt }
   - somiGetActiveNotices(): 게시 중이고 종료일이 안 지난 것만 반환.
     종료일 당일까지 표시, 다음 날부터 자동 숨김. 종료일 비면 무기한.
   - somiNoticeBannerHTML(): 학생홈 상단 배너 HTML. 여러 개면 세로로 쌓임.
   ══════════════════════════════════════════════════════════════ */
window.somiEscapeHtml = function(s){
  return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};
window.somiGetActiveNotices = function(){
  var arr = window.loadData('somi_notice', []);
  if(!Array.isArray(arr)) arr = [];
  var today = window.toDateStr(new Date());
  return arr.filter(function(n){
    if(!n || !n.active || !n.text) return false;
    if(n.endDate && String(n.endDate) < today) return false;  // 종료일 다음 날부터 자동 숨김
    return true;
  });
};
// 공지 핑크 색상 (학생 배너 · 선생님 홈 활성공지 공용 1벌) — 여기만 고치면 양쪽 반영.
window.SOMI_NOTICE_PINK = {bg:'rgba(247,140,190,0.18)', bd:'rgba(240,95,160,0.55)', fg:'#c23b7a'};
window.somiNoticeBannerHTML = function(notices){
  if(!notices || !notices.length) return '';
  // 공지는 모두 같은 핑크 계열. 반투명 배경이라 다크/아이보리 테마 모두에서 읽힘.
  var c = window.SOMI_NOTICE_PINK;
  return notices.map(function(n){
    var body = window.somiEscapeHtml(n.text).replace(/\n/g,'<br>');
    return '<div style="background:'+c.bg+';border:1px solid '+c.bd+';border-radius:12px;padding:9px 14px;margin-bottom:9px;display:flex;align-items:flex-start;gap:8px;">'
         + '<span style="flex-shrink:0;font-size:0.9rem;line-height:1.55;">📢</span>'
         + '<span style="flex-shrink:0;font-size:0.88rem;color:'+c.fg+';font-weight:700;line-height:1.55;">공지</span>'
         + '<span style="font-size:0.88rem;color:'+c.fg+';font-weight:400;line-height:1.55;word-break:break-word;">'+body+'</span>'
         + '</div>';
  }).join('');
};

/* ══════════════════════════════════════════════════════════════
   [공통 모듈] 커스텀 드롭다운 토글 (somiAttachDropdown) — E-③
   ────────────────────────────────────────────────────────────────
   반복되던 뼈대만 공용화: "버튼 누르면 열림 → 다른 pm-dropdown 다 닫힘
   → 이미 열려있으면 닫힘". 옵션 내용·색·클릭동작은 호출측이 그대로 만든다.
   (날짜 함수처럼: 껍데기는 공용, 알맹이는 인자)
   사용:
     menu.className = 'pm-dropdown';   // 목록 div (position:absolute 등 스타일은 호출측)
     somiAttachDropdown(button, menu); // 버튼 클릭 토글을 이 함수가 담당
   - button, menu는 이미 만들어 넘긴다. 바깥클릭 닫기는 기존 document 리스너가 담당(그대로 둠).
   ════════════════════════════════════════════════════════════════ */
window.somiAttachDropdown = function(button, menu){
  if(!button || !menu) return;
  button.onclick = function(e){
    e.stopPropagation();
    var isOpen = menu.style.display !== 'none' && menu.style.display !== '';
    document.querySelectorAll('.pm-dropdown').forEach(function(d){ d.style.display='none'; });
    if(!isOpen) menu.style.display='block';
  };
};

/* ══════════════════════════════════════════════════════════════
   [공통 모듈] 스크롤 제어 (somiScrollTop / somiPreserveScroll) — E 화면공통
   ────────────────────────────────────────────────────────────────
   이 앱은 페이지 전체(window)가 스크롤된다. 두 가지 기본 동작을 공용화:
   ① somiScrollTop()  : 화면/탭 전환 시 맨 위로. (전환하면 위부터 보이는 게 기본)
   ② somiPreserveScroll(fn) : 목록을 통째로 다시 그리는 동안 스크롤 자리 유지.
        재렌더(fn) 실행 전 스크롤 위치를 저장 → fn 실행 → 위치 복원.
        (계좌·반 선택처럼 "고쳐도 그 자리에 머물러야" 하는 재렌더에 사용)
   ════════════════════════════════════════════════════════════════ */
window.somiScrollTop = function(smooth){
  try{ window.scrollTo({top:0, behavior: smooth ? 'smooth' : 'auto'}); }
  catch(e){ window.scrollTo(0,0); }  // 구형 브라우저 폴백
};
window.somiPreserveScroll = function(fn){
  var y = window.scrollY || window.pageYOffset || 0;
  try{ fn(); }
  finally{
    // 재렌더 직후 높이가 아직 안 잡힐 수 있어 다음 프레임에 복원(있으면), 즉시도 1번
    window.scrollTo(0, y);
    if(typeof requestAnimationFrame==='function'){
      requestAnimationFrame(function(){ window.scrollTo(0, y); });
    }
  }
};

/* ══════════════════════════════════════════════════════════════
   [공통 모듈] Shift 범위선택 — 범위 계산 코어 (somiRangeIndices) — E-②
   ────────────────────────────────────────────────────────────────
   Shift+클릭으로 "사이 전부 선택"할 때, 직전 위치~지금 위치 범위만 계산.
   순수 계산만 함 — DOM·데이터는 안 만짐(호출측이 처리). 날짜 parseNumericDate와 같은 결.
   - total  : 전체 체크박스 개수
   - fromIdx: 직전 클릭이 몇 번째인지 (없으면 -1)
   - toIdx  : 이번 클릭이 몇 번째인지
   → 유효하면 {lo, hi} (작은 값~큰 값, 양방향 정렬), 무효면 null
   ════════════════════════════════════════════════════════════════ */
window.somiRangeIndices = function(total, fromIdx, toIdx){
  if(typeof fromIdx!=='number' || typeof toIdx!=='number') return null;
  if(fromIdx<0 || toIdx<0) return null;
  if(fromIdx>=total || toIdx>=total) return null;
  if(fromIdx===toIdx) return null;
  return { lo: Math.min(fromIdx,toIdx), hi: Math.max(fromIdx,toIdx) };
};
