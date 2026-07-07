# 인수인계 — G그룹 (D+F 통합 정리 + 도장 어댑터 실측 반영)

> 작성: 2026-07-01 세션
> 계보: B(동기화) → D(세션정리·달력규격) → E(좌우분할) → F(선생님모드 UI·날짜공통화) → **G(통합·도장 어댑터 실측)**
> 라이브: https://somissam.github.io/somi_ssam
> 목적: D·F 두 인수인계를 하나로 합치고, 새 대화에서 **도장 자동조정부터** 바로 이어가도록 실측 규격·미해결·설계항목을 한 문서에 정리.

---

## ⚡ 한 줄 상태
선생님 모드 UI·날짜입력 공통화(F)까지 끝났고, **이번 세션에서 `stamp_adjuster.html`(도장 위치 조절 도구)를 실제 student.html 달력 규격과 1:1로 맞춰 다시 만듦.** 다음은 **도장 자동조정 → 새 도장 기능(레슨완 중복찍기·횟수카운팅) 설계 → 미세조정** 순.

---

## ★ 다음 대화에서 바로 할 일 (순서 고정)
> ⚠️ **진전됨(2026-07-02):** 아래 §4의 도장 회차 카운팅·레슨완 중복찍기 설계는 이후 세션에서 **`등록대장_설계도.md`로 통합·확정**되었다(등록 건 기준 회차, 마지막 회차 빨간 도장, 기존학생 기준선, 동시 도장 등). **회차·도장 신규 설계는 이제 `등록대장_설계도.md`가 기준.** 이 문서(G)에 남는 도장 몫은 **위치 미세조정과 학생→선생 반영(§4-1)** 등 아직 안 끝난 것들이다.
1. **도장 자동조정(위치 미세조정)** — `stamp_adjuster.html`로 사장님이 직접 슬라이더 맞춤(왕관 안 숫자·해바라기 줄기·무지개 크기 등). 실측 규격(아래 ★★)이 기준.
2. **학생→선생 도장 반영 확인(§4-1)** — 아직 미해결. 등록대장·회차 작업과 함께 점검.
3. 회차·중복찍기 설계는 `등록대장_설계도.md` 참조(여기서 재설계 금지).

---

## ★ 현재 outputs 파일 상태 (최신본 기준)
| 파일 | 상태 | 비고 |
|---|---|---|
| `stamp_adjuster.html` | **이번 세션 수정** | 미리보기 칸을 실제 `.cal-day` 규격과 1:1로. PNG/SVG 도장 구분 렌더, 선생님 도장 좌상단 미리보기 추가 |
| `stamps.js` | 수정됨(D) | 선생 도장 5종(`star,heart,flower,heartfull,lessondone`), lessondone 2배 렌더 |
| `somi_ssam_home.html` | 수정됨(D·F) | 도장 동기화 5곳 + 비율바 + 달력규격(500상한·cqw) + 선생님모드 UI 정리 + 날짜 공통함수 |
| `somi_ssam_student.html` | 수정됨(F) | 2×2 분할 + 생일 숫자입력. ⚠️D 시점 "오류코드11"은 F에서 정상화된 것으로 보이나 **실기기 재확인 필요** |
| `common_core.js` | 수정됨(F) | 날짜 숫자입력 공통함수 3종 ★home/student/index가 호출 → **반드시 함께 업로드** |
| `index.html` | 수정됨(F) | 생일 입력 공통함수화 |
| `calendar_frame_tool.html` | 보조도구 | 달력 폭·요소 직접 조절용. 앱에 안 들어감 |
| 그 외(breath/rhythm/vocal_lab 등) | 미변경 | |

> ⚠️ 업로드 시 `common_core.js`를 같은 폴더에 반드시 포함. 빠지면 날짜입력 깨지고 검은 화면 가능.

---

