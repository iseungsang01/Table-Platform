import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null,
    React.createElement(App)
  )
);
```

---

## 🚀 주요 변경 사항

### 1. **2단계 프로세스**
- **1단계**: 전화번호 입력 → 고객 조회
- **2단계**: 고객 정보 확인 → 방문 확인 버튼

### 2. **표시되는 고객 정보**
- 👤 닉네임
- 🎂 생일
- 📞 전화번호
- 📊 총 방문 횟수

### 3. **사용자 플로우**
```
```
전화번호 입력 
    ↓
[고객 조회] 버튼 클릭
    ↓
고객 정보 표시 (닉네임, 생일 등)
    ↓
[방문 확인] 버튼 클릭
    ↓
방문 기록 생성 + 방문 횟수 +1
    ↓
성공 메시지 표시 + 폼 초기화
```