# 소미쌤 앱 — 완료된 작업 (누적 기록)

> 끝난 작업의 요약 이력. "이거 이미 했나?" 확인용. 규칙=`WORK_GUIDE.md`, 순서=`ROADMAP.md`.
> 상세 설계가 필요한 건: 등록대장=`등록대장_설계도.md`, 통합=`HANDOVER.md`, 도장=`stamp_adjuster.html`.

---

## 1단계 — 통합 정리 (2026-06)
- **작업1** 리듬 userGain(사용자 볼륨) 추가 [2026-06-24] — 호흡 기준으로 리듬에 마스터 볼륨단 이식.
- **작업2** 휴식반 호흡·리듬 신방식 통일 [2026-06-24] — `_getProfileClass`·`_getRestStartDate`를 공용 loadData로.
- **STEP H** 날짜 유령함수 정리 [2026-06-24] — breath·rhythm 죽은 `toDateStr` 삭제, home·student는 공용+폴백. 공용=common_core 모듈 U(`window.toDateStr`).
- **STEP I** 로딩 UI 통합 [2026-06-27] — 로딩 오버레이 CSS·HTML·JS를 7페이지 복붙→common_core 모듈 V 1벌. 스피너 안쪽 아이콘(`./icon-192.png` 하이픈 유지), 단계 텍스트, home hide 시작. 잠복버그 `_readSyncTs` 자기참조 무한재귀 동반 수정(`const _readSyncTs = window._readSyncTs`).

## 2단계 — 배포 직전 (2026-06-27)
- **실시간 단일세션(F-2)** — 새 기기 로그인 시 옛 기기 즉시 로그아웃. student getDoc→onSnapshot 보강.
  진짜 원인은 index였음(학생명단 로컬캐시라 Firebase 준비 전 로그인 시 서버토큰 저장 누락) → "서버 저장 완료 대기(_saved 루프)" 추가로 해결. 기기 2대 실검증 + 깃허브 반영.

## F그룹 세션 — 선생님 모드 UI 정리 + 날짜 공통화 [2026-06-30]
- 학생 페이지 2×2 좌우분할, 선생님 학생상세 "그날만" 표시 + 1024px 좌우분할, 선생님 모드 폭 규격 정리
- 학생관리탭 디테일(전체학생 2줄, 통계 비율축소, 레슨시작일 스티커, 토글 2열그리드)
- **날짜입력 숫자키보드화** → common_core 공통함수 3종(parseNumericDate/makeNumericDateInput/attachNumericDate). 적용 4곳
- 패턴관리탭: '초기화'→'−', 전체선택 체크박스, Shift클릭 onchange→onclick, 버튼 통일

## 7월 최우선 — 등록대장·회차 시스템 [2026-07-07~08]
> 상세 설계: `등록대장_설계도.md`.
- **등록대장(somi_ledger.html)** 독립 파일 — 매출·매입, 계좌B 세무자료(계좌흔적0), 최신순 정렬(normDate 형식통일), 첫사용일 오늘 프리필, 회차 특수(직접입력), 계좌별 증빙기본값(A=미발급, B=현금영수증), 내보내기 기간 기본=전월, 파일명 `솜씨_`, 매출·매입 월별 분리 네비.
- **레슨완 회차 카운팅** — 4/8회·마지막 빨강·당일결석 회색. 기존학생 baseline 삭제, 이월 수동.
- **★등록대장 안전장치(3중, 돈 데이터 유실 방지)** — 서버백업(`somi-ledger-v1` 앱), 병합저장(`mergeLedger` id기준·createdAt 큰쪽), 삭제기록장(`somi_ledger_deleted`). `initLedgerSync()`가 로드 시 서버·로컬 병합. 유실 5종 시뮬 통과. ⚠️교체 후 재입력 기기에서 등록대장 1회 열어야 첫 서버백업.

## F그룹 후속 [2026-07-08]
- **A. 기기 중복저장** — 원인=매 로그인 새 token 발급. 영구 `getDeviceUid()` 도입, deviceUid 기준 판정(index·home). ⚠️기존 중복은 기기관리탭에서 1회 수동정리.
- **B. 도장 미세조정·클릭영역** — STAMP_LAYOUT 2026-07-07 값 최신. 도장 클릭영역 버그 수정(도장 실제 위치만 히트박스, 렌더 위치는 안 건드림).
- **C. 연습기록 동기화** — common_core `_mergeLogsToServer`(학생별 서버 병합저장, 유실방지). B-1: 선생 학생상세 열 때 `_refreshStudentLogs`로 그 학생 기록 서버 재조회.

## 공지·발성UI·E정리 세션 [2026-07-08 오후]

