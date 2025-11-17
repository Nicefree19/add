import { ElectionStatus, ElectionRole } from '@/types/election';

/**
 * 선거 상태를 한글로 변환
 */
export function getElectionStatusText(status: ElectionStatus): string {
  const statusMap: Record<ElectionStatus, string> = {
    [ElectionStatus.PLANNING]: '기획 중',
    [ElectionStatus.RECOMMEND]: '추천 진행 중',
    [ElectionStatus.CANDIDATE_CONFIRM]: '후보 확정 중',
    [ElectionStatus.VOTING]: '투표 진행 중',
    [ElectionStatus.CLOSED]: '종료',
  };
  return statusMap[status];
}

/**
 * 선거 상태에 따른 Badge variant
 */
export function getElectionStatusVariant(
  status: ElectionStatus
): 'default' | 'secondary' | 'success' | 'warning' | 'info' {
  const variantMap: Record<
    ElectionStatus,
    'default' | 'secondary' | 'success' | 'warning' | 'info'
  > = {
    [ElectionStatus.PLANNING]: 'secondary',
    [ElectionStatus.RECOMMEND]: 'info',
    [ElectionStatus.CANDIDATE_CONFIRM]: 'warning',
    [ElectionStatus.VOTING]: 'success',
    [ElectionStatus.CLOSED]: 'default',
  };
  return variantMap[status];
}

/**
 * 역할을 한글로 변환
 */
export function getRoleText(role: ElectionRole): string {
  const roleMap: Record<ElectionRole, string> = {
    [ElectionRole.PRESIDENT]: '회장',
    [ElectionRole.TREASURER]: '총무',
    [ElectionRole.AUDITOR]: '감사',
  };
  return roleMap[role];
}

/**
 * 날짜 포맷팅
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 날짜 시간 포맷팅
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 현재 진행 중인 단계 확인
 */
export function getCurrentPhase(election: {
  status: ElectionStatus;
  recommendationStartDate: string;
  recommendationEndDate: string;
  votingStartDate: string;
  votingEndDate: string;
}): 'before' | 'recommend' | 'wait' | 'voting' | 'closed' {
  const now = new Date();
  const recStart = new Date(election.recommendationStartDate);
  const recEnd = new Date(election.recommendationEndDate);
  const voteStart = new Date(election.votingStartDate);
  const voteEnd = new Date(election.votingEndDate);

  if (election.status === ElectionStatus.CLOSED) return 'closed';
  if (now < recStart) return 'before';
  if (now >= recStart && now <= recEnd) return 'recommend';
  if (now > recEnd && now < voteStart) return 'wait';
  if (now >= voteStart && now <= voteEnd) return 'voting';
  return 'closed';
}
