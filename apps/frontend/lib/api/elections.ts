import { apiClient, ApiResponse } from './client';
import {
  Election,
  ElectionListResponse,
  Candidate,
  CreateRecommendationDto,
  Recommendation,
  CreateVoteDto,
  VoteStatusResponse,
  ResultSummaryResponse,
  ResultDetailResponse,
} from '@/types/election';

/**
 * 선거 목록 조회
 */
export async function getElections(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ElectionListResponse> {
  const response = await apiClient.get<ApiResponse<ElectionListResponse>>(
    '/elections',
    { params }
  );
  return response.data.data!;
}

/**
 * 선거 상세 조회
 */
export async function getElection(id: string): Promise<Election> {
  const response = await apiClient.get<ApiResponse<Election>>(`/elections/${id}`);
  return response.data.data!;
}

/**
 * 후보 목록 조회 (ACCEPTED만)
 */
export async function getCandidates(electionId: string): Promise<Candidate[]> {
  const response = await apiClient.get<ApiResponse<Candidate[]>>(
    `/elections/${electionId}/candidates`
  );
  return response.data.data!;
}

/**
 * 후보 추천
 */
export async function createRecommendation(
  electionId: string,
  data: CreateRecommendationDto
): Promise<Recommendation> {
  const response = await apiClient.post<ApiResponse<Recommendation>>(
    `/elections/${electionId}/recommendations`,
    data
  );
  return response.data.data!;
}

/**
 * 투표 상태 조회
 */
export async function getVoteStatus(
  electionId: string
): Promise<VoteStatusResponse> {
  const response = await apiClient.get<ApiResponse<VoteStatusResponse>>(
    `/elections/${electionId}/vote-status`
  );
  return response.data.data!;
}

/**
 * 투표 생성
 */
export async function createVotes(
  electionId: string,
  data: CreateVoteDto
): Promise<{ message: string; votedRoles: string[] }> {
  const response = await apiClient.post<
    ApiResponse<{ message: string; votedRoles: string[] }>
  >(`/elections/${electionId}/votes`, data);
  return response.data.data!;
}

/**
 * 결과 요약 조회 (모든 회원)
 */
export async function getResultSummary(
  electionId: string
): Promise<ResultSummaryResponse> {
  const response = await apiClient.get<ApiResponse<ResultSummaryResponse>>(
    `/elections/${electionId}/result-summary`
  );
  return response.data.data!;
}

/**
 * 상세 결과 조회 (관리자/감사 전용)
 */
export async function getResultDetail(
  electionId: string
): Promise<ResultDetailResponse> {
  const response = await apiClient.get<ApiResponse<ResultDetailResponse>>(
    `/elections/${electionId}/result`
  );
  return response.data.data!;
}

/**
 * 인수인계 문서 목록 조회
 */
export async function getTransitionDocs(electionId: string): Promise<any> {
  const response = await apiClient.get<ApiResponse<any>>(
    `/elections/${electionId}/transition-docs`
  );
  return response.data.data!;
}