### D. 전체 공지 기능
- **데이터** `somi_notice` = 목록형 배열. 항목 `{id,text,active,endDate,createdAt}`. 여러 개 지원.
- **common_core 모듈 N**: `somiGetActiveNotices`(active·종료일 필터), `somiNoticeBannerHTML`(핑크 배너), `somiEscapeHtml`, `SOMI_NOTICE_PINK`(색 공용 상수).
- **학생홈 배너**: 홈 최상단, 핑크 단색(`📢 공지 [내용]`, '공지'는 볼드/내용 일반), 여러 개 세로로 쌓임, split 레이아웃에서 `has-notice`로 맨위 전체폭.
- **선생님 홈(학생관리 탭)**: 입력칸(1줄+자동확장) + 종료일(기본 오늘+1, 지난날짜 게시 시 경고) + [공지 추가]. 아래 목록에서 각 공지 [수정]·[내리기/올리기]·[삭제]. 게시 중인 공지는 핑크 배경.
- **수신 KEYS**: student 3경로(ALWAYS/LIVE/ALL)에 `somi_notice` 추가, home KEYS 2곳 추가.

### 발성 UI 정리 (vocal_lab.html · _male.html 둘 다)
- **다크모드 비활성 발음 밝게**: 라벨박스 비활성 글자 `#5a5048`→`#9a8f82`.
- **음버튼 그리드 폭을 라벨박스에 통일**: `.somi-keygrid`·`.key-grid-wrap` `480px`→`364px`. 기본모드 rowsWrap `382px`(화살표14+gap4+364).
- **기본모드 상/하행 버튼 폭 통일**: flex→grid 균등분할(`.somi-basicrow`, `repeat(_maxCols,1fr)`). 상행 다 쓰고 하행은 마지막 칸 비움. 콘텐츠 무관하게 폭 동일.

### E-② Shift클릭 범위선택 공통화
- **common_core `somiRangeIndices(total,fromIdx,toIdx)`** — 범위 [lo..hi] 순수 계산(무효면 null).
- **두 표 ID방식 통일**: 패턴표(`_lastCheckedPmId`)·레벨표(`_lastCheckedLvId`) 둘 다 패턴ID로 마지막클릭 기억. 레벨표 옛 순번(`lastCheckedIdx`) 제거.
- **테두리**: 레벨표 체크박스 `.lv-checkbox`에 포커스 outline 제거(패턴표와 동일).

### E-③ 드롭박스 공통화
- **common_core `somiAttachDropdown(button,menu)`** — 열고닫기·상호배타·바깥닫기 뼈대 공용.
- **적용 3곳**: 계좌·반 선택···· 메뉴(pm-dropdown 방식). **레벨 드롭다운(lv-menu-open)은 독립 유지**(상표 다르고 표 안 여러 개·z-index 다름 → 합치면 위험).

### 스크롤 공통함수
- **common_core `somiScrollTop(smooth)`** — 화면/탭 전환 시 맨 위로.
- **common_core `somiPreserveScroll(fn)`** — 재렌더 동안 스크롤 자리 유지(재렌더 전 위치 저장→복원).
- **적용**: 선생홈 학생상세 열 때 맨위(`showStudentDetail`), 계좌·반·리베/시창·생일 선택 재렌더 시 자리유지(`rebuildRowsKeepScroll`).

---

## 검증 관례 (참고)
- 공통화 작업은 반드시 node 실행 시뮬 1회(정적 검사만으론 무한재귀 등 못 잡음 — WORK_GUIDE §3).
- 문법은 `node --check`로 메인 인라인 스크립트 전체 검사(작은 블록만 보면 검은화면 놓침).
- 발성 수정 후 `node vocal_lab_pattern_check.js` 여·남 각 1회.

---

# ═══ 과거 통합 작업 상세 (기존 HANDOVER.md에서 흡수, 2026-06) ═══

## STEP A~G — 데이터·동기화 공통화 [완료]
저장/불러오기·감시명단·동기화·연습기록을 common_core.js로 모음.
잡은 버그: 발성 여↔남 누락 4종, 무한재귀(발성 멈춤), 리듬 출석부 깨짐, 비브라토 "기본" 오기록, 자동완료 화면시간 불일치.

### common_core.js 모듈 목록 (손대지 말 것)
- **S** 감시명단 / **D** 저장·불러오기(saveData/loadData) / **Y** 동기화(_mergeLogs·_readSyncTs)
- **A** 세로강제(SomiPortraitGuard, 자동작동, `.disable()`/`.enable()` 존재 — 영상 가로화면용)
- **Z** 연습기록(_appendPracticeLog) / **U** 날짜(toDateStr, STEP H) / **V** 로딩 오버레이(somiShowLoading 등, STEP I)
- **N** 공지(somiGetActiveNotices 등, 2026-07-08) + 공통함수(somiAttachDropdown·somiRangeIndices·somiScrollTop·somiPreserveScroll)

