import { AccessLogAction } from '@/types/log';

/**
 * 로그 액션 텍스트 변환
 */
export function getActionText(action: AccessLogAction): string {
  const actionMap: Record<AccessLogAction, string> = {
    [AccessLogAction.LOGIN]: '로그인',
    [AccessLogAction.LOGOUT]: '로그아웃',
    [AccessLogAction.CREATE_ELECTION]: '선거 생성',
    [AccessLogAction.UPDATE_ELECTION]: '선거 수정',
    [AccessLogAction.DELETE_ELECTION]: '선거 삭제',
    [AccessLogAction.CHANGE_ELECTION_STATUS]: '선거 상태 변경',
    [AccessLogAction.CREATE_RECOMMENDATION]: '추천 생성',
    [AccessLogAction.INVITE_CANDIDATE]: '후보 초대',
    [AccessLogAction.ACCEPT_CANDIDACY]: '후보 수락',
    [AccessLogAction.DECLINE_CANDIDACY]: '후보 거절',
    [AccessLogAction.DELETE_CANDIDATE]: '후보 삭제',
    [AccessLogAction.VOTE]: '투표',
    [AccessLogAction.SEND_NOTIFICATION]: '알림 발송',
    [AccessLogAction.UPLOAD_DOCUMENT]: '문서 업로드',
    [AccessLogAction.DELETE_DOCUMENT]: '문서 삭제',
    [AccessLogAction.VIEW_RESULTS]: '결과 조회',
    [AccessLogAction.EXPORT_DATA]: '데이터 내보내기',
  };

  return actionMap[action] || action;
}

/**
 * 로그 액션 색상 (Badge variant)
 */
export function getActionVariant(
  action: AccessLogAction
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' {
  if (action === AccessLogAction.LOGIN) return 'success';
  if (action === AccessLogAction.LOGOUT) return 'secondary';
  if (
    action === AccessLogAction.DELETE_ELECTION ||
    action === AccessLogAction.DELETE_CANDIDATE ||
    action === AccessLogAction.DELETE_DOCUMENT
  ) {
    return 'destructive';
  }
  if (
    action === AccessLogAction.CREATE_ELECTION ||
    action === AccessLogAction.CREATE_RECOMMENDATION ||
    action === AccessLogAction.VOTE
  ) {
    return 'info';
  }
  if (
    action === AccessLogAction.UPDATE_ELECTION ||
    action === AccessLogAction.CHANGE_ELECTION_STATUS
  ) {
    return 'warning';
  }
  return 'default';
}
