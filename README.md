# 연차 관리 시스템 (Leave Request Management System)

Next.js와 Supabase 기반의 역할 기반(직원/팀장) 연차 신청 및 결재 관리 시스템입니다.

## 🌟 주요 기능

### 1. 역할 기반 접근 제어 (Role-based Access Control)
- **직원 (Employee)**:
  - 본인 연차 신청 (날짜 선택 및 사유 입력)
  - 내 신청 내역 조회 및 상태(대기 / 승인 / 반려) 확인
- **팀장 (Team Leader)**:
  - 전체 부서원의 연차 신청 내역 조회
  - 대기 건에 대한 승인 / 반려 원클릭 결재
  - 월별 연차 현황 달력 (승인: 초록색 / 대기: 노란색) 및 반려 목록 독립 관리
- **미인가 사용자**:
  - `members` 목록에 등록되지 않은 사용자의 접근 자동 차단 및 안내 문구 표시

### 2. 인증 및 계정 관리
- 이메일/비밀번호 기반 로그인 및 회원가입 (이름, 소속 부서 입력 지원)
- 비밀번호 찾기(재설정 메일 발송) 및 비밀번호 변경 기능

### 3. 디자인 시스템 (DESIGN.md 기반)
- **컬러 팔레트**: House Green (`#1E3932`), Green Accent (`#00754A`), Neutral Warm Cream (`#f2f0eb`)
- **타이포그래피**: Pretendard 웹폰트 (자간 `-0.01em`)
- **UI 컴포넌트**: 50px 알약형 버튼 (`rounded-full`), 12px 카드 반경, 위스퍼 섀도우

## 🛠️ 기술 스택

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend / Database**: [Supabase](https://supabase.com/) (Auth, PostgreSQL, Row Level Security)
- **Icons**: Lucide React

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example`을 복사하여 `.env.local` 파일을 생성하고 Supabase 프로젝트 정보를 입력합니다:
```bash
cp .env.example .env.local
```
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속합니다.
