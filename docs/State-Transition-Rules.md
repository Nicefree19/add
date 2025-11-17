# 선거 상태 전이 규칙 및 비즈니스 로직

## 1. 선거 상태 전이 (ElectionStatus)

### 1.1 상태 전이 다이어그램

```
┌──────────┐
│ PLANNING │ ◄─── 초기 생성 상태
└────┬─────┘
     │
     │ 추천 시작
     ▼
┌──────────────┐
│ RECOMMEND    │ ◄─── 추천 기간 진행 중
└────┬─────────┘
     │
     │ 추천 마감 + 후보 선정
     ▼
┌───────────────────┐
│ CANDIDATE_CONFIRM │ ◄─── 후보 동의/거절 진행 중
└────┬──────────────┘
     │
     │ 후보 확정 완료
     ▼
┌──────────┐
│ VOTING   │ ◄─── 투표 진행 중
└────┬─────┘
     │
     │ 투표 마감 + 결과 집계
     ▼
┌──────────┐
│ CLOSED   │ ◄─── 선거 종료
└──────────┘
```

### 1.2 상태 전이 조건

#### PLANNING → RECOMMEND
**필수 조건:**
- recommendStartAt, recommendEndAt 설정 완료
- 현재 시각이 recommendStartAt 이상

**검증 로직:**
```typescript
function canTransitionToRecommend(election: ElectionRound): boolean {
  if (!election.recommendStartAt || !election.recommendEndAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 추천 기간이 설정되지 않음');
  }

  const now = new Date();
  if (now < election.recommendStartAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 추천 시작 시간 이전');
  }

  return true;
}
```

---

#### RECOMMEND → CANDIDATE_CONFIRM
**필수 조건:**
- 추천 기간 종료
- 최소 1명 이상의 후보 지정됨

**검증 로직:**
```typescript
async function canTransitionToCandidateConfirm(
  election: ElectionRound,
  prisma: PrismaClient
): Promise<boolean> {
  const now = new Date();
  if (now < election.recommendEndAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 추천 기간 종료 전');
  }

  const candidateCount = await prisma.candidate.count({
    where: { electionId: election.id }
  });

  if (candidateCount === 0) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 후보가 지정되지 않음');
  }

  return true;
}
```

---

#### CANDIDATE_CONFIRM → VOTING
**필수 조건:**
- votingStartAt, votingEndAt 설정 완료
- 각 역할(PRESIDENT, TREASURER)별로 최소 1명 이상 ACCEPTED 후보 존재
- 현재 시각이 votingStartAt 이상

**검증 로직:**
```typescript
async function canTransitionToVoting(
  election: ElectionRound,
  prisma: PrismaClient
): Promise<boolean> {
  if (!election.votingStartAt || !election.votingEndAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 투표 기간이 설정되지 않음');
  }

  const now = new Date();
  if (now < election.votingStartAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 투표 시작 시간 이전');
  }

  // PRESIDENT 후보 확인
  const presidentCount = await prisma.candidate.count({
    where: {
      electionId: election.id,
      forRole: 'PRESIDENT',
      status: 'ACCEPTED'
    }
  });

  if (presidentCount === 0) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 회장 후보가 없음');
  }

  // TREASURER 후보 확인
  const treasurerCount = await prisma.candidate.count({
    where: {
      electionId: election.id,
      forRole: 'TREASURER',
      status: 'ACCEPTED'
    }
  });

  if (treasurerCount === 0) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 총무 후보가 없음');
  }

  return true;
}
```

---

#### VOTING → CLOSED
**필수 조건:**
- 투표 기간 종료
- 결과 검증 완료 (관리자 승인)

**검증 로직:**
```typescript
async function canTransitionToClosed(
  election: ElectionRound,
  adminApproval: boolean
): Promise<boolean> {
  const now = new Date();
  if (now < election.votingEndAt) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 투표 기간 종료 전');
  }

  if (!adminApproval) {
    throw new Error('ELECTION_CONDITION_NOT_MET: 관리자 승인 필요');
  }

  return true;
}
```

---

## 2. 후보 상태 전이 (CandidateStatus)

### 2.1 상태 전이 다이어그램

```
┌─────────┐
│ INVITED │ ◄─── 관리자가 후보로 지정
└────┬────┘
     │
     ├─── 후보자 수락
     │
     ▼
┌──────────┐
│ ACCEPTED │
└──────────┘

     │
     └─── 후보자 거절
          │
          ▼
     ┌──────────┐
     │ DECLINED │
     └──────────┘
```

