/**
 * somi_ssam_vocal_lab — 패턴 자동 점검 스크립트
 * 사용법: node vocal_lab_pattern_check.js somi_ssam_vocal_lab.html
 *
 * html 파일에서 VOCAL_PATTERNS를 자동 추출해 검증합니다.
 * 패턴이 추가되어도 이 파일은 업데이트 불필요.
 *
 * ══════════════════════════════════════════════════
 * ★ 핵심 설계 원칙 ★
 * ══════════════════════════════════════════════════
 * 모든 패턴은 "패턴 4박 + 카운팅 4박" 구조로 동작합니다.
 * 마지막 음은 패턴 박에 포함되지 않고,
 * 카운팅 idx=0(_commonScheduleCounting)에서 재생됩니다.
 *
 *   noteDiv:4  → barBeats = 음수-1,  패턴(음수-1)음 + 카운팅 1음
 *   noteDiv:8  → barBeats = 4 (고정), 패턴 8음 + 카운팅 1음, 총 9음, 라벨 9개
 *   noteDiv:16 → barBeats = 4 (고정), 패턴 16음 + 카운팅 1음, 총 17음, 라벨 9개
 *                (16beat의 barBeats=4는 8beat와 동일 — 오류 아님!)
 * ══════════════════════════════════════════════════
 */

const fs = require('fs');

// ── html 파일 경로 인자 처리 ──
const htmlPath = process.argv[2];
if(!htmlPath){
  console.error('사용법: node vocal_lab_pattern_check.js somi_ssam_vocal_lab.html');
  process.exit(1);
}
if(!fs.existsSync(htmlPath)){
  console.error('파일을 찾을 수 없습니다:', htmlPath);
  process.exit(1);
}

// ── html에서 VOCAL_PATTERNS 추출 ──
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/const VOCAL_PATTERNS\s*=\s*(\[[\s\S]*?\]);/);
if(!match){
  console.error('VOCAL_PATTERNS를 찾을 수 없습니다. html 파일을 확인하세요.');
  process.exit(1);
}
let VOCAL_PATTERNS;
try {
  VOCAL_PATTERNS = eval(match[1]);
} catch(e) {
  console.error('VOCAL_PATTERNS 파싱 오류:', e.message);
  process.exit(1);
}
console.log(`\n📂 ${htmlPath}`);
console.log(`🎵 패턴 ${VOCAL_PATTERNS.length}개 감지\n`);

// ── 유틸 ──
const DEGREE_TO_SEMITONE={1:0,2:2,3:4,4:5,5:7,6:9,7:11,8:12};
function degreeToSemitone(deg){const oct=Math.floor((deg-1)/7);const base=((deg-1)%7)+1;return(DEGREE_TO_SEMITONE[base]||0)+oct*12;}

const LABEL_TO_MODE={'기본':'BASIC','연습':'PRACTICE','목풀기1':'WU1','목풀기2':'WU2','심화':'ADV1'};

function getExpectedBarBeats(nd, pattern){
  if(nd===8)  return 4;
  if(nd===16) return 4; // 8beat와 동일 — 마지막(17번째)음은 카운팅에서 처리
  return pattern.length - 1;
}
function getExpectedPatternLength(nd){
  if(nd===8)  return 9;
  if(nd===16) return 17;
  return null; // 4beat는 자유
}
function getExpectedLabelCount(nd, patternLength){
  if(nd===8)  return 9;
  if(nd===16) return 9; // 8beat와 동일하게 표시
  return patternLength;
}

// ── 검증 ──
let errors=[], ok=[];

