/**
 * 후보 상태
 */
export enum CandidateStatus {
  PENDING = 'PENDING',       // 추천으로 생성됨 (아직 초대 전)
  INVITED = 'INVITED',       // 관리자가 후보로 초대함
  ACCEPTED = 'ACCEPTED',     // 후보가 수락함
  DECLINED = 'DECLINED',     // 후보가 거절함
  WITHDRAWN = 'WITHDRAWN',   // 후보가 사퇴함
}

/**
 * 선거 역할 (import from recommend module)
 */
export enum ElectionRole {
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SECRETARY = 'SECRETARY',
  TREASURER = 'TREASURER',
  AUDITOR = 'AUDITOR',
}

/**
 * 후보 응답 DTO
 *
 * 후보 정보를 반환할 때 사용
 */
export class CandidateResponseDto {
  id: string;
  userId: string;
  electionId: string;
  forRole: ElectionRole;
  statement: string | null;
  status: CandidateStatus;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;

  // 사용자 정보
  user?: {
    id: string;
    name: string;
    email: string;
    employeeNo: string;
    department: string | null;
    position: string | null;
  };

  // 추천 수 (통계)
  recommendationCount?: number;

  /**
   * Prisma Candidate 객체를 DTO로 변환
   *
   * @param candidate - Prisma Candidate 객체
   * @param electionStatus - 선거 상태 (보안: voteCount는 CLOSED 상태에서만 공개)
   */
  static fromPrisma(candidate: any, electionStatus?: string): CandidateResponseDto {
    // 보안: 투표 진행 중에는 voteCount를 0으로 숨김 (CLOSED 상태에서만 공개)
    const shouldHideVoteCount = electionStatus && electionStatus !== 'CLOSED';

    return {
      id: candidate.id,
      userId: candidate.userId,
      electionId: candidate.electionId,
      forRole: candidate.forRole as ElectionRole,
      statement: candidate.statement,
      status: candidate.status as CandidateStatus,
      voteCount: shouldHideVoteCount ? 0 : candidate.voteCount,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      user: candidate.user
        ? {
            id: candidate.user.id,
            name: candidate.user.name,
            email: candidate.user.email,
            employeeNo: candidate.user.employeeNo,
            department: candidate.user.department,
            position: candidate.user.position,
          }
        : undefined,
      recommendationCount: candidate._count?.recommendations,
    };
  }

  /**
   * 여러 후보를 변환
   *
   * @param candidates - Prisma Candidate 객체 배열
   * @param electionStatus - 선거 상태 (보안: voteCount는 CLOSED 상태에서만 공개)
   */
  static fromPrismaMany(candidates: any[], electionStatus?: string): CandidateResponseDto[] {
    return candidates.map((candidate) => CandidateResponseDto.fromPrisma(candidate, electionStatus));
  }
}
