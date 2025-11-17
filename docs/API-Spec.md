# API 상세 명세서

## 공통 규칙

### Base URL
```
/api/v1
```

### 인증
```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### 응답 형식

**성공:**
```json
{
  "success": true,
  "data": { ... }
}
```

**실패:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  }
}
```

### 에러 코드 체계
- `AUTH_*`: 인증 관련 (예: `AUTH_INVALID_OTP`)
- `VOTE_*`: 투표 관련 (예: `VOTE_ALREADY_EXISTS`)
- `ELECTION_*`: 선거 관련 (예: `ELECTION_NOT_FOUND`)
- `PERMISSION_*`: 권한 관련 (예: `PERMISSION_DENIED`)

---

## 1. 인증 (Auth)

### 1.1 OTP 요청

**Endpoint:** `POST /auth/request-otp`

**Request:**
```json
{
  "employeeNo": "2024001",
  "email": "user@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to user@company.com",
    "expiresIn": 600
  }
}
```

**Errors:**
- `AUTH_USER_NOT_FOUND`: 사용자 없음
- `AUTH_ACCOUNT_INACTIVE`: 계정 비활성화
- `AUTH_OTP_SEND_FAILED`: OTP 전송 실패

---

### 1.2 OTP 검증 및 로그인

**Endpoint:** `POST /auth/verify-otp`

**Request:**
```json
{
  "employeeNo": "2024001",
  "email": "user@company.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "user": {
      "id": "cm123...",
      "employeeNo": "2024001",
      "name": "홍길동",
      "email": "user@company.com",
      "department": "개발팀",
      "role": "MEMBER"
    }
  }
}
```

**Errors:**
- `AUTH_INVALID_OTP`: OTP 불일치
- `AUTH_OTP_EXPIRED`: OTP 만료
- `AUTH_OTP_ALREADY_USED`: OTP 이미 사용됨

---

### 1.3 토큰 갱신

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

---

## 2. 선거 관리 (Elections)

### 2.1 선거 목록 조회

**Endpoint:** `GET /elections`

**Query Parameters:**
- `status`: ElectionStatus (optional)
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "elections": [
      {
        "id": "el_001",
        "name": "2025년 상반기 회장단 선거",
        "status": "VOTING",
        "recommendStartAt": "2025-01-15T00:00:00Z",
        "recommendEndAt": "2025-01-20T23:59:59Z",
        "votingStartAt": "2025-01-25T00:00:00Z",
        "votingEndAt": "2025-01-30T23:59:59Z",
        "createdAt": "2025-01-10T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

### 2.2 선거 생성 (관리자)

**Endpoint:** `POST /elections`

**Permission:** `ADMIN`

**Request:**
```json
{
  "name": "2025년 상반기 회장단 선거",
  "description": "신임 회장 및 총무 선출",
  "recommendStartAt": "2025-01-15T00:00:00Z",
  "recommendEndAt": "2025-01-20T23:59:59Z",
  "votingStartAt": "2025-01-25T00:00:00Z",
  "votingEndAt": "2025-01-30T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "el_001",
    "name": "2025년 상반기 회장단 선거",
    "status": "PLANNING",
    "createdAt": "2025-01-10T00:00:00Z"
  }
}
```

---

### 2.3 선거 상태 변경 (관리자)

**Endpoint:** `PATCH /elections/:id/status`

**Permission:** `ADMIN`

**Request:**
```json
{
  "status": "VOTING"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "el_001",
    "status": "VOTING",
    "updatedAt": "2025-01-25T00:00:00Z"
  }
}
```

**Errors:**
- `ELECTION_INVALID_STATUS_TRANSITION`: 잘못된 상태 전이
- `ELECTION_CONDITION_NOT_MET`: 상태 변경 조건 미충족

---

## 3. 추천 (Recommendations)

### 3.1 추천 제출

**Endpoint:** `POST /elections/:id/recommendations`

**Request:**
```json
{
  "forRole": "PRESIDENT",
  "candidateName": "이동혁",
  "candidateUserId": "user_123",
  "reason": "리더십과 소통 능력이 뛰어남"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "rec_001",
    "electionId": "el_001",
    "forRole": "PRESIDENT",
    "candidateName": "이동혁",
    "createdAt": "2025-01-16T10:00:00Z"
  }
}
```

**Errors:**
- `RECOMMEND_ALREADY_EXISTS`: 이미 추천함
- `RECOMMEND_PERIOD_INVALID`: 추천 기간 아님
- `ELECTION_INVALID_STATUS`: 선거 상태가 RECOMMEND 아님

---

### 3.2 추천 현황 조회 (관리자)

**Endpoint:** `GET /elections/:id/recommendations`

**Permission:** `ADMIN`

**Query Parameters:**
- `forRole`: RoleType (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "PRESIDENT": {
        "totalRecommendations": 85,
        "uniqueCandidates": 12,
        "topCandidates": [
          {
            "candidateName": "이동혁",
            "candidateUserId": "user_123",
            "count": 25,
            "percentage": 29.4
          },
          {
            "candidateName": "박성현",
            "candidateUserId": "user_456",
            "count": 18,
            "percentage": 21.2
          }
        ]
      },
      "TREASURER": {
        "totalRecommendations": 82,
        "uniqueCandidates": 10
      }
    },
    "details": [
      {
        "id": "rec_001",
        "candidateName": "이동혁",
        "recommenderName": "홍길동",
        "reason": "리더십과 소통 능력이 뛰어남",
        "createdAt": "2025-01-16T10:00:00Z"
      }
    ]
  }
}
```

---

## 4. 후보 (Candidates)

### 4.1 후보 목록 조회 (회원용)

**Endpoint:** `GET /elections/:id/candidates`

**Query Parameters:**
- `forRole`: RoleType (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "cand_001",
        "userId": "user_123",
        "userName": "이동혁",
        "department": "개발팀",
        "forRole": "PRESIDENT",
        "status": "ACCEPTED",
        "biography": "소통과 투명성을 중시하는 리더십...",
        "invitedAt": "2025-01-21T00:00:00Z"
      }
    ]
  }
}
```

