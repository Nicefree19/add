# TechSpec: 사우회 회장 이양 웹서비스

## 0. 문서 정보

- 문서명: TechSpec – 사우회 회장/총무 선출·이양 웹서비스
- 버전: v1.0
- 최종 수정일: 2025-11-17
- 대상 독자:
  - 백엔드/프론트엔드 개발자
  - 기획자/PO
  - 사우회 운영진/관리자

---

## 1. 프로젝트 개요

### 1.1 목적

사내 사우회의 회장 및 총무 선출 과정을 **웹서비스로 자동화**하고,
다음 전체 라이프사이클을 **투명하고 반복 가능한 절차**로 정착시키는 것이 목표이다.

1. 추천 접수 (회장, 총무 각각 1인 추천)
2. 추천 결과 집계 및 후보군 도출
3. 후보 동의/거절 및 후보 정보 관리
4. 익명 투표
5. 결과 집계 및 공지
6. 회장단 이양(문서, 체크리스트) 관리
7. 로그·이력 아카이빙 및 감사 대응

### 1.2 범위(Scope)

**포함:**

- 사우회 회원 인증/접근 제어 (사번 + 이메일 OTP)
- 선거 회차(Election) 관리
- 추천/후보/투표/결과/이양 프로세스의 엔드투엔드 구현
- 관리자/감사자 대시보드
- 이메일/카카오워크(또는 유사 메신저) 알림 로그 기록

**제외(향후):**

- 사내 SSO(Kerberos/AD/Keycloak) 직접 연동 (2단계)
- 모바일 앱 (WebView/반응형 웹으로 대체)
- 복수 회장단/직책, 다단계 선거 시스템

---

## 2. 전제 및 가정사항

### 2.1 조직 및 사용 규모

- 사우회 회원 수: 약 110명
- 선거/투표 동시 접속자: 최대 50명 내
- 관리자/감사 계정: 최대 5명 내

### 2.2 인증 및 접근

- 1단계 구현:
  - **사번 + 이메일 OTP 기반 로그인**
  - 사용자 기본 정보(이름, 부서, 이메일, 사번)는 사우회 내부에서 미리 등록했다고 가정
- 향후:
  - 사내 SSO(AD/Keycloak 등) 연동 옵션 추가

### 2.3 보안 요구

- 1인 1표 보장
- 투표 익명성 보장(결과 조회 시 개인 식별 불가)
- DB 및 로그 위·변조 방지(감사 로그 및 백업)
- 관리자/감사 권한 분리

---

## 3. 사용자 및 Use Case

### 3.1 주요 사용자(롤)

1. **일반 회원 (UserRole.MEMBER)**
   - 추천 참여
   - 후보 정보 조회
   - 투표 참여
   - 결과 요약 확인

2. **운영자/관리자 (UserRole.ADMIN)**
   - 선거 회차 생성 및 설정
   - 추천/후보/투표 기간 및 상태 제어
   - 추천 현황/후보 확정/결과 검증
   - 이양 문서 및 체크리스트 관리
   - 알림 발송 및 로그 확인

3. **감사자 (UserRole.AUDITOR)**
   - 투표 결과 및 로그 열람(읽기 전용)
   - 감사 목적의 이력 조회

### 3.2 주요 Use Case 요약

1. 회원이 로그인 후 회장/총무 각각 1인을 추천한다.
2. 시스템은 추천 기간 내 추천을 수집하고, 중복 추천을 방지한다.
3. 운영자가 추천 결과를 확인하고, 상위 N명을 후보로 지정한다.
4. 후보에게 "출마 의사 확인" 알림을 보내고, 후보는 동의/거절을 선택한다.
5. 운영자는 동의한 후보들만 확정해 투표 페이지에 노출한다.
6. 투표 기간이 되면 회원들은 로그인을 통해 투표(회장/총무 후보 선택)를 한다.
7. 시스템은 1인 1표를 보장하며, 투표 결과를 집계한다.
8. 운영자/감사자는 결과를 검증 후 공지를 승인한다.
9. 결과 공지와 함께 회장단 이양 문서 및 체크리스트 관리가 진행된다.

---

## 4. 요구사항 정의

### 4.1 기능 요구사항 (Functional Requirements)

#### FR-1. 인증 및 사용자 관리

- FR-1.1: 사용자는 이메일 OTP를 통해 로그인할 수 있어야 한다.
- FR-1.2: OTP는 6자리 숫자 코드, 10분 유효, 1회성 사용이어야 한다.
- FR-1.3: 사용자 계정에는 최소 다음 정보가 포함된다.
  - 사번(employeeNo), 이름(name), 이메일(email), 부서(department), 역할(role)
- FR-1.4: 계정 활성화/비활성화(퇴사 등) 기능을 지원한다(관리자 전용).

#### FR-2. 선거 회차 관리 (ElectionRound)

- FR-2.1: 관리자는 새로운 선거 회차를 생성할 수 있어야 한다.
- FR-2.2: 선거 회차에는 다음 정보가 포함된다.
  - 이름, 설명, 상태(status), 추천 기간, 투표 기간