VOCAL_PATTERNS.forEach(pat=>{
  const nd = pat.noteDiv || 4;
  const modes = pat.modeLabels.map(l => LABEL_TO_MODE[l] || l);
  const needsWarmup = modes.some(m => ['WU1','WU2','ADV1'].includes(m));

  // 1. 모드별 필수 필드
  if(needsWarmup){
    // warmup1Seq는 목풀기1 있을 때, warmup2Seq는 목풀기2 있을 때만 체크
    if(modes.includes('WU1')||modes.includes('WU2')) {
      if(modes.includes('WU1')) {
        ['warmup1','warmup1Seq'].forEach(f=>{
          if(!pat[f]) errors.push(`패턴${pat.id}(${pat.name}): [${f}] 없음`);
        });
      }
      if(modes.includes('WU2')){
        ['warmup2','warmup2Seq'].forEach(f=>{
          if(!pat[f]) errors.push(`패턴${pat.id}(${pat.name}): [${f}] 없음`);
        });
      }
    }
  }

  // 2. 라벨·패턴 수 + 마지막음 카운팅 처리 검증
  function checkLP(pattern, labels, tag){
    if(!pattern || !labels) return;
    const expLen   = getExpectedPatternLength(nd);
    const expLabel = getExpectedLabelCount(nd, pattern.length);
    const bb       = getExpectedBarBeats(nd, pattern);
    const patNotes = nd===8 ? bb*2 : nd===16 ? bb*4 : bb;
    const lastIdx  = pattern.length - 1;

    if(expLen !== null && pattern.length !== expLen)
      errors.push(`패턴${pat.id} ${tag}: noteDiv:${nd} 패턴길이(${pattern.length}) ≠ 기대(${expLen})`);

    if(labels.length !== expLabel)
      errors.push(`패턴${pat.id} ${tag}: 라벨수(${labels.length}) ≠ 기대(${expLabel})`);

    if(patNotes !== lastIdx)
      errors.push(`패턴${pat.id} ${tag}: 패턴내재생음(${patNotes}) ≠ 마지막음인덱스(${lastIdx}) — 카운팅처리 불일치`);
    else
      ok.push(`패턴${pat.id} ${tag}: noteDiv:${nd} ✓ (총${pattern.length}음, 패턴${patNotes}+카운팅1, 라벨${labels.length}, barBeats=${bb})`);
  }

  checkLP(pat.pattern5, pat.engLabels5, 'p5/eng');
  checkLP(pat.pattern5, pat.korLabels5, 'p5/kor');
  checkLP(pat.pattern7, pat.engLabels7, 'p7/eng');
  checkLP(pat.pattern7, pat.korLabels7, 'p7/kor');
  if(pat.warmup1){ checkLP(pat.warmup1.pattern||pat.warmup1.offsets?.map((_,i)=>i+1), pat.warmup1.engLabels, 'wu1/eng'); checkLP(pat.warmup1.pattern||pat.warmup1.offsets?.map((_,i)=>i+1), pat.warmup1.korLabels, 'wu1/kor'); }
  if(pat.warmup2){ checkLP(pat.warmup2.pattern||pat.warmup2.offsets?.map((_,i)=>i+1), pat.warmup2.engLabels, 'wu2/eng'); checkLP(pat.warmup2.pattern||pat.warmup2.offsets?.map((_,i)=>i+1), pat.warmup2.korLabels, 'wu2/kor'); }

  // 3. 16beat visNoteIdx 매핑 검증
  if(nd===16){
    const labelCount = 9;
    const vis = [];
    for(let step=0; step<4; step++)
      for(let q=0; q<4; q++){
        const ni = step*4+q;
        vis.push(ni < labelCount ? ni : ni-(labelCount-1));
      }
    const got = vis.join(',');
    const exp = '0,1,2,3,4,5,6,7,8,1,2,3,4,5,6,7';
    if(got === exp) ok.push(`패턴${pat.id} 16beat visNoteIdx ✓ [${got}] + 카운팅에서 라벨8`);
    else errors.push(`패턴${pat.id} 16beat visNoteIdx ✗ got:[${got}] exp:[${exp}]`);
  }
});

// ── 결과 출력 ──
console.log(`=== ✅ OK (${ok.length}개) ===`);
ok.forEach(m => console.log('  ' + m));
console.log(`\n=== ❌ ERRORS (${errors.length}개) ===`);
if(errors.length === 0) console.log('  없음 — 모든 검사 통과!');
else errors.forEach(m => console.log('  ' + m));

process.exit(errors.length > 0 ? 1 : 0);