**Note:** ACCEPTED 상태의 후보만 반환

---

### 4.2 후보 목록 조회 (관리자용)

**Endpoint:** `GET /elections/:id/candidates/admin`

**Permission:** `ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "candidates": [
      {
        "id": "cand_001",
        "userId": "user_123",
        "userName": "이동혁",
        "forRole": "PRESIDENT",
        "status": "ACCEPTED",
        "recommendationCount": 25,
        "invitedAt": "2025-01-21T00:00:00Z",
        "respondedAt": "2025-01-22T10:00:00Z"
      },
      {
        "id": "cand_002",
        "userId": "user_456",
        "userName": "박성현",
        "forRole": "PRESIDENT",
        "status": "INVITED",
        "recommendationCount": 18,
        "invitedAt": "2025-01-21T00:00:00Z",
        "respondedAt": null
      }
    ]
  }
}
```

---

### 4.3 후보 지정 (관리자)

**Endpoint:** `POST /elections/:id/candidates`

**Permission:** `ADMIN`

**Request:**
```json
{
  "userId": "user_123",
  "forRole": "PRESIDENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cand_001",
    "status": "INVITED",
    "invitedAt": "2025-01-21T00:00:00Z"
  }
}
```

---

### 4.4 후보 응답 (수락/거절)

**Endpoint:** `PATCH /candidates/:id/status`

**Request:**
```json
{
  "status": "ACCEPTED",
  "biography": "소통과 투명성을 중시하는 리더십으로..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cand_001",
    "status": "ACCEPTED",
    "respondedAt": "2025-01-22T10:00:00Z"
  }
}
```

**Errors:**
- `CANDIDATE_PERMISSION_DENIED`: 본인이 아닌 후보의 상태 변경 시도
- `CANDIDATE_ALREADY_RESPONDED`: 이미 응답함

---

## 5. 투표 (Votes)

### 5.1 투표 상태 확인

**Endpoint:** `GET /elections/:id/vote-status`

**Response:**
```json
{
  "success": true,
  "data": {
    "electionId": "el_001",
    "votingPeriod": {
      "start": "2025-01-25T00:00:00Z",
      "end": "2025-01-30T23:59:59Z"
    },
    "isVotingPeriod": true,
    "hasVoted": {
      "PRESIDENT": true,
      "TREASURER": false
    }
  }
}
```

