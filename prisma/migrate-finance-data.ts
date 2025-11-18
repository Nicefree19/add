import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface JsonAccount {
  account_number?: string;
  description: string;
  balance: number;
  is_closed?: boolean;
}

interface JsonTransaction {
  date: string;
  amount: number;
  description: string;
  bank: 'shinhan_bank' | 'kakao_bank';
  is_safe_box: boolean;
  depositor_name?: string;
  type: 'income' | 'expense';
  category: string;
  balance_after?: number;
  is_internal_transfer: boolean;
  detailed_category?: string;
}

interface JsonData {
  accounts: {
    kakao_bank: JsonAccount;
    safe_box: JsonAccount;
    shinhan_bank: JsonAccount;
  };
  summary: {
    total_income: number;
    total_expense: number;
    total_interest: number;
    kakao_balance: number;
    safebox_balance: number;
    total_balance: number;
    total_transactions: number;
    internal_transfers: number;
  };
  transactions: JsonTransaction[];
}

// 계좌 매핑
const accountIdMap: Record<string, string> = {
  kakao_bank: 'kakao-bank-account',
  shinhan_bank: 'shinhan-bank-account',
  safe_box: 'safe-box-account',
};

// 임기 매핑 (날짜 기준으로 자동 판별)
function getTermIdFromDate(dateStr: string): string | null {
  const year = new Date(dateStr).getFullYear();
  return `term-${year}`;
}

// 카테고리 정규화
function normalizeCategory(category: string): string {
  // 카테고리 매핑 규칙
  const categoryMap: Record<string, string> = {
    '기타 입금': '기타수입',
    '기타 출금': '기타지출',
    '회비': '회비수입',
    '식대': '식비',
    '경조사': '경조사비',
    '행사비': '행사비',
  };

  return categoryMap[category] || category;
}

async function main() {
  console.log('🔄 Starting finance data migration...\n');

  // 1. JSON 파일 읽기
  console.log('📖 Reading JSON file...');
  const jsonPath = path.join(__dirname, '..', 'enhanced_dashboard_data.json');
  const jsonData: JsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`✅ Loaded ${jsonData.transactions.length} transactions from JSON\n`);

  // 2. 기존 거래내역 삭제 (재실행 대비)
  console.log('🗑️  Deleting existing transactions...');
  const deletedCount = await prisma.transaction.deleteMany({});
  console.log(`✅ Deleted ${deletedCount.count} existing transactions\n`);

  // 3. 거래내역 마이그레이션
  console.log('💾 Migrating transactions...');

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < jsonData.transactions.length; i++) {
    const tx = jsonData.transactions[i];

    try {
      // 계좌 ID 결정
      let accountId: string;
      if (tx.is_safe_box) {
        accountId = accountIdMap['safe_box'];
      } else {
        accountId = accountIdMap[tx.bank] || accountIdMap['kakao_bank'];
      }

      // 거래 유형 변환
      const type = tx.type === 'income' ? 'INCOME' : 'EXPENSE';

      // 임기 ID 결정
      const termId = getTermIdFromDate(tx.date);

      // 카테고리 정규화
      const category = normalizeCategory(tx.category);

      // Transaction 생성
      await prisma.transaction.create({
        data: {
          accountId,
          date: new Date(tx.date),
          amount: Math.abs(tx.amount), // 양수로 저장
          type,
          category,
          description: tx.description || tx.depositor_name || '거래',
          termId: termId || null,
          createdById: null, // 마이그레이션 데이터는 작성자 없음
        },
      });

      successCount++;

      // 진행상황 표시 (100건마다)
      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${jsonData.transactions.length} (${Math.round(((i + 1) / jsonData.transactions.length) * 100)}%)`);
      }
    } catch (error) {
      errorCount++;
      errors.push(`Row ${i + 1}: ${error.message}`);

      if (errors.length <= 10) {
        console.error(`  ❌ Error at row ${i + 1}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Migration completed:`);
  console.log(`  - Success: ${successCount} transactions`);
  console.log(`  - Errors: ${errorCount} transactions`);

  if (errors.length > 10) {
    console.log(`  - (Showing first 10 errors, total: ${errors.length})`);
  }

  // 4. 계좌 잔액 재계산
  console.log('\n💰 Recalculating account balances...');

  const accounts = await prisma.account.findMany();

  for (const account of accounts) {
    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
        deletedAt: null,
      },
    });

    const balance = transactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      return tx.type === 'INCOME' ? sum + amount : sum - amount;
    }, 0);

    await prisma.account.update({
      where: { id: account.id },
      data: { balance },
    });

    console.log(`  - ${account.name}: ${balance.toLocaleString()}원 (${transactions.length}건)`);
  }

  // 5. 검증
  console.log('\n🔍 Validating data...');

  const dbSummary = await prisma.transaction.aggregate({
    where: { deletedAt: null },
    _count: { id: true },
  });

  const incomeTransactions = await prisma.transaction.findMany({
    where: { type: 'INCOME', deletedAt: null },
  });

  const expenseTransactions = await prisma.transaction.findMany({
    where: { type: 'EXPENSE', deletedAt: null },
  });

  const totalIncome = incomeTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalExpense = expenseTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const netAmount = totalIncome - totalExpense;

  console.log('\n📊 Summary Comparison:');
  console.log('\n  JSON Data:');
  console.log(`    Total Transactions: ${jsonData.summary.total_transactions}`);
  console.log(`    Total Income:       ${jsonData.summary.total_income.toLocaleString()}원`);
  console.log(`    Total Expense:      ${jsonData.summary.total_expense.toLocaleString()}원`);
  console.log(`    Net Amount:         ${(jsonData.summary.total_income - jsonData.summary.total_expense).toLocaleString()}원`);

  console.log('\n  Database:');
  console.log(`    Total Transactions: ${dbSummary._count.id}`);
  console.log(`    Total Income:       ${totalIncome.toLocaleString()}원`);
  console.log(`    Total Expense:      ${totalExpense.toLocaleString()}원`);
  console.log(`    Net Amount:         ${netAmount.toLocaleString()}원`);

  console.log('\n  Match Status:');
  const transactionMatch = dbSummary._count.id === jsonData.summary.total_transactions;
  const incomeMatch = Math.abs(totalIncome - jsonData.summary.total_income) < 1;
  const expenseMatch = Math.abs(totalExpense - jsonData.summary.total_expense) < 1;

  console.log(`    Transactions: ${transactionMatch ? '✅ Match' : '❌ Mismatch'}`);
  console.log(`    Income:       ${incomeMatch ? '✅ Match' : '❌ Mismatch'}`);
  console.log(`    Expense:      ${expenseMatch ? '✅ Match' : '❌ Mismatch'}`);

  if (transactionMatch && incomeMatch && expenseMatch) {
    console.log('\n✨ Migration successful! All data validated.');
  } else {
    console.log('\n⚠️  Migration completed with discrepancies. Please review.');
  }
}

main()
  .catch((e) => {
    console.error('\n❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
