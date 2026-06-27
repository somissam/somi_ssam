/**
 * 연습기록 통합 시스템(STEP G) 자동 점검 스크립트
 * 사용법: node practice_log_system_check.js
 *   (인자 없이 실행 — common_core.js + 네 연습 페이지를 한 폴더에서 자동 검사)
 *
 * ══════════════════════════════════════════════════════════════════
 * ★ 이 스크립트가 존재하는 이유 (다음 세션 필독) ★
 * ══════════════════════════════════════════════════════════════════
 * 연습기록 저장은 "그릇(공통)+음식(페이지별)" 구조로 통일돼 있다.
 *   - 그릇 = common_core.js의 _appendPracticeLog 1벌
 *           (중복방지·재병합·저장·전송). 세 페이지가 공유.
 *   - 음식 = 각 페이지 logPractice의 chapter·exercise 조립(연습 고유 = 의도된 차이).
 *
 * 과거에 "발성만 저장코드가 길다 / 호흡은 elapsed=0 하는데 발성은 안 한다"를
 * 드리프트로 오해해 헛고생한 적이 있다. 그건 오진이었다:
 *   - 중복방지의 단일 주체 = 공통 __SOMI_LOGGED_THIS_RUN 플래그(셋 다 동일).
 *   - 호흡·리듬의 자동완료 후 elapsed=0 은 "타이머 상태 초기화"(화면 동작)이지
 *     중복방지가 아니다. 발성에 그 줄이 없는 건 정상(드리프트 아님).
 *
 * 이 스크립트는 그 "정상 상태"를 기계로 고정한다.
 *   ✅ 통과하면 = 통합 건강함. 사람이 코드 모양 차이로 다시 의심할 필요 없음.
 *   ❌ 실패하면 = 진짜 문제(공통 그릇이 깨졌거나 페이지가 그릇을 안 씀).
 * "문제 아닌 걸 문제로 잡지 않게, 문제를 놓치지 않게" 하는 안전망이다.
 * ══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const CC = path.join(DIR, 'common_core.js');
const PAGES = {
  breath: 'somi_ssam_breath.html',
  rhythm: 'somi_ssam_rhythm_groove.html',
  vocalF: 'somi_ssam_vocal_lab.html',
  vocalM: 'somi_ssam_vocal_lab_male.html',
};

let errors = [];
let passes = [];
const ok  = m => passes.push(m);
const bad = m => errors.push(m);

function read(p){
  if(!fs.existsSync(p)){ bad('파일 없음: '+path.basename(p)); return ''; }
  return fs.readFileSync(p,'utf8');
}

// ── 검사 1: 공통 그릇이 정확히 1벌 존재 ──────────────────────────
const cc = read(CC);
const bodyCount = (cc.match(/window\._appendPracticeLog\s*=\s*function/g)||[]).length;
if(bodyCount === 1) ok('공통 _appendPracticeLog 본문 1벌 (정상)');
else bad(`공통 _appendPracticeLog 본문이 ${bodyCount}벌 (1이어야 함 — 0이면 누락, 2+면 중복정의)`);

// 공통 본문이 중복방지 플래그를 실제로 사용하는가
if(/__SOMI_LOGGED_THIS_RUN/.test(cc)) ok('공통 그릇이 __SOMI_LOGGED_THIS_RUN 플래그로 중복방지');
else bad('공통 그릇에 중복방지 플래그(__SOMI_LOGGED_THIS_RUN)가 없음 — 중복저장 위험');

// 재병합(흠① 수정): 디스크 최신을 읽어 합치는가 (메모리 통째 덮기 금지)
if(/localStorage\.getItem\('somi_logs'\)/.test(cc)) ok('재병합: 저장 직전 디스크 최신본 읽음(흠① 수정 반영)');
else bad('재병합 로직 없음 — 다른 기기/탭 기록 유실 위험');

// 저장 반영 확인(흠② 수정): 저장 후 검증 + 경고
if(/console\.warn/.test(cc) && /getItem\('somi_logs'\)\s*!==/.test(cc))
  ok('저장 실패 감지+경고(흠② 수정 반영)');
else bad('저장 실패를 감지/경고하지 않음 — 조용한 데이터 손실 위험(흠②)');

// ── 검사 2: 세 연습 페이지가 그릇을 쓰고, 자체 정의가 없는가 ──────
for(const [key, file] of Object.entries(PAGES)){
  const html = read(path.join(DIR, file));
  if(!html) continue;

  // 페이지가 자체 _appendPracticeLog를 정의하면 안 됨(공통 1벌 원칙)
  const ownDef = (html.match(/function\s+_appendPracticeLog/g)||[]).length;
  if(ownDef === 0) ok(`${file}: 자체 _appendPracticeLog 정의 0개 (공통만 사용)`);
  else bad(`${file}: 자체 _appendPracticeLog ${ownDef}개 — 공통 1벌 원칙 위반(중복정의)`);

  // logPractice가 공통 헬퍼를 호출하는가
  if(/window\._appendPracticeLog\(/.test(html)) ok(`${file}: logPractice가 공통 그릇 호출`);
  else bad(`${file}: 공통 _appendPracticeLog 호출 없음 — 그릇을 안 씀(통합 누락)`);

  // 새 재생 시작 시 중복방지 플래그를 푸는가(안 풀면 다음 연습 누락)
  if(/__SOMI_LOGGED_THIS_RUN\s*=\s*false/.test(html))
    ok(`${file}: 새 재생 시 중복방지 플래그 리셋 있음`);
  else bad(`${file}: 중복방지 플래그를 푸는 코드가 없음 — 다음 연습 기록 누락 위험`);

  // 유령 변수 _loggedThisRun이 남아있지 않은가(흠①의 잔재)
  if(/_loggedThisRun/.test(html))
    bad(`${file}: 유령 변수 _loggedThisRun 잔존 — 제거 대상(읽는 곳 없는 죽은 코드, 혼란 유발)`);
  else ok(`${file}: 유령 변수 _loggedThisRun 없음 (청소됨)`);

  // 옛 직접저장 잔재(발성의 localStorage.setItem('somi_logs') 직접호출)가 없는가
  if(/localStorage\.setItem\('somi_logs'/.test(html))
    bad(`${file}: logs를 직접 localStorage에 저장하는 옛 코드 잔존 — 그릇 우회(통합 누락)`);
  else ok(`${file}: logs 직접저장 잔재 없음(그릇 경유)`);
}

// ── 검사 3: 자기참조 무한재귀 함정(F-1 핫픽스 교훈) ──────────────
// window.X=function 본문과 동명의 function X(){return window.X()} 다리가 공존하면 무한재귀.
const trap = /function\s+_appendPracticeLog\s*\([^)]*\)\s*\{\s*return\s+window\._appendPracticeLog/;
if(trap.test(cc)) bad('common_core: _appendPracticeLog 자기참조 다리 발견 — 무한재귀 위험');
else ok('자기참조 무한재귀 함정 없음');

// ── 검사 4: 자동완료 시 elapsedSeconds 처리가 세 페이지 일치 ──────
// (버그수정 이력) 자동완료 직후 elapsedSeconds=0을 하면 "화면엔 마지막 시간이 남는데
//  내부값은 0" 인 데이터-화면 불일치 버그가 된다. 셋 다 "자동완료 땐 elapsedSeconds를
//  안 건드림"(마지막 시간 유지)으로 통일돼야 한다. 한쪽에만 elapsed=0이 들어가면 드리프트.
const autoEndPages = {
  breath: 'somi_ssam_breath.html',
  rhythm: 'somi_ssam_rhythm_groove.html',
};
for(const [key, file] of Object.entries(autoEndPages)){
  const html = read(path.join(DIR, file));
  if(!html) continue;
  // 자동완료 블록: logPractice 자동저장 주석 ~ 다음 showSuccess 사이에 elapsedSeconds=0 이 있으면 안 됨
  const m = html.match(/logPractice\(\);\s*\/\/\s*자동완료[\s\S]{0,400}?showSuccess/);
  if(!m){ bad(`${file}: 자동완료 블록을 못 찾음 — 점검 패턴 갱신 필요`); continue; }
  if(/elapsedSeconds\s*=\s*0/.test(m[0]))
    bad(`${file}: 자동완료 블록에 elapsedSeconds=0 있음 — 화면(시간 남김)과 불일치 버그/드리프트. 제거할 것(발성과 일치).`);
  else ok(`${file}: 자동완료 시 elapsedSeconds 안 건드림(화면-데이터 일치, 발성과 통일)`);
}
// 발성은 원래부터 자동완료 시 elapsed 안 건드림 — 기준점이므로 확인만
const vocalHtml = read(path.join(DIR, PAGES.vocalF));
if(vocalHtml){
  const vm = vocalHtml.match(/logPractice\(\);\s*\/\/\s*패턴 자동완료[\s\S]{0,300}?return/);
  if(vm && !/elapsedSeconds\s*=\s*0/.test(vm[0])) ok('발성(기준): 자동완료 시 elapsedSeconds 안 건드림');
  else if(vm) bad('발성 자동완료 블록에 elapsedSeconds=0 — 기준이 바뀜, 설계 재확인 필요');
}

// ── 결과 출력 ───────────────────────────────────────────────────
console.log('\n===== 연습기록 통합 시스템 점검 =====\n');
console.log('✅ 통과 항목 ('+passes.length+'개):');
passes.forEach(m=>console.log('   · '+m));
console.log('\n'+(errors.length? '❌ 문제 ('+errors.length+'개):' : '❌ 문제 (0개): 없음 — 통합 건강함!'));
errors.forEach(m=>console.log('   ✗ '+m));
console.log('');
process.exit(errors.length ? 1 : 0);
