# Backend API - 보조 모듈

선거 시스템의 보조 기능을 제공하는 모듈들입니다.

## 📦 모듈 구조

```
src/
├── common/              # 공통 레이어 (응답 포맷, 에러 처리, Guards)
├── prisma/              # Prisma Database Service
├── notification/        # 알림 발송 및 로그 관리
├── transition/          # 인수인계 문서 관리
├── audit/               # 접근 로그 및 감사 추적
└── admin/               # 관리자 대시보드 및 통계
```

---

## 🔔 NotificationModule

알림 발송 및 로그 관리 기능을 제공합니다.

### API Endpoints

#### 1. 알림 발송 (ADMIN)

```http
POST /notifications/send
Authorization: Bearer {token}

{
  "userIds": ["user-id-1", "user-id-2"],
  "type": "ELECTION_START",
  "title": "선거가 시작되었습니다",
  "message": "2024년 사우회 임원 선거가 시작되었습니다.",
  "metadata": {
    "electionId": "election-123"
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "notifications": [...]
  }
}
```

#### 2. 알림 로그 조회 (ADMIN/AUDITOR)

```http
GET /notifications/logs?userId=user-123&type=ELECTION_START&page=1&limit=20
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif-1",
        "userId": "user-123",
        "type": "ELECTION_START",
        "title": "선거가 시작되었습니다",
        "message": "...",
        "isRead": false,
        "sentAt": "2024-01-15T10:00:00Z",
        "user": {
          "id": "user-123",
          "name": "홍길동",
          "email": "hong@example.com"
        }
      }
    ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### 3. 내 알림 목록

```http
GET /notifications/me?page=1&limit=20
Authorization: Bearer {token}
```

#### 4. 알림 읽음 처리

```http
PATCH /notifications/{id}/read
Authorization: Bearer {token}
```

#### 5. 모든 알림 읽음 처리

```http
PATCH /notifications/read-all
Authorization: Bearer {token}
```

---

## 📄 TransitionModule

임원 인수인계 문서 관리 기능을 제공합니다.

### API Endpoints

#### 1. 인수인계 문서 생성 (ADMIN)

```http
POST /elections/{electionId}/transition-docs
Authorization: Bearer {token}