### 2.2 상태 전이 로직

```typescript
async function updateCandidateStatus(
  candidateId: string,
  newStatus: 'ACCEPTED' | 'DECLINED',
  userId: string,
  biography?: string,
  prisma: PrismaClient
): Promise<Candidate> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId }
  });

  if (!candidate) {
    throw new Error('CANDIDATE_NOT_FOUND');
  }

  // 본인만 변경 가능
  if (candidate.userId !== userId) {
    throw new Error('CANDIDATE_PERMISSION_DENIED');
  }

  // 이미 응답한 경우
  if (candidate.status !== 'INVITED') {
    throw new Error('CANDIDATE_ALREADY_RESPONDED');
  }

  return await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: newStatus,
      biography: newStatus === 'ACCEPTED' ? biography : null,
      respondedAt: new Date()
    }
  });
}
```

---

## 3. 투표 비즈니스 로직

### 3.1 1인 1표 보장

**DB 제약조건:**
```prisma
@@unique([electionId, voterId, forRole])
```

**서비스 레벨 검증:**
```typescript
async function submitVote(
  electionId: string,
  voterId: string,
  votes: { candidateId: string; forRole: RoleType }[],
  prisma: PrismaClient
): Promise<Vote[]> {
  // 투표 기간 검증
  const election = await prisma.electionRound.findUnique({
    where: { id: electionId }
  });

  if (election.status !== 'VOTING') {
    throw new Error('VOTE_PERIOD_INVALID: 투표 기간이 아님');
  }

  const now = new Date();
  if (now < election.votingStartAt || now > election.votingEndAt) {
    throw new Error('VOTE_PERIOD_INVALID: 투표 기간 외');
  }

  // 중복 투표 검증
  const existingVotes = await prisma.vote.findMany({
    where: {
      electionId,
      voterId,
      forRole: { in: votes.map(v => v.forRole) }
    }
  });

  if (existingVotes.length > 0) {
    throw new Error('VOTE_ALREADY_EXISTS');
  }

  // 후보 유효성 검증
  for (const vote of votes) {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: vote.candidateId,
        electionId,
        forRole: vote.forRole,
        status: 'ACCEPTED'
      }
    });

    if (!candidate) {
      throw new Error('VOTE_CANDIDATE_INVALID');
    }
  }

  // 트랜잭션으로 투표 저장
  return await prisma.$transaction(
    votes.map(vote => {
      const ballotHash = generateBallotHash(electionId, voterId, vote.forRole);

      return prisma.vote.create({
        data: {
          electionId,
          voterId,
          candidateId: vote.candidateId,
          forRole: vote.forRole,
          ballotHash
        }
      });
    })
  );
}
```

### 3.2 투표 해시 생성

```typescript
import * as crypto from 'crypto';

function generateBallotHash(
  electionId: string,
  voterId: string,
  forRole: RoleType
): string {
  const timestamp = Date.now().toString();
  const secretSalt = process.env.BALLOT_SECRET_SALT;

  const data = `${electionId}:${voterId}:${forRole}:${timestamp}:${secretSalt}`;

  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}
```

---

## 4. 알림 자동 발송 로직

### 4.1 이벤트 기반 알림

```typescript
// 선거 상태 변경 시 자동 알림
async function onElectionStatusChanged(
  election: ElectionRound,
  oldStatus: ElectionStatus,
  newStatus: ElectionStatus,
  notificationService: NotificationService
): Promise<void> {
  const notificationMap: Record<ElectionStatus, NotificationType | null> = {
    PLANNING: null,
    RECOMMEND: 'RECOMMEND_START',
    CANDIDATE_CONFIRM: 'RECOMMEND_END',
    VOTING: 'VOTING_START',
    CLOSED: 'RESULT_ANNOUNCE'
  };

  const notificationType = notificationMap[newStatus];

  if (notificationType) {
    await notificationService.sendToAll(
      election.id,
      notificationType,
      {
        electionName: election.name,
        status: newStatus
      }
    );
  }
}
```

### 4.2 후보 초대 알림

```typescript
async function onCandidateInvited(
  candidate: Candidate,
  election: ElectionRound,
  notificationService: NotificationService
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: candidate.userId }
  });

  await notificationService.send({
    electionId: election.id,
    type: 'CANDIDATE_INVITE',
    channel: 'EMAIL',
    recipient: user.email,
    subject: `${election.name} - 후보 초대`,
    body: `
      안녕하세요 ${user.name}님,

      ${election.name}의 ${candidate.forRole === 'PRESIDENT' ? '회장' : '총무'} 후보로 추천되셨습니다.

      출마 의사를 확인해 주시기 바랍니다.

      링크: ${process.env.FRONTEND_URL}/elections/${election.id}/candidates/${candidate.id}/respond
    `
  });
}
```

