import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { GetTransactionsQueryDto, GetSummaryQueryDto } from './dto';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
} from '../common';

/**
 * Finance Controller
 *
 * 사우회 재무 관리 API
 */
@ApiTags('Finance')
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * 계좌 목록 조회
   *
   * GET /finance/accounts
   *
   * 권한: ADMIN, AUDITOR (조회), MEMBER (조회만)
   */
  @Get('accounts')
  @ApiOperation({ summary: '계좌 목록 조회' })
  async getAccounts() {
    return this.financeService.getAccounts();
  }

  /**
   * 거래내역 조회 (필터링, 페이지네이션)
   *
   * GET /finance/transactions
   *
   * 권한: ADMIN, AUDITOR (조회), MEMBER (조회만)
   */
  @Get('transactions')
  @ApiOperation({ summary: '거래내역 조회 (필터링, 페이지네이션)' })
  async getTransactions(@Query() query: GetTransactionsQueryDto) {
    return this.financeService.getTransactions(query);
  }

  /**
   * 요약 통계 조회 (차트 데이터 포함)
   *
   * GET /finance/summary
   *
   * 권한: ADMIN, AUDITOR (조회), MEMBER (조회만)
   */
  @Get('summary')
  @ApiOperation({ summary: '요약 통계 조회 (차트 데이터 포함)' })
  async getSummary(@Query() query: GetSummaryQueryDto) {
    return this.financeService.getSummary(query);
  }
}