## ★★ 도장 어댑터용 실측 규격 (student.html 실제값 — 미세조정의 기준)
도장 미세조정은 이 값들과 **반드시 일치**해야 함. (`somi_ssam_student.html` CSS에서 실측)

- **칸** `.cal-day` : `aspect-ratio:1`, flex 중앙정렬, `border-radius:8px`. 7열 그리드 1/7 폭.
- **날짜숫자** `.date-num` : `font-size:18px`, `font-weight:500`, `z-index:2`, 칸 정중앙.
- **학생도장** `.student-stamp` : `inset:0`(칸 전체) 중앙, **`z-index:0`(숫자 뒤)**.
  - 순수 SVG 도장(무지개): `.student-stamp svg{width:86%; height:86%; opacity:0.55}`
  - **PNG 도장(사과·해바라기·구름·왕관·하트): `getStampSVG`가 `<img width:100%;height:100%>`로 반환 → 칸 100%·불투명.** (※ `.student-stamp img` 규칙이 따로 없음 = 칸 꽉 채움·진하게 보이는 이유)
- **선생님도장** `.teacher-stamp` : `top:-2px; left:-2px; width:52%; height:52%; z-index:3`(좌상단). svg/img `100%!important contain`.
- **연습바** `.practice-bar-wrap` : `bottom:3px; left:4px; right:4px; height:5px; z-index:1`, 세그 gap 1px. 색: 호흡=accent, 발성=accent2, 리듬=accent3.
- **도장 SVG 함수**(`stamps.js`): `getStampSVG(key)` — base64 PNG가 박힌 도장은 `<img>`로 추출 표시(https·Safari 호환), 순수 벡터(rainbow)는 raw 반환. `getTeacherStampSVG(type,size)` — lessondone은 `transform:scale(2)`.

> 어댑터 반영 요점: PNG는 기본 100%·불투명 / 무지개는 86%·0.55. 슬라이더는 이 기본 위에서 비례 미세조정. 선생님 도장은 좌상단 52% 기준.

### 도장 종류
- 학생 6종: `apple, sunflower, cloud, crown, heart`(PNG) + `rainbow`(벡터)
- 선생 5종: `heart, flower, heartfull, lessondone`(PNG) + `star`(벡터)

---

## §4. 새 도장 기능 — 설계 필요 항목
> ⚠️ **2·3번(레슨완 중복찍기·회차 카운팅)은 `등록대장_설계도.md`로 이관·확정됨. 아래는 원래 요청 기록이며, 실제 설계·구현 기준은 등록대장 설계도다.** 1번(학생→선생 반영)은 여전히 여기 소관(미해결).

1. **학생 도장이 선생에게 반영 안 됨(재확인)**
   - D에서 `somi_student_day_stamps` 동기화 5곳 연결은 했음. 그런데 "학생 달력 자체가 선생에게 동기화 안 된다"는 의심이 남음.
   - **핵심 점검:** `somi_teacher_stamps`는 선생→학생으로 내려가는데, **학생 본인 도장/달력(`somi_student_day_stamps`, `somi_logs`)이 선생 쪽으로 올라오는 구조인지** 확인. 달력 규격 작업하면서 이게 같이 반영됐는지도 같이 검증.
   - B그룹(동기화)과 뿌리가 같음. → §5-C와 함께 봐야 함.
2. **레슨완 도장 중복 찍기** — `lessondone`을 나머지 도장과 **동시에 찍기 가능**하게. 두 개가 찍혔을 때 **겹침 위치 설계** 필요(예: 레슨완은 한쪽 모서리 고정, 일반 도장은 중앙). `stamps.js` 항목은 이미 있어 추가 안전(11번류).
3. **레슨완 도장에 레슨횟수 카운팅** — 함께 설계.
   - 주1회 수업: **4회 카운트**, 주2회 수업: **8회 카운트**.
   - 달력에 카운트 표시 방법 + 카운터 저장/리셋 주기(월 단위?) + 주1/주2 구분을 어디서 읽을지(학생 프로필 속성?) 설계.