{
  "fromUserId": "user-previous",
  "toUserId": "user-new",
  "forRole": "PRESIDENT",
  "title": "회장 인수인계 문서",
  "content": "# 인수인계 내용\n\n1. 업무 현황\n2. 주요 안건...",
  "attachments": [
    {
      "fileName": "document.pdf",
      "fileUrl": "https://storage.example.com/docs/doc.pdf",
      "fileSize": 1024000
    }
  ]
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "transition-1",
    "electionId": "election-123",
    "fromUser": {
      "id": "user-previous",
      "name": "이전 회장",
      "employeeNo": "EMP001"
    },
    "toUser": {
      "id": "user-new",
      "name": "신임 회장",
      "employeeNo": "EMP002"
    },
    "forRole": "PRESIDENT",
    "title": "회장 인수인계 문서",
    "content": "...",
    "attachments": [...],
    "isCompleted": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 2. 선거별 인수인계 문서 목록 (ADMIN/AUDITOR)

```http
GET /elections/{electionId}/transition-docs
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "election": {
      "id": "election-123",
      "name": "2024년 임원 선거",
      "status": "COMPLETED"
    },
    "docs": [
      {
        "id": "transition-1",
        "fromUser": {...},
        "toUser": {...},
        "forRole": "PRESIDENT",
        "title": "회장 인수인계",
        "isCompleted": true,
        "completedAt": "2024-01-20T15:00:00Z"
      }
    ],
    "summary": {
      "total": 5,
      "completed": 3,
      "pending": 2
    }
  }
}
```

#### 3. 특정 인수인계 문서 조회

```http
GET /elections/transition-docs/{docId}
Authorization: Bearer {token}
```

#### 4. 인수인계 완료 상태 업데이트 (ADMIN)

```http
PATCH /elections/transition-docs/{docId}/status
Authorization: Bearer {token}

{
  "isCompleted": true
}
```

#### 5. 내가 관련된 인수인계 문서

```http
GET /elections/transition-docs/me
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "asFrom": [
      {
        "id": "transition-1",
        "toUser": {...},
        "forRole": "PRESIDENT",
        "isCompleted": true
      }
    ],
    "asTo": [
      {
        "id": "transition-2",
        "fromUser": {...},
        "forRole": "VICE_PRESIDENT",
        "isCompleted": false
      }
    ],
    "summary": {
      "total": 2,
      "asFromCount": 1,
      "asToCount": 1,
      "completedCount": 1
    }
  }
}
```

---

## 🔍 AuditModule

시스템 접근 로그 및 감사 추적 기능을 제공합니다.

### Service Functions

AuditService는 컨트롤러 없이 서비스 함수만 제공하며, 다른 모듈에서 호출하여 사용합니다.

#### 주요 함수

```typescript
// 일반 로그 기록
await auditService.log({
  userId: 'user-123',
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  action: 'CUSTOM_ACTION',
  resource: 'resource-id',
  metadata: { key: 'value' },
  statusCode: 200,
});

// 로그인 기록
await auditService.logLogin(userId, ipAddress, userAgent, true);

// 투표 기록
await auditService.logVote(userId, electionId, candidateId, ipAddress, userAgent);

// 추천 기록
await auditService.logRecommend(userId, electionId, candidateId, ipAddress, userAgent);

// 후보 등록 기록
await auditService.logCandidateRegistration(userId, electionId, role, ipAddress, userAgent);

// 선거 생성 기록
await auditService.logElectionCreate(userId, electionId, ipAddress, userAgent);

// 선거 상태 변경 기록
await auditService.logElectionStatusChange(
  userId,
  electionId,
  'VOTING',
  'COMPLETED',
  ipAddress,
  userAgent,
);
```

#### 로그 조회

```typescript
// 접근 로그 조회 (페이지네이션)
const logs = await auditService.getAccessLogs({
  userId: 'user-123',
  action: 'VOTE',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  page: 1,
  limit: 50,
});

// 접근 로그 통계
const stats = await auditService.getAccessLogStats(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);
```

**통계 응답 예시:**
```json
{
  "totalLogs": 1500,
  "byAction": [
    { "action": "LOGIN", "count": 300 },
    { "action": "VOTE", "count": 500 },
    { "action": "RECOMMEND", "count": 200 }
  ],
  "topUsers": [
    { "userId": "user-1", "count": 150 },
    { "userId": "user-2", "count": 120 }
  ]
}
```

---

## 📊 AdminModule

관리자 대시보드 및 시스템 전체 통계를 제공합니다.

### API Endpoints

#### 1. 관리자 대시보드 (전체 요약)

```http
GET /admin/dashboard
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 140,
      "inactive": 10,
      "byRole": [
        { "role": "MEMBER", "count": 140 },
        { "role": "ADMIN", "count": 10 }
      ]
    },
    "elections": {
      "total": 5,
      "byStatus": [
        { "status": "COMPLETED", "count": 3 },
        { "status": "VOTING", "count": 1 },
        { "status": "DRAFT", "count": 1 }
      ],
      "latest": {
        "id": "election-5",
        "name": "2024년 임원 선거",
        "status": "VOTING",
        "votingStartDate": "2024-01-15T00:00:00Z",
        "votingEndDate": "2024-01-22T23:59:59Z"
      }
    },
    "votes": {
      "total": 500,
      "byRole": [
        { "role": "PRESIDENT", "count": 100 },
        { "role": "VICE_PRESIDENT", "count": 100 }
      ],
      "recentElection": {
        "electionId": "election-5",
        "electionName": "2024년 임원 선거",
        "totalVotes": 350,
        "totalUsers": 140,
        "participationRate": 50.0,
        "byRole": [
          { "role": "PRESIDENT", "count": 70, "rate": 50.0 }
        ]
      }
    },
    "recommendations": {
      "total": 300,
      "byRole": [...]
    },
    "candidates": {
      "total": 25,
      "byStatus": [...],
      "byRole": [...]
    },
    "recentActivity": {
      "recentVotes": [...],
      "recentRecommendations": [...],
      "recentCandidates": [...]
    }
  }
}
```

#### 2. 개별 통계 조회

```http
GET /admin/stats/users
GET /admin/stats/elections
GET /admin/stats/votes
GET /admin/stats/recommendations
GET /admin/stats/candidates
Authorization: Bearer {token}
```

#### 3. 선거별 상세 통계

```http
GET /admin/elections/{electionId}/stats
Authorization: Bearer {token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "election": {
      "id": "election-123",
      "name": "2024년 임원 선거",
      "status": "COMPLETED"
    },
    "summary": {
      "totalVotes": 350,
      "totalRecommendations": 200,
      "totalCandidates": 15,
      "totalUsers": 140,
      "participationRate": 50.0
    },
    "votesByRole": [
      {
        "role": "PRESIDENT",
        "count": 70,
        "rate": 50.0
      }
    ],
    "candidates": [
      {
        "id": "candidate-1",
        "user": {
          "id": "user-123",
          "name": "홍길동",
          "employeeNo": "EMP001",
          "department": "개발팀"
        },
        "forRole": "PRESIDENT",
        "voteCount": 45,
        "recommendationCount": 20
      }
    ]
  }
}
```

---

## 🔧 사용 예시

### NotificationModule 사용

```typescript
import { NotificationService } from './notification';

@Injectable()
export class ElectionService {
  constructor(private notificationService: NotificationService) {}

  async startElection(electionId: string) {
    // 선거 시작 처리
    // ...

    // 모든 활성 사용자에게 알림
    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    await this.notificationService.sendNotification({
      userIds: activeUsers.map(u => u.id),
      type: 'ELECTION_START',
      title: '선거가 시작되었습니다',
      message: '투표에 참여해주세요.',
      metadata: { electionId },
    });
  }
}
```

### AuditModule 사용

```typescript
import { AuditService } from './audit';

@Injectable()
export class VoteService {
  constructor(private auditService: AuditService) {}

  async createVote(userId: string, dto: CreateVoteDto, req: Request) {
    // 투표 생성
    const vote = await this.prisma.vote.create({ data: dto });

    // 감사 로그 기록
    await this.auditService.logVote(
      userId,
      dto.electionId,
      dto.candidateId,
      req.ip,
      req.headers['user-agent'],
    );

    return vote;
  }
}
```

---

## 📝 TODO

### NotificationModule
- [ ] 실제 이메일 발송 구현 (nodemailer, SendGrid 등)
- [ ] SMS 발송 구현
- [ ] 푸시 알림 구현
- [ ] 알림 템플릿 시스템

### TransitionModule
- [ ] 파일 업로드 구현 (S3, MinIO 등)
- [ ] 파일 다운로드 API
- [ ] 버전 관리 기능

### AuditModule
- [ ] 로그 export 기능 (CSV, Excel)
- [ ] 실시간 모니터링 대시보드
- [ ] 이상 행동 탐지

### AdminModule
- [ ] 시각화 차트 데이터 최적화
- [ ] 실시간 통계 업데이트 (WebSocket)
- [ ] Export 기능 (PDF, Excel)

---

## 🚀 다음 단계

1. **NestJS 프로젝트 초기화** (package.json, main.ts)
2. **AuthModule 구현** (JWT, OTP)
3. **UserModule 구현** (사용자 CRUD)
4. **ElectionModule 구현** (선거 관리)
5. **통합 테스트**