### 건강 기준점 (이 셋 통과면 건강)
`node practice_log_system_check.js` 문제 0 / 발성 패턴점검 ERROR 0 / 발성 여↔남 diff 182줄(음역대+7·성별만).

## STEP L — 휴식반 통일 구조 사실 (질문 대비)
- **읽는 창구(loadData)는 공통** = common_core 한 곳만 고치면 3페이지 반영.
- **휴식반 단계 동작 규칙(자동잠금·안개·디데이)은 페이지마다 독립.** 규칙 바꾸려면 호흡·리듬·발성여·남 4파일 다 고침(의도된 독립 = 오류 전파 방지).

## 실시간 단일세션 (F-2) [완료 2026-06-27] — 구조 사실
- student: `onSnapshot` 실시간 감시(`_startSessionWatch`) + `getDoc` 복귀 보조망. 이탈·로그아웃 시 unsubscribe.
- 빗장(`_loggingOut`+`_forceLogout`)으로 안내창 1회 보장.
- 진짜 원인은 index였음: 학생명단 로컬캐시라 Firebase 준비 전 로그인 시 서버토큰 저장 건너뜀 → index에 "서버 저장 완료 대기(_saved 루프)" 추가.
- ⚠️ iOS 웹앱은 백그라운드 시 OS가 앱을 얼려 onSnapshot 멈출 수 있음 → 복귀 getDoc 보조망이 잡음(정상 범위).

## 아이콘 파일명 — [확정] 하이픈 있음이 정답
- 사장님 실제 폴더/라이브 서버의 진짜 파일명은 `icon-180.png`·`icon-192.png`·`icon-512.png`로 **전부 하이픈 있음**.
  모든 코드 참조(manifest·apple-touch-icon·스피너)는 하이픈 있는 이름. **절대 하이픈 빼지 말 것.**
- ⚠️ 함정: Claude 작업환경의 `/mnt/project` 사본은 파일명이 하이픈 **없이**(`icon192.png`) 들어올 때가 있음.
  이 사본을 "진실"로 믿고 하이픈 빼면 틀림. 진실 기준은 사장님 실제 폴더(=라이브).
- ※ 이 노티는 로드맵 미해결 "아이콘 누락"과 연결 — 학생 웹앱 아이콘 안 뜨면 참조가 하이픈 없이 잘못됐는지부터 확인.

## 배포 체크리스트 (기기 2대)
- **업로드 전:** vocal_lab_pattern_check 발성2종 ERROR0 / practice_log_system_check 문제0 / node --check common_core / 무한재귀 없음(본문 떼어 실행) / saveData·loadData 공용1벌+폴백 / 깃발 범위(NO_SERVER=index, NO_SERVER_KEYS=student) / PWA캐시 버전표식.
- **업로드 후:** 로그인·다기기명단·명단축소방지 / 깨진데이터 방어 / 테마·도장·접속기록 / 휴식반 단계잠금·안개·디데이 / 단일세션(F-2) / Firebase 건강성.
- **페이지 안 열림:** 코드 의심 전 캐시 자가진단 — 시크릿창 정상이면 캐시문제, 다른 기기서도 안 열리면 코드문제(favicon404 무시).

## 핵심 구조 (완료, 손대지 말 것)
- **연습 4페이지(호흡·리듬·발성여·남)는 함께 움직인다.** 공통기능은 리듬에도 있어야 함(userGain이 예). 발성 전용(compressor·pianoGain)만 의도된 차이.
- **발성 여↔남:** 의도 차이는 음역대(여=남+7)·성별뿐(diff 182줄). 새 발성 작업은 여·남 동시 + diff 확인.
- **저장:** 공용 saveData/loadData 1벌(모듈D)+폴백. 서버차단 `__SOMI_NO_SERVER`(index)/`__SOMI_NO_SERVER_KEYS`(student). 선생도장 `__SOMI_IS_TEACHER`(home).
- **감시명단 6종:** somi_pattern_locks·pattern_levels·level_settings·class_settings·rest_start_dates·teacher_stamps.
- **연습기록:** `_appendPracticeLog(profileId,chapter,exercise,duration)` 공용1벌. 중복방지=`__SOMI_LOGGED_THIS_RUN`. 각 페이지 logPractice는 chapter·exercise 조립만.
- **발성 패턴키:** somi_vocal_patterns(여)/_male(남). 발성 소유, 선생 읽기만. 통합 안 함.

## 추후 검토 (미결)
- 옛 연습기록 긴이름→짧은이름 일괄변환 여부(배포 시, 변환 시 somi_logs 백업).
- Firebase 건강성 재점검(배포 시 기기 2대).