---

### 5.2 투표 제출

**Endpoint:** `POST /elections/:id/votes`

**Request:**
```json
{
  "votes": [
    {
      "candidateId": "cand_001",
      "forRole": "PRESIDENT"
    },
    {
      "candidateId": "cand_005",
      "forRole": "TREASURER"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "투표가 성공적으로 제출되었습니다",
    "votedAt": "2025-01-26T14:30:00Z",
    "ballotHashes": {
      "PRESIDENT": "abc123...",
      "TREASURER": "def456..."
    }
  }
}
```

**Errors:**
- `VOTE_ALREADY_EXISTS`: 이미 투표함
- `VOTE_PERIOD_INVALID`: 투표 기간 아님
- `VOTE_CANDIDATE_INVALID`: 유효하지 않은 후보

---

### 5.3 결과 요약 조회 (회원용)

**Endpoint:** `GET /elections/:id/result-summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "electionId": "el_001",
    "status": "CLOSED",
    "resultAnnouncedAt": "2025-01-31T10:00:00Z",
    "winners": {
      "PRESIDENT": {
        "candidateId": "cand_001",
        "userName": "이동혁",
        "department": "개발팀"
      },
      "TREASURER": {
        "candidateId": "cand_005",
        "userName": "문성환",
        "department": "관리팀"
      }
    },
    "voterTurnout": {
      "total": 110,
      "voted": 95,
      "percentage": 86.4
    }
  }
}
```

---

### 5.4 결과 상세 조회 (관리자/감사자)

**Endpoint:** `GET /elections/:id/result`

**Permission:** `ADMIN` or `AUDITOR`

**Response:**
```json
{
  "success": true,
  "data": {
    "electionId": "el_001",
    "status": "CLOSED",
    "results": {
      "PRESIDENT": [
        {
          "candidateId": "cand_001",
          "userName": "이동혁",
          "voteCount": 58,
          "percentage": 61.1
        },
        {
          "candidateId": "cand_002",
          "userName": "박성현",
          "voteCount": 37,
          "percentage": 38.9
        }
      ],
      "TREASURER": [
        {
          "candidateId": "cand_005",
          "userName": "문성환",
          "voteCount": 52,
          "percentage": 54.7
        },
        {
          "candidateId": "cand_006",
          "userName": "권용현",
          "voteCount": 43,
          "percentage": 45.3
        }
      ]
    },
    "statistics": {
      "totalVoters": 110,
      "totalVoted": 95,
      "turnoutRate": 86.4,
      "presidentVotes": 95,
      "treasurerVotes": 95
    }
  }
}
```

---

## 6. 알림 (Notifications)

### 6.1 알림 발송 (관리자)

**Endpoint:** `POST /notifications/send`

**Permission:** `ADMIN`

**Request:**
```json
{
  "electionId": "el_001",
  "type": "VOTING_START",
  "channel": "EMAIL",
  "recipients": "all",
  "subject": "투표가 시작되었습니다",
  "body": "2025년 상반기 회장단 선거 투표가 시작되었습니다..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "notif_001",
    "recipientCount": 110,
    "status": "PENDING"
  }
}
```

---

### 6.2 알림 로그 조회

**Endpoint:** `GET /notifications/logs`

**Permission:** `ADMIN` or `AUDITOR`

**Query Parameters:**
- `electionId`: string (optional)
- `type`: NotificationType (optional)
- `status`: NotificationStatus (optional)
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "notif_001",
        "type": "VOTING_START",
        "channel": "EMAIL",
        "recipient": "user@company.com",
        "status": "SENT",
        "sentAt": "2025-01-25T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 250,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

## 7. 이양 관리 (Transition)

### 7.1 이양 문서 업로드

**Endpoint:** `POST /elections/:id/transition-docs`

**Permission:** `ADMIN`

**Request (multipart/form-data):**
```
title: "회장 인수인계서"
description: "2025년 상반기 인수인계 문서"
file: <binary>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trans_001",
    "title": "회장 인수인계서",
    "fileUrl": "https://storage.company.com/transitions/2025-el001-doc1.pdf",
    "status": "TODO",
    "createdAt": "2025-02-01T10:00:00Z"
  }
}
```

---

### 7.2 이양 문서 목록 조회