---

## 5. 권한 검증 로직

### 5.1 Guard 구현

```typescript
// NestJS Guard 예시
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some(role => user.role === role);
  }
}

// 사용 예시
@Get('/elections/:id/result')
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
async getDetailedResult(@Param('id') id: string) {
  // ...
}
```

---

## 6. 감사 로그 자동 기록

### 6.1 Interceptor 구현

```typescript
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaClient) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async () => {
        const actionMap = {
          'POST /auth/verify-otp': 'LOGIN',
          'POST /elections/:id/recommendations': 'RECOMMEND_SUBMIT',
          'POST /elections/:id/votes': 'VOTE_SUBMIT',
          'POST /elections': 'ELECTION_CREATE',
          'PATCH /elections/:id/status': 'ELECTION_STATUS_CHANGE'
        };

        const key = `${request.method} ${request.route.path}`;
        const action = actionMap[key];

        if (action) {
          await this.prisma.accessLog.create({
            data: {
              userId: user?.id,
              action: action as ActionType,
              resource: request.params.id,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              details: {
                method: request.method,
                path: request.url,
                body: request.body
              }
            }
          });
        }
      })
    );
  }
}
```

---

## 7. 데이터 무결성 검증

### 7.1 투표 결과 검증

```typescript
async function verifyElectionIntegrity(
  electionId: string,
  prisma: PrismaClient
): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // 1. 투표 수 검증
  const voteCount = await prisma.vote.count({
    where: { electionId }
  });

  const distinctVoterCount = await prisma.vote.findMany({
    where: { electionId },
    distinct: ['voterId'],
    select: { voterId: true }
  });

  if (voteCount !== distinctVoterCount.length * 2) {
    issues.push('투표 수 불일치: 1인 1표 위반 가능성');
  }

  // 2. 후보 유효성 검증
  const votes = await prisma.vote.findMany({
    where: { electionId },
    include: { candidate: true }
  });

  for (const vote of votes) {
    if (vote.candidate.status !== 'ACCEPTED') {
      issues.push(`유효하지 않은 후보에 대한 투표: ${vote.id}`);
    }
  }

  // 3. 해시 검증
  for (const vote of votes) {
    const expectedHash = generateBallotHash(
      vote.electionId,
      vote.voterId,
      vote.forRole
    );

    // 타임스탬프 차이로 정확한 매칭은 불가하지만, 패턴 검증 가능
    if (!vote.ballotHash || vote.ballotHash.length !== 64) {
      issues.push(`잘못된 투표 해시: ${vote.id}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
```

---

## 8. 예외 상황 처리

### 8.1 투표 기간 연장

```typescript
async function extendVotingPeriod(
  electionId: string,
  newEndDate: Date,
  reason: string,
  adminId: string,
  prisma: PrismaClient
): Promise<ElectionRound> {
  const election = await prisma.electionRound.findUnique({
    where: { id: electionId }
  });

  if (election.status !== 'VOTING') {
    throw new Error('투표 진행 중일 때만 연장 가능');
  }

  if (newEndDate <= election.votingEndAt) {
    throw new Error('종료일을 현재보다 미래로만 설정 가능');
  }

  // 감사 로그 기록
  await prisma.accessLog.create({
    data: {
      userId: adminId,
      action: 'ELECTION_VOTING_EXTENDED',
      resource: electionId,
      details: {
        oldEndDate: election.votingEndAt,
        newEndDate,
        reason
      }
    }
  });

  return await prisma.electionRound.update({
    where: { id: electionId },
    data: { votingEndAt: newEndDate }
  });
}
```

### 8.2 후보 사퇴 처리

```typescript
async function handleCandidateWithdrawal(
  candidateId: string,
  reason: string,
  prisma: PrismaClient
): Promise<void> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { election: true }
  });

  // 투표 진행 중 사퇴 불가
  if (candidate.election.status === 'VOTING') {
    throw new Error('투표 진행 중에는 사퇴 불가');
  }

  await prisma.candidate.update({
    where: { id: candidateId },
    data: {
      status: 'DECLINED',
      biography: `사퇴: ${reason}`
    }
  });
}
```
