import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. 초기 계좌 데이터 생성
  console.log('📊 Creating accounts...');

  const kakaoBank = await prisma.account.upsert({
    where: { id: 'kakao-bank-account' },
    update: {},
    create: {
      id: 'kakao-bank-account',
      name: '카카오뱅크 사우회',
      accountNumber: '3333-28-1790885',
      bankCode: 'KAKAO_BANK',
      balance: 0, // 초기값 0, 거래내역으로 계산
      isActive: true,
    },
  });

  const safeBox = await prisma.account.upsert({
    where: { id: 'safe-box-account' },
    update: {},
    create: {
      id: 'safe-box-account',
      name: '세이프박스',
      accountNumber: null,
      bankCode: 'SAFE_BOX',
      balance: 0, // 초기값 0, 거래내역으로 계산
      isActive: true,
    },
  });

  const shinhanBank = await prisma.account.upsert({
    where: { id: 'shinhan-bank-account' },
    update: {},
    create: {
      id: 'shinhan-bank-account',
      name: '신한은행 (폐쇄)',
      accountNumber: '110-502-876387',
      bankCode: 'SHINHAN_BANK',
      balance: 0,
      isActive: false, // 폐쇄된 계좌
    },
  });

  console.log(`✅ Created 3 accounts:`);
  console.log(`  - ${kakaoBank.name} (${kakaoBank.accountNumber})`);
  console.log(`  - ${safeBox.name}`);
  console.log(`  - ${shinhanBank.name} (${shinhanBank.accountNumber}) [폐쇄]`);

  // 2. 샘플 임기 데이터 (선택 사항)
  console.log('\n📅 Creating sample terms...');

  const term2019 = await prisma.term.upsert({
    where: { id: 'term-2019' },
    update: {},
    create: {
      id: 'term-2019',
      name: '2019년',
      startDate: new Date('2019-01-01'),
      endDate: new Date('2019-12-31'),
      description: '2019년 임기',
      isActive: false,
    },
  });

  const term2020 = await prisma.term.upsert({
    where: { id: 'term-2020' },
    update: {},
    create: {
      id: 'term-2020',
      name: '2020년',
      startDate: new Date('2020-01-01'),
      endDate: new Date('2020-12-31'),
      description: '2020년 임기',
      isActive: false,
    },
  });

  const term2021 = await prisma.term.upsert({
    where: { id: 'term-2021' },
    update: {},
    create: {
      id: 'term-2021',
      name: '2021년',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-12-31'),
      description: '2021년 임기',
      isActive: false,
    },
  });

  const term2022 = await prisma.term.upsert({
    where: { id: 'term-2022' },
    update: {},
    create: {
      id: 'term-2022',
      name: '2022년',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-12-31'),
      description: '2022년 임기',
      isActive: false,
    },
  });

  const term2023 = await prisma.term.upsert({
    where: { id: 'term-2023' },
    update: {},
    create: {
      id: 'term-2023',
      name: '2023년',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      description: '2023년 임기',
      isActive: false,
    },
  });

  const term2024 = await prisma.term.upsert({
    where: { id: 'term-2024' },
    update: {},
    create: {
      id: 'term-2024',
      name: '2024년',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      description: '2024년 임기',
      isActive: false,
    },
  });

  const term2025 = await prisma.term.upsert({
    where: { id: 'term-2025' },
    update: {},
    create: {
      id: 'term-2025',
      name: '2025년',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      description: '2025년 임기',
      isActive: true, // 현재 활성 임기
    },
  });

  console.log(`✅ Created 7 terms (2019-2025)`);

  console.log('\n✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
