/**
 * 액세스 로그 액션 타입
 */
export enum AccessLogAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE_ELECTION = 'CREATE_ELECTION',
  UPDATE_ELECTION = 'UPDATE_ELECTION',
  DELETE_ELECTION = 'DELETE_ELECTION',
  CHANGE_ELECTION_STATUS = 'CHANGE_ELECTION_STATUS',
  CREATE_RECOMMENDATION = 'CREATE_RECOMMENDATION',
  INVITE_CANDIDATE = 'INVITE_CANDIDATE',
  ACCEPT_CANDIDACY = 'ACCEPT_CANDIDACY',
  DECLINE_CANDIDACY = 'DECLINE_CANDIDACY',
  DELETE_CANDIDATE = 'DELETE_CANDIDATE',
  VOTE = 'VOTE',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  UPLOAD_DOCUMENT = 'UPLOAD_DOCUMENT',
  DELETE_DOCUMENT = 'DELETE_DOCUMENT',
  VIEW_RESULTS = 'VIEW_RESULTS',
  EXPORT_DATA = 'EXPORT_DATA',
}

/**
 * 액세스 로그 정보
 */
export interface AccessLog {
  id: string;
  userId: string;
  action: AccessLogAction;
  resource: string | null;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    employeeNo: string;
    role: string;
  };
}

/**
 * 로그 목록 조회 응답
 */
export interface AccessLogListResponse {
  items: AccessLog[];
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
 * 로그 필터 파라미터
 */
export interface AccessLogFilterParams {
  page?: number;
  limit?: number;
  action?: AccessLogAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