- FR-2.3: 선거 상태는 다음 중 하나여야 한다.
  - PLANNING, RECOMMEND, CANDIDATE_CONFIRM, VOTING, CLOSED
- FR-2.4: 상태 변경 시 유효한 상태 전이만 허용한다.
  - PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED

#### FR-3. 추천 (Recommendation)

- FR-3.1: 회원은 특정 선거 회차에서 회장/총무 각각 1인을 추천할 수 있다.
- FR-3.2: 추천 시 입력값:
  - 추천 대상 역할(forRole: PRESIDENT/TREASURER)
  - 추천 대상 이름 또는 사번 (candidateName / candidateUserId)
  - 추천 이유(reason)
- FR-3.3: 동일 선거+역할 조합에 대해 한 사용자는 한 번만 추천 가능하다.
- FR-3.4: 관리자는 추천 현황(후보별 추천 수, 이유 요약)을 조회할 수 있다.

#### FR-4. 후보 관리 (Candidate)

- FR-4.1: 관리자는 추천 결과를 기반으로 후보자를 지정할 수 있다(상위 N명).
- FR-4.2: 후보는 사용자(User)와 연결되는 것을 원칙으로 한다.
- FR-4.3: 후보 상태는 INVITED, ACCEPTED, DECLINED 중 하나이다.
- FR-4.4: 시스템은 후보자에게 초대 알림을 보내고, 후보자는 웹에서 동의/거절을 선택한다.
- FR-4.5: 일반 회원에게는 ACCEPTED 상태의 후보만 노출된다.

#### FR-5. 투표 (Vote)

- FR-5.1: 투표는 선거 상태가 VOTING일 때만 가능하다.
- FR-5.2: 회원은 회장/총무 각각 1명을 선택해 투표한다(한 화면에서 동시 선택).
- FR-5.3: 1인 1표 보장:
  - 동일 선거+역할 조합에서 중복 투표가 불가해야 한다.
- FR-5.4: 투표 레코드에는 내부 검증용 `voterId`와 무결성 검증용 `ballotHash`가 포함된다.
- FR-5.5: 일반 회원은 전체 득표 상세 대신 **당선자 및 간단 요약**만 확인한다.
- FR-5.6: 관리자/감사자는 후보별 득표수, 득표율, 투표율 등의 상세 결과를 조회할 수 있다.

#### FR-6. 알림/공지 (Notification)

- FR-6.1: 시스템은 다음 이벤트에서 알림을 발송할 수 있어야 한다.
  - 추천 시작/마감 안내
  - 후보 발표/확정 안내
  - 투표 시작/마감 안내
  - 결과 발표 공지
- FR-6.2: 알림 채널:
  - 이메일, (선택) 카카오워크 Webhook
- FR-6.3: 발송된 알림은 `notification_log`에 저장된다.

#### FR-7. 이양 관리 (Transition)

- FR-7.1: 선거 종료 후, 이양 관련 문서(인수인계서 등)를 업로드할 수 있다.
- FR-7.2: 파일은 스토리지(S3 or 사내 NAS) 경로를 DB에 저장한다.
- FR-7.3: 이양 상태(예: TODO/IN_PROGRESS/DONE)를 관리할 수 있다.

#### FR-8. 감사 및 로그 (Audit / AccessLog)

- FR-8.1: 시스템은 로그인, 추천, 투표, 상태 변경 등 주요 이벤트를 `access_log`에 기록한다.
- FR-8.2: 감사자(AUDITOR)는 로그 및 결과 데이터를 읽기 전용으로 열람할 수 있다.

---

## 5. 비기능 요구사항 (NFR)

- NFR-1 (성능): 110명 규모, 투표 요청 처리 시간 < 500ms(평균)
- NFR-2 (가용성): 선거 기간 동안 서비스 가용성 99.9% 이상
- NFR-3 (보안): 모든 민감 데이터(OTP, 토큰)는 암호화 저장
- NFR-4 (로그): 최소 3년간 선거 결과 및 감사 로그 보관
- NFR-5 (사용성): PC 브라우저 기준 반응형 UI, 모바일에서도 기본 동작 문제없도록

---

## 6. 시스템 아키텍처

### 6.1 기술 스택

- 프론트엔드: Next.js 14 (App Router, TypeScript), React, Tailwind CSS, shadcn/ui
- 백엔드: NestJS (TypeScript), REST API
- ORM: Prisma
- DB: PostgreSQL
- Cache/Rate limit(선택): Redis
- 인증: JWT Access/Refresh Token + 이메일 OTP
- CI/CD: GitHub Actions
- 배포: Docker 기반 (클라우드/온프렘 선택)

### 6.2 모듈 구조 (백엔드)

- AuthModule
- UserModule
- ElectionModule
- RecommendModule
- CandidateModule
- VoteModule
- NotificationModule
- TransitionModule
- AuditLogModule
- AdminModule

---

## 7. 데이터 모델 개요

