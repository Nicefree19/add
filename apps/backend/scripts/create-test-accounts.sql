-- ================================
-- Test Account Creation Script
-- ================================
--
-- 이 스크립트는 최초 선거 시나리오 테스트를 위한 계정을 생성합니다.
--
-- 생성 계정:
-- - ADMIN: 1명 (시스템 관리자)
-- - AUDITOR: 1명 (감사)
-- - MEMBER: 10명 (활성 회원)
-- - INACTIVE MEMBER: 1명 (비활성 회원)
-- 총 12명
--
-- 사용 방법:
-- psql -U postgres -d election_dev -f scripts/create-test-accounts.sql
--
-- 또는 Node.js/Prisma에서:
-- npm run db:seed:test-accounts
--
-- ⚠️  주의사항:
-- - 개발/테스트 환경에서만 사용하세요
-- - 프로덕션 환경에서는 절대 실행하지 마세요
-- - 이메일 주소는 실제 이메일로 변경 가능
--
-- ================================

-- 트랜잭션 시작 (all-or-nothing)
BEGIN;

-- ================================
-- 1. ADMIN (시스템 관리자)
-- ================================

INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'ADMIN001',
  'admin@test.com',
  '시스템 관리자',
  '경영지원팀',
  '팀장',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ================================
-- 2. AUDITOR (감사)
-- ================================

INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'AUD001',
  'auditor@test.com',
  '김감사',
  '감사팀',
  '수석감사',
  'AUDITOR',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ================================
-- 3. MEMBER (활성 회원 10명)
-- ================================

-- Member 1: 홍길동 (개발팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP001',
  'hong.gildong@test.com',
  '홍길동',
  '개발팀',
  '대리',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 2: 이영희 (마케팅팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP002',
  'lee.younghee@test.com',
  '이영희',
  '마케팅팀',
  '과장',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 3: 박철수 (인사팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP003',
  'park.cheolsu@test.com',
  '박철수',
  '인사팀',
  '차장',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 4: 김민수 (재무팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP004',
  'kim.minsu@test.com',
  '김민수',
  '재무팀',
  '대리',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 5: 정수진 (기획팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP005',
  'jung.sujin@test.com',
  '정수진',
  '기획팀',
  '사원',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 6: 최영수 (영업팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP006',
  'choi.youngsu@test.com',
  '최영수',
  '영업팀',
  '부장',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 7: 강혜린 (디자인팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP007',
  'kang.hyerin@test.com',
  '강혜린',
  '디자인팀',
  '대리',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 8: 윤지호 (연구개발팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP008',
  'yoon.jiho@test.com',
  '윤지호',
  '연구개발팀',
  '선임연구원',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 9: 서민아 (고객지원팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP009',
  'seo.mina@test.com',
  '서민아',
  '고객지원팀',
  '주임',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Member 10: 한준서 (품질관리팀)
INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP010',
  'han.junseo@test.com',
  '한준서',
  '품질관리팀',
  '과장',
  'MEMBER',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ================================
-- 4. INACTIVE MEMBER (비활성 회원 1명)
-- ================================

INSERT INTO users (
  id,
  employee_no,
  email,
  name,
  department,
  position,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'EMP999',
  'inactive.user@test.com',
  '퇴사자',
  '개발팀',
  '사원',
  'MEMBER',
  false,  -- 비활성 상태
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  employee_no = EXCLUDED.employee_no,
  name = EXCLUDED.name,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 트랜잭션 커밋
COMMIT;

-- ================================
-- 생성 결과 확인
-- ================================

-- 생성된 계정 목록 출력
SELECT
  employee_no,
  email,
  name,
  department,
  position,
  role,
  CASE
    WHEN is_active THEN '활성'
    ELSE '비활성'
  END AS status,
  created_at
FROM users
WHERE email IN (
  'admin@test.com',
  'auditor@test.com',
  'hong.gildong@test.com',
  'lee.younghee@test.com',
  'park.cheolsu@test.com',
  'kim.minsu@test.com',
  'jung.sujin@test.com',
  'choi.youngsu@test.com',
  'kang.hyerin@test.com',
  'yoon.jiho@test.com',
  'seo.mina@test.com',
  'han.junseo@test.com',
  'inactive.user@test.com'
)
ORDER BY
  CASE role
    WHEN 'ADMIN' THEN 1
    WHEN 'AUDITOR' THEN 2
    WHEN 'MEMBER' THEN 3
    ELSE 4
  END,
  employee_no;

-- 역할별 계정 수 요약
SELECT
  role,
  COUNT(*) AS count,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count,
  SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS inactive_count
FROM users
WHERE email IN (
  'admin@test.com',
  'auditor@test.com',
  'hong.gildong@test.com',
  'lee.younghee@test.com',
  'park.cheolsu@test.com',
  'kim.minsu@test.com',
  'jung.sujin@test.com',
  'choi.youngsu@test.com',
  'kang.hyerin@test.com',
  'yoon.jiho@test.com',
  'seo.mina@test.com',
  'han.junseo@test.com',
  'inactive.user@test.com'
)
GROUP BY role
ORDER BY
  CASE role
    WHEN 'ADMIN' THEN 1
    WHEN 'AUDITOR' THEN 2
    WHEN 'MEMBER' THEN 3
    ELSE 4
  END;

-- ================================
-- OTP 테스트용 토큰 생성 (선택사항)
-- ================================
--
-- 로그인 테스트를 위해 각 계정에 대한 OTP 토큰을 미리 생성할 수 있습니다.
-- 실제 환경에서는 OTP 요청 API를 통해 생성됩니다.
--
-- 예시 (주석 해제하여 사용):
--
-- INSERT INTO otp_tokens (id, user_id, token, purpose, expires_at, is_used, created_at, updated_at)
-- SELECT
--   gen_random_uuid(),
--   u.id,
--   '123456',  -- 테스트용 고정 OTP
--   'login',
--   NOW() + INTERVAL '5 minutes',
--   false,
--   NOW(),
--   NOW()
-- FROM users u
-- WHERE u.email IN (
--   'admin@test.com',
--   'auditor@test.com',
--   'hong.gildong@test.com',
--   'lee.younghee@test.com',
--   'park.cheolsu@test.com'
-- );
