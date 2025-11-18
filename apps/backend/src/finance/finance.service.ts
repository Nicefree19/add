import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetTransactionsQueryDto, GetSummaryQueryDto, GroupBy } from './dto';
import { Prisma } from '@prisma/client';

/**
 * Finance Service
 *
 * 사우회 재무 관리 (계좌, 거래내역, 정산)
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 계좌 목록 조회
   */
  async getAccounts() {
    const accounts = await this.prisma.account.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    // 각 계좌별 실제 잔액 계산 (거래내역 기반)
    const accountsWithBalances = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await this.prisma.transaction.findMany({
          where: {
            accountId: account.id,
            deletedAt: null,
          },
        });

        const actualBalance = transactions.reduce((sum, tx) => {
          const amount = Number(tx.amount);
          return tx.type === 'INCOME' ? sum + amount : sum - amount;
        }, 0);

        return {
          ...account,
          balance: account.balance.toString(),
          actualBalance,
          transactionCount: account._count.transactions,
        };
      }),
    );

    return accountsWithBalances;
  }

  /**
   * 거래내역 조회 (필터링, 페이지네이션)
   */
  async getTransactions(query: GetTransactionsQueryDto) {
    const {
      from,
      to,
      type,
      accountId,
      termId,
      category,
      search,
      page = 1,
      pageSize = 50,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    // WHERE 조건 구성
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null, // 소프트 삭제되지 않은 것만
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    if (type) {
      where.type = type;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    if (termId) {
      where.termId = termId;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // 정렬 기준
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'amount') {
      orderBy.amount = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    }

    // 페이지네이션
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 병렬 쿼리 실행
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              bankCode: true,
              accountNumber: true,
            },
          },
          term: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              employeeNo: true,
            },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // 금액을 문자열로 변환 (Decimal 처리)
    const formattedTransactions = transactions.map((tx) => ({
      ...tx,
      amount: tx.amount.toString(),
    }));

    return {
      data: formattedTransactions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 요약 통계 조회 (차트 데이터 포함)
   */
  async getSummary(query: GetSummaryQueryDto) {
    const { from, to, termId, groupBy, year } = query;

    // WHERE 조건 구성
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null,
    };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    if (termId) {
      where.termId = termId;
    }

    if (year) {
      const yearNum = parseInt(year);
      where.date = {
        gte: new Date(`${yearNum}-01-01`),
        lte: new Date(`${yearNum}-12-31`),
      };
    }

    // 전체 거래내역 조회
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            bankCode: true,
          },
        },
      },
    });

    // 기본 통계 계산
    const totalIncome = transactions
      .filter((tx) => tx.type === 'INCOME')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpense = transactions
      .filter((tx) => tx.type === 'EXPENSE')
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const netAmount = totalIncome - totalExpense;

    // 카테고리별 통계
    const byCategory = transactions.reduce((acc, tx) => {
      if (!acc[tx.category]) {
        acc[tx.category] = { income: 0, expense: 0, count: 0 };
      }
      if (tx.type === 'INCOME') {
        acc[tx.category].income += Number(tx.amount);
      } else {
        acc[tx.category].expense += Number(tx.amount);
      }
      acc[tx.category].count++;
      return acc;
    }, {} as Record<string, { income: number; expense: number; count: number }>);

    // 그룹화 데이터 (차트용)
    let chartData: any[] = [];

    if (groupBy === GroupBy.MONTH) {
      // 월별 그룹화
      const byMonth = transactions.reduce((acc, tx) => {
        const month = tx.date.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { income: 0, expense: 0 };
        }
        if (tx.type === 'INCOME') {
          acc[month].income += Number(tx.amount);
        } else {
          acc[month].expense += Number(tx.amount);
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      chartData = Object.entries(byMonth)
        .map(([month, data]) => ({
          period: month,
          income: data.income,
          expense: data.expense,
          net: data.income - data.expense,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } else if (groupBy === GroupBy.YEAR) {
      // 연도별 그룹화
      const byYear = transactions.reduce((acc, tx) => {
        const year = tx.date.getFullYear().toString();
        if (!acc[year]) {
          acc[year] = { income: 0, expense: 0 };
        }
        if (tx.type === 'INCOME') {
          acc[year].income += Number(tx.amount);
        } else {
          acc[year].expense += Number(tx.amount);
        }
        return acc;
      }, {} as Record<string, { income: number; expense: number }>);

      chartData = Object.entries(byYear)
        .map(([year, data]) => ({
          period: year,
          income: data.income,
          expense: data.expense,
          net: data.income - data.expense,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } else if (groupBy === GroupBy.CATEGORY) {
      // 카테고리별
      chartData = Object.entries(byCategory).map(([category, data]) => ({
        category,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
        count: data.count,
      }));
    }

    return {
      summary: {
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount: transactions.length,
      },
      byCategory,
      chartData,
    };
  }
}