4. **설계 확정 후 미세조정** 진입.

> 분석 메모: 위 1번(학생 도장 반영)은 B그룹(동기화)과 뿌리가 닿음. `somi_teacher_stamps`는 동기화되는데 학생→선생 방향(`somi_student_day_stamps`/`somi_logs`)이 안 올라오는지 확인 필요. 2번은 데이터 추가라 안전, 3번은 신규 시스템 설계.

---

## §5. 그 외 미해결 (우선순위)
- **A. [설정] 자동로그인 기기 중복저장**(F의 다음작업) — 같은 기기인데 device id 인식 못 해 목록 중복. home.html 기기관리 `device-list` 식별 로직 점검.
- **B. 학생 페이지 안정성** — D에서 "오류코드11"(렌더러 다운) 있었음. F 작업으로 정상화된 정황이나 실기기 재확인 권장. 의심: Firebase 동기화 과부하 vs 렌더 과부하.
- **C. 연습기록 동기화 누락**(B·E 미해결) — 학생 연습(`somi_logs`)이 선생 화면에 누락/지연. §4-1과 함께 점검.
- **D. 전체 공지 기능**(E [작업3], 가장 큰 작업) — 선생 작성 → 학생 카드 위 표시 → Firebase `somi_notice`. 게시/내리기 토글 + 종료일. 선생·학생·Firebase 3곳 수정.
- **E. 리듬패턴 만들기 전 정리** — ①선생님모드 파일/모듈 쪼개기 ②모든 체크박스 Shift+클릭 공통함수화 ③드롭박스 설정 공통함수화 ④발성 "시작위치/음역 선택"이 라벨 박스 가로 넘어가는 것 수정.

---

## §6. 완료 이력 요약 (D+F)
**D그룹:** 선생 도장 3종 추가(flower/heartfull/lessondone, lessondone 2배), 학생 날짜별 도장 선생 반영 동기화(`somi_student_day_stamps` 5곳), 선생 달력에 연습비율 바, 달력 규격(반응형) 설계 확정.
- 달력 규격 사양: 기본 폭400 기준 `{gap:2, numSize:19, sStamp:86, sOpac:55, tStamp:26, barH:5}`, 최대폭 500(가운데정렬), 숫자만 20px 상한. 구현: `container-type:inline-size`+`cqw`. **vw·cqw 직접 폰트지정은 규칙상 지양 → 미디어쿼리 단계로** (F에서 통계숫자 등 적용).

**F그룹:** 학생 2×2 분할, 선생님모드 학생상세 "그날만"·1024 좌우분할, 선생님모드 레이아웃 폭 규격 정리(teacher-tabs 인라인 max-width 제거가 핵심, teacher-content 500→600), 학생관리탭 디테일(전체학생 카드·통계 단계축소·레슨시작일 스티커·토글 좌우분리), **모든 날짜입력 숫자키보드화+공통함수 3종**(`parseNumericDate`/`makeNumericDateInput`/`attachNumericDate`), 패턴관리탭(− 버튼·전체선택·Shift는 onclick으로).

---

## §7. 작업 규칙 메모 (효과 본 것)
- 결과물은 `present_files`로만, 코드 본문 채팅 노출 금지.
- 수정 → 점검(`node vocal_lab_pattern_check.js <파일>`) 1회 → present_files **한 묶음**.
- 문법검사는 메인 인라인 스크립트를 추출해 `node --check`. (작은 블록만 검사하면 큰 인라인 누락 → 오판 사례 있었음)
- 연습 패턴 로직=독립("레시피"), 화면 그릇·전역기능=공통(`common_core.js`).
- MIDI는 음이름과 항상 함께(`48 (C3)`).
- outputs↔project 최신본 비교 후 작업. `common_core.js` 항상 동봉.
