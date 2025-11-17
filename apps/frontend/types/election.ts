/**
 * 선거 상태
 */
export enum ElectionStatus {
  PLANNING = 'PLANNING',           // 기획 중
  RECOMMEND = 'RECOMMEND',         // 추천 진행 중
  CANDIDATE_CONFIRM = 'CANDIDATE_CONFIRM', // 후보 확정 중
  VOTING = 'VOTING',               // 투표 진행 중
  CLOSED = 'CLOSED',               // 종료
}

/**
 * 선거 역할
 */
export enum ElectionRole {
  PRESIDENT = 'PRESIDENT',   // 회장
  TREASURER = 'TREASURER',   // 총무
  AUDITOR = 'AUDITOR',       // 감사
}

/**
 * 선거 정보
 */
export interface Election {
  id: string;
  name: string;
  description: string | null;
  status: ElectionStatus;
  recommendationStartDate: string;
  recommendationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
  maxRecommendations: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  candidateCount?: number;
  recommendationCount?: number;
  voteCount?: number;
}

/**
 * 선거 목록 조회 응답
 */
export interface ElectionListResponse {
  items: Election[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 후보 상태
 */
export enum CandidateStatus {
  INVITED = 'INVITED',     // 초대됨
  ACCEPTED = 'ACCEPTED',   // 수락
  DECLINED = 'DECLINED',   // 거절
}

/**
 * 후보 정보
 */
export interface Candidate {
  id: string;
  userId: string;
  electionId: string;
  forRole: ElectionRole;
  statement: string | null;
  status: CandidateStatus;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    employeeNo: string;
    department: string | null;
    position: string | null;
  };
  recommendationCount?: number;
}

/**
 * 추천 생성 DTO
 */
export interface CreateRecommendationDto {
  forRole: ElectionRole;
  candidateUserId: string;
  reason?: string;
}

/**
 * 추천 정보
 */
export interface Recommendation {
  id: string;
  electionId: string;
  recommenderId: string;
  candidateId: string;
  forRole: ElectionRole;
  comment: string | null;
  createdAt: string;
  recommender: {
    id: string;
    name: string;
    email: string;
    employeeNo: string;
  };
  candidate: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: CandidateStatus;
  };
}

/**
 * 투표 생성 DTO
 */
export interface CreateVoteDto {
  votes: {
    [key in ElectionRole]?: string; // candidateId
  };
}

/**
 * 투표 상태 응답
 */
export interface VoteStatusResponse {
  hasVoted: boolean;
  votedRoles: ElectionRole[];
}

/**
 * 결과 요약 - 역할별
 */
export interface RoleSummary {
  role: ElectionRole;
  winner: {
    candidateId: string;
    userId: string;
    name: string;
    department: string | null;
    position: string | null;
  } | null;
  totalVotes: number;
}

/**
 * 결과 요약 응답
 */
export interface ResultSummaryResponse {
  electionId: string;
  electionName: string;
  status: ElectionStatus;
  totalVoters: number;
  totalVotes: number;
  turnoutRate: number;
  results: RoleSummary[];
}

/**
 * 후보별 득표 결과 (관리자용)
 */
export interface CandidateResult {
  candidateId: string;
  userId: string;
  name: string;
  department: string | null;
  position: string | null;
  forRole: ElectionRole;
  voteCount: number;
  voteRate: number;
  isWinner: boolean;
}

/**
 * 상세 결과 응답 (관리자용)
 */
export interface ResultDetailResponse {
  electionId: string;
  electionName: string;
  status: ElectionStatus;
  totalVoters: number;
  totalVotes: number;
  turnoutRate: number;
  resultsByRole: {
    [key in ElectionRole]?: CandidateResult[];
  };
}