**Endpoint:** `GET /elections/:id/transition-docs`

**Permission:** `ADMIN` or `AUDITOR`

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "trans_001",
        "title": "회장 인수인계서",
        "fileUrl": "https://storage.company.com/transitions/2025-el001-doc1.pdf",
        "status": "DONE",
        "createdAt": "2025-02-01T10:00:00Z",
        "updatedAt": "2025-02-05T15:00:00Z"
      }
    ]
  }
}
```

---

### 7.3 이양 상태 변경

**Endpoint:** `PATCH /elections/:id/transition-status`

**Permission:** `ADMIN`

**Request:**
```json
{
  "documentId": "trans_001",
  "status": "DONE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "trans_001",
    "status": "DONE",
    "updatedAt": "2025-02-05T15:00:00Z"
  }
}
```

---

## 8. 감사 로그 (Audit)

### 8.1 로그 조회

**Endpoint:** `GET /audit/logs`

**Permission:** `AUDITOR` or `ADMIN`

**Query Parameters:**
- `userId`: string (optional)
- `action`: ActionType (optional)
- `startDate`: ISO date (optional)
- `endDate`: ISO date (optional)
- `page`: number
- `limit`: number

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_001",
        "userId": "user_123",
        "userName": "홍길동",
        "action": "VOTE_SUBMIT",
        "resource": "el_001",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "details": {
          "forRole": "PRESIDENT",
          "ballotHash": "abc123..."
        },
        "createdAt": "2025-01-26T14:30:00Z"
      }
    ],
    "pagination": {
      "total": 1500,
      "page": 1,
      "limit": 50
    }
  }
}
```

---

## 부록: 에러 코드 전체 목록

### 인증 (AUTH_*)
- `AUTH_INVALID_CREDENTIALS`: 잘못된 인증 정보
- `AUTH_USER_NOT_FOUND`: 사용자 없음
- `AUTH_ACCOUNT_INACTIVE`: 계정 비활성화
- `AUTH_OTP_SEND_FAILED`: OTP 전송 실패
- `AUTH_INVALID_OTP`: OTP 불일치
- `AUTH_OTP_EXPIRED`: OTP 만료
- `AUTH_OTP_ALREADY_USED`: OTP 이미 사용됨
- `AUTH_TOKEN_EXPIRED`: 토큰 만료
- `AUTH_INVALID_TOKEN`: 유효하지 않은 토큰

### 권한 (PERMISSION_*)
- `PERMISSION_DENIED`: 권한 없음
- `PERMISSION_ADMIN_REQUIRED`: 관리자 권한 필요
- `PERMISSION_AUDITOR_REQUIRED`: 감사자 권한 필요

### 선거 (ELECTION_*)
- `ELECTION_NOT_FOUND`: 선거 없음
- `ELECTION_INVALID_STATUS`: 잘못된 선거 상태
- `ELECTION_INVALID_STATUS_TRANSITION`: 잘못된 상태 전이
- `ELECTION_CONDITION_NOT_MET`: 상태 변경 조건 미충족

### 추천 (RECOMMEND_*)
- `RECOMMEND_ALREADY_EXISTS`: 이미 추천함
- `RECOMMEND_PERIOD_INVALID`: 추천 기간 아님
- `RECOMMEND_NOT_FOUND`: 추천 없음

### 후보 (CANDIDATE_*)
- `CANDIDATE_NOT_FOUND`: 후보 없음
- `CANDIDATE_ALREADY_EXISTS`: 이미 후보로 지정됨
- `CANDIDATE_PERMISSION_DENIED`: 후보 권한 없음
- `CANDIDATE_ALREADY_RESPONDED`: 이미 응답함

### 투표 (VOTE_*)
- `VOTE_ALREADY_EXISTS`: 이미 투표함
- `VOTE_PERIOD_INVALID`: 투표 기간 아님
- `VOTE_CANDIDATE_INVALID`: 유효하지 않은 후보
- `VOTE_NOT_FOUND`: 투표 없음

### 파일 (FILE_*)
- `FILE_UPLOAD_FAILED`: 파일 업로드 실패
- `FILE_TOO_LARGE`: 파일 크기 초과
- `FILE_INVALID_TYPE`: 지원하지 않는 파일 형식