### 7.1 주요 엔티티

1. `User`
2. `ElectionRound`
3. `Recommendation`
4. `Candidate`
5. `Vote`
6. `NotificationLog`
7. `AccessLog`
8. `TransitionDoc`
9. `OtpToken`

### 7.2 제약조건

- User:
  - `employeeNo` 고유, `email` 고유
- Vote:
  - `UNIQUE (electionId, voterId, forRole)`
- Recommendation:
  - `UNIQUE (electionId, recommenderId, forRole)` (1인 1추천 보장)

> 상세 필드/타입은 `docs/prisma-schema-draft.prisma`에 정의됨

---

## 8. 주요 API 설계

### 8.1 공통 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer <JWT>`
- 응답 형식:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```

### 8.2 Auth

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`

### 8.3 선거 관리

- `GET /elections`
- `POST /elections` (admin)
- `GET /elections/:id`
- `PATCH /elections/:id` (admin)
- `PATCH /elections/:id/status` (admin)

### 8.4 추천

- `POST /elections/:id/recommendations`
- `GET /elections/:id/recommendations` (admin)

### 8.5 후보

- `GET /elections/:id/candidates` (member: ACCEPTED만)
- `GET /elections/:id/candidates/admin` (admin: 전체)
- `POST /elections/:id/candidates` (admin)
- `PATCH /candidates/:id/status`

### 8.6 투표

- `GET /elections/:id/vote-status`
- `POST /elections/:id/votes`
- `GET /elections/:id/result-summary` (member)
- `GET /elections/:id/result` (admin/auditor)

### 8.7 알림

- `POST /notifications/send` (admin)
- `GET /notifications/logs` (admin/auditor)

### 8.8 이양

- `POST /elections/:id/transition-docs` (admin)
- `GET /elections/:id/transition-docs` (admin/auditor)
- `PATCH /elections/:id/transition-status` (admin)

> 상세 API 명세는 `docs/API-Spec.md` 참조

---

## 9. 보안/무결성 설계

### 9.1 익명성

- Vote 테이블에 `voterId`는 저장하지만,
  - 결과 조회 API에서는 개인별 투표 내역 미노출
  - 감사 목적 로그는 `AUDITOR`에게만 제한 제공
- `ballotHash` = hash(electionId + voterId + timestamp + secretSalt)
  → 조작 여부 검증 및 로그 대조에만 사용

### 9.2 1인 1표

- DB Unique 제약조건 + 서비스 레벨 트랜잭션 처리
- 중복 요청 시 에러 `VOTE_ALREADY_EXISTS` 반환

### 9.3 권한 모델

- MEMBER: 내 정보, 추천/투표, 결과 요약 조회
- ADMIN: 선거 설정, 후보/결과/이양/알림 관리
- AUDITOR: 읽기 전용으로 로그/결과 열람

### 9.4 암호화/보호

- OTP/토큰은 해시 혹은 암호화 저장
- 비밀번호는 사용하지 않음(OTP 기반)
- TLS(HTTPS) 필수

---

## 10. 화면/UX 개요

### 10.1 주요 화면

1. 로그인/OTP 인증 화면
2. 메인 대시보드 (현재 진행 중인 선거 상태 표시)
3. 추천 입력 화면
4. 후보 리스트 & 상세 화면
5. 투표 화면
6. 결과 요약 화면
7. 관리자 대시보드 (추천 현황, 후보 관리, 투표 현황, 알림)
8. 이양 문서 관리 화면
9. 감사용 로그 조회 화면

---

## 11. 운영 및 DevOps

- Git 브랜치 전략: main / develop / feature/*
- CI:
  - lint, unit test, integration test, build
- 배포:
  - Docker 이미지 빌드 후 staging → prod 순차 배포
- 백업:
  - DB 일일 백업
  - 로그: 중앙 로그 서버 or S3에 주간 단위 롤링

---

## 12. 테스트 전략

- Unit Test:
  - 도메인 서비스 로직 (추천/투표/상태 전이)
- Integration Test:
  - 주요 API 플로우 (추천→후보확정→투표→결과)
- E2E Test:
  - 실제 유저 시나리오 기반(Playwright or Cypress)

---

## 13. 향후 확장

- SSO 연동
- 다선거/다직책 동시 운영
- 모바일 앱(또는 PWA) 도입
- 사내 포털/그룹웨어 연동

---

## 14. 오픈 이슈

- OTP 전송 채널: 사내 메일 서버 또는 외부 SMTP?
- 카카오워크 Webhook 사용 가능 여부(보안 정책)
- 선거 결과 공개 범위(득표율까지 공개 여부)에 대한 사내 합의 필요

---

## 부록: 관련 문서

- `docs/prisma-schema-draft.prisma`: 데이터베이스 스키마 상세
- `docs/API-Spec.md`: API 엔드포인트 상세 명세
- `docs/State-Transition-Rules.md`: 상태 전이 로직 및 비즈니스 규칙
- `docs/TechSpec-Review-Summary.md`: 스펙 검토 및 개선 제안
