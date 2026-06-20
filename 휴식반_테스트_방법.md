# 휴식반(숨고르기) 단계 테스트 방법

휴식반은 진입일로부터 **1개월 / 2~3개월 / 4개월차+** 세 단계로 패턴이 자동으로 열리고 잠깁니다.
원래대로면 3달을 기다려야 다음 단계가 보이지만, **진입일을 과거 날짜로 바꿔치기**하면 즉시 확인할 수 있습니다.

판정 기준:
- 진입일로부터 **1개월 미만** → 1개월차(month1)
- **1~3개월** → 2~3개월차(month2to3)
- **3개월 이상** → 4개월차+(month4plus)

---

## ⭐ 추천: 방법 A — 브라우저 콘솔에 한 줄 (코드 수정 0, 가장 안전)

PC 크롬/엣지에서 선생님 화면을 연 상태로 진행합니다.

### 준비
1. 테스트할 학생을 **숨고르기(휴식반)로 먼저 설정**해 둡니다. (그래야 진입일이 생깁니다)
2. 키보드 **F12** → 상단 탭에서 **Console(콘솔)** 선택

### 단계별 명령어 (아래를 콘솔에 붙여넣고 Enter)

#### ① 지금 등록된 휴식 진입일 전부 확인
```js
JSON.parse(localStorage.getItem('somi_rest_start_dates')||'{}')
```
출력 예시: `{ "1718...": "2026-06-20" }` ← 왼쪽이 학생 id, 오른쪽이 진입일

#### ② "2~3개월차" 단계 보기 — 진입일을 2개월 전으로
```js
(()=>{const r=JSON.parse(localStorage.getItem('somi_rest_start_dates')||'{}');const d=new Date();d.setMonth(d.getMonth()-2);const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');Object.keys(r).forEach(id=>r[id]=s);localStorage.setItem('somi_rest_start_dates',JSON.stringify(r));console.log('모든 휴식 학생 진입일을 '+s+' 로 변경. 학생 페이지를 새로고침하세요.');})()
```

#### ③ "4개월차+" 단계 보기 — 진입일을 4개월 전으로
```js
(()=>{const r=JSON.parse(localStorage.getItem('somi_rest_start_dates')||'{}');const d=new Date();d.setMonth(d.getMonth()-4);const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');Object.keys(r).forEach(id=>r[id]=s);localStorage.setItem('somi_rest_start_dates',JSON.stringify(r));console.log('모든 휴식 학생 진입일을 '+s+' 로 변경. 학생 페이지를 새로고침하세요.');})()
```

#### ④ 원상복구 — 진입일을 오늘로 되돌리기 (테스트 끝나면 꼭 실행)
```js
(()=>{const r=JSON.parse(localStorage.getItem('somi_rest_start_dates')||'{}');const d=new Date();const s=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');Object.keys(r).forEach(id=>r[id]=s);localStorage.setItem('somi_rest_start_dates',JSON.stringify(r));console.log('모든 휴식 학생 진입일을 오늘('+s+')로 되돌림.');})()
```

### 확인하는 법
- 명령 실행 후, **그 학생으로 로그인한 학생 페이지(호흡/발성/리듬)를 새로고침**하면 해당 단계에 맞게 패턴이 열리고/잠겨 있는지 볼 수 있습니다.
- 한 학생만 따로 바꾸고 싶으면 ②③④의 `Object.keys(r).forEach(...)` 대신
  `r['학생id']='2026-04-20'` 처럼 직접 id를 지정하면 됩니다. (id는 ①에서 확인)

### ⚠️ 주의
- 이 명령은 **콘솔을 연 그 기기의 로컬 데이터**만 바꿉니다. Firebase에는 학생이 저장 동작을 할 때 반영될 수 있으니, **실제 학생 데이터로 테스트하지 말고 테스트용 더미 학생**으로 하는 걸 권합니다.
- 테스트가 끝나면 **반드시 ④로 되돌리거나**, 그 학생의 반을 휴식반에서 원래대로 바꿔 진입일을 정리하세요.

---

## 방법 B — 폰에서도 되는 임시 버튼 (편하지만 코드 수정 필요)

폰만 쓰고 F12 콘솔을 못 여는 경우, 선생님 설정 화면에 "휴식 진입일 N개월 당기기" 임시 버튼을 달 수 있습니다.
- 장점: 폰에서 탭만으로 테스트
- 단점: 임시 코드라 테스트 후 제거해야 하고, 실수로 진짜 학생 날짜를 바꿀 위험
- 필요하면 이 버튼을 **테스터 학생에게만 보이도록** 안전장치를 넣어 추가해 드릴 수 있습니다. 원하시면 말씀해 주세요.

---

## 방법 C — 기기 날짜를 미래로 (❌ 비추천)

폰/PC 시스템 시계를 3달 뒤로 돌리면 단계가 넘어가지만, 그 사이 저장되는 **모든 연습기록·출석 날짜가 미래로 오염**됩니다. 실데이터에서는 절대 쓰지 마세요.
