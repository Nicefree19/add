#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
향상된 데이터 처리 스크립트 - 회비 추적 및 상세 분석
"""

import pandas as pd
import json
import re
from datetime import datetime
from collections import defaultdict

# 회원 목록 (실제 데이터에서 추출된 이름들)
KNOWN_MEMBERS = [
    '이동혁', '김민주', '박진복', '이광희', '이봉근', '문성환',
    '정성훈', '유호정', '여승민', '우재임', '박선우', '박예찬',
    '권용현'
]

def extract_member_name(description, depositor_name=''):
    """거래 설명 또는 입금자명에서 회원 이름 추출"""
    # 1. 신한은행 입금자명에서 추출 (가장 신뢰도 높음)
    if depositor_name:
        # 괄호 안의 이름 추출
        match = re.search(r'\(([가-힣]{2,4})\)', depositor_name)
        if match:
            name = match.group(1)
            if name in KNOWN_MEMBERS:
                return name

        # 입금자명에서 직접 이름 추출
        for member in KNOWN_MEMBERS:
            if member in depositor_name:
                return member

    # 2. 거래 설명에서 추출
    # 괄호 안의 이름 추출
    match = re.search(r'\(([가-힣]{2,4})\)', description)
    if match:
        name = match.group(1)
        if name in KNOWN_MEMBERS:
            return name

    # 간편이체, 오픈뱅킹 등의 접두사 제거 후 이름 추출
    patterns = [
        r'간편이체\((.+?)\)',
        r'간편이체 취소\((.+?)\)',
        r'^([가-힣]{2,4})$'  # 이름만 있는 경우
    ]

    for pattern in patterns:
        match = re.search(pattern, description)
        if match:
            name = match.group(1)
            if name in KNOWN_MEMBERS:
                return name

    # 이름이 단독으로 있는 경우
    if description.strip() in KNOWN_MEMBERS:
        return description.strip()

    return None

def categorize_expense(description, depositor_name=''):
    """지출 카테고리 세분화"""
    desc_lower = description.lower()

    # 송금/이체
    if any(kw in description for kw in ['간편이체', '오픈뱅킹', '이체', '송금']):
        # 회원에게 송금
        member = extract_member_name(description, depositor_name)
        if member:
            return f'회원 송금 ({member})'
        return '일반 송금'

    # ATM
    if 'atm' in desc_lower or 'ATM' in description:
        return 'ATM 출금'

    # 카드 결제
    if '체크카드' in description or '신용카드' in description or '카드' in description:
        return '카드 결제'

    # 모바일 결제
    if '모바일' in description:
        return '모바일 결제'

    # 수수료
    if '수수료' in description:
        return '수수료'

    return '기타 지출'

def is_internal_transfer(transaction, all_transactions):
    """계좌 간 내부 이체 여부 확인 (신한 → 카카오)"""
    # 대체 거래는 내부 이체로 간주
    if '대체' in transaction.get('description', ''):
        return True

    # 신한은행 출금과 카카오뱅크 입금이 같은 날짜에 같은 금액으로 발생한 경우
    if transaction['bank'] == 'kakao_bank' and transaction['type'] == 'income':
        # 같은 날짜에 신한은행에서 같은 금액의 출금이 있는지 확인
        for t in all_transactions:
            if (t['bank'] == 'shinhan_bank' and
                t['type'] == 'expense' and
                t['date'] == transaction['date'] and
                abs(t['amount'] - transaction['amount']) < 100):  # 금액 오차 허용
                return True

    return False

def categorize_income(description, depositor_name=''):
    """수입 카테고리 세분화"""
    desc_lower = description.lower()

    # 이자
    if '이자' in description:
        return '이자 수익'

    # 회비 납부
    member = extract_member_name(description, depositor_name)
    if member:
        return f'회비 ({member})'

    # 일반 입금 패턴
    if '사우회' in description or '회비' in description:
        return '회비 납부'

    # 대체 (계좌 이동)
    if '대체' in description:
        return '계좌 이동'

    # 카드 포인트/환급
    if '카드' in description:
        return '카드 포인트'

    return '기타 수입'

def analyze_member_contributions(transactions):
    """회원별 회비 납부 분석 (내부 이체 제외)"""
    member_data = defaultdict(lambda: {
        'total_paid': 0,
        'payment_count': 0,
        'payments': [],
        'last_payment_date': None,
        'average_amount': 0
    })

    for t in transactions:
        # 내부 이체와 세이프박스는 제외
        is_internal = t.get('is_internal_transfer', False)
        if t['type'] == 'income' and not t['is_safe_box'] and not is_internal:
            # 입금자명 사용 (신한은행의 경우 실제 입금자명 포함)
            depositor_name = t.get('depositor_name', '')
            member = extract_member_name(t['description'], depositor_name)
            if member:
                member_data[member]['total_paid'] += t['amount']
                member_data[member]['payment_count'] += 1
                member_data[member]['payments'].append({
                    'date': t['date'],
                    'amount': t['amount'],
                    'description': t['description'],
                    'depositor_name': depositor_name
                })

                # 마지막 납부일 업데이트
                payment_date = t['date']
                if (member_data[member]['last_payment_date'] is None or
                    payment_date > member_data[member]['last_payment_date']):
                    member_data[member]['last_payment_date'] = payment_date

    # 평균 계산
    for member in member_data:
        if member_data[member]['payment_count'] > 0:
            member_data[member]['average_amount'] = (
                member_data[member]['total_paid'] /
                member_data[member]['payment_count']
            )

    return dict(member_data)

def analyze_expense_by_category(transactions):
    """카테고리별 지출 분석"""
    category_data = defaultdict(lambda: {
        'total': 0,
        'count': 0,
        'transactions': []
    })

    for t in transactions:
        if t['type'] == 'expense' and not t['is_safe_box']:
            depositor_name = t.get('depositor_name', '')
            category = categorize_expense(t['description'], depositor_name)
            category_data[category]['total'] += t['amount']
            category_data[category]['count'] += 1
            category_data[category]['transactions'].append({
                'date': t['date'],
                'amount': t['amount'],
                'description': t['description'],
                'depositor_name': depositor_name
            })

    return dict(category_data)

def analyze_monthly_trends(transactions):
    """월별 상세 추이 분석 (내부 이체 제외)"""
    monthly_data = defaultdict(lambda: {
        'income': 0,
        'expense': 0,
        'member_payments': 0,
        'member_payment_count': 0,
        'internal_transfers': 0,
        'balance': 0
    })

    for t in transactions:
        if t['is_safe_box']:
            continue

        date = t['date']
        year_month = date[:7]  # YYYY-MM
        is_internal = t.get('is_internal_transfer', False)

        # 내부 이체는 별도 카운트
        if is_internal:
            monthly_data[year_month]['internal_transfers'] += t['amount']
            continue

        if t['type'] == 'income':
            monthly_data[year_month]['income'] += t['amount']
            # 회비 납부 체크
            depositor_name = t.get('depositor_name', '')
            if extract_member_name(t['description'], depositor_name):
                monthly_data[year_month]['member_payments'] += t['amount']
                monthly_data[year_month]['member_payment_count'] += 1
        elif t['type'] == 'expense':
            monthly_data[year_month]['expense'] += t['amount']

    # 월별 잔액 계산 (내부 이체 제외)
    sorted_months = sorted(monthly_data.keys())
    running_balance = 0
    for month in sorted_months:
        running_balance += monthly_data[month]['income']
        running_balance -= monthly_data[month]['expense']
        monthly_data[month]['balance'] = running_balance

    return dict(monthly_data)

def process_enhanced_data(input_file='dashboard_data.json', output_file='enhanced_dashboard_data.json'):
    """향상된 데이터 처리"""
    print("="*70)
    print("향상된 데이터 처리 시작")
    print("="*70)

    # 기존 데이터 로드
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    transactions = data['transactions']

    # 거래 데이터에 향상된 카테고리 추가 및 내부 이체 표시
    print("\n거래 데이터 재분류 중...")

    # 1차: 카테고리 분류
    for t in transactions:
        depositor_name = t.get('depositor_name', '')
        if t['type'] == 'income':
            t['detailed_category'] = categorize_income(t['description'], depositor_name)
            member = extract_member_name(t['description'], depositor_name)
            if member:
                t['member_name'] = member
        elif t['type'] == 'expense':
            t['detailed_category'] = categorize_expense(t['description'], depositor_name)

    # 2차: 내부 이체 표시
    print("내부 이체 거래 식별 중...")
    internal_transfer_count = 0
    for t in transactions:
        if not t['is_safe_box']:
            t['is_internal_transfer'] = is_internal_transfer(t, transactions)
            if t['is_internal_transfer']:
                internal_transfer_count += 1
        else:
            t['is_internal_transfer'] = False

    print(f"  - 내부 이체 거래: {internal_transfer_count}건")

    # 회원별 분석
    print("회원별 회비 납부 분석 중...")
    member_analysis = analyze_member_contributions(transactions)

    # 카테고리별 지출 분석
    print("카테고리별 지출 분석 중...")
    expense_analysis = analyze_expense_by_category(transactions)

    # 월별 추이 분석
    print("월별 추이 분석 중...")
    monthly_analysis = analyze_monthly_trends(transactions)

    # 향상된 데이터 구조 생성
    enhanced_data = {
        **data,  # 기존 데이터 유지
        'member_analysis': member_analysis,
        'expense_by_category': expense_analysis,
        'monthly_trends': monthly_analysis,
        'known_members': KNOWN_MEMBERS,
        'enhanced_processing_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    # 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ {output_file} 파일이 성공적으로 생성되었습니다!")

    # 요약 출력
    print("\n" + "="*70)
    print("분석 요약")
    print("="*70)

    print(f"\n회원 분석:")
    print(f"  - 총 회원 수: {len(KNOWN_MEMBERS)}명")
    print(f"  - 납부 기록이 있는 회원: {len(member_analysis)}명")

    total_member_payments = sum(m['total_paid'] for m in member_analysis.values())
    print(f"  - 총 회비 납부액: ₩{total_member_payments:,}")

    print(f"\n지출 카테고리:")
    for cat, info in sorted(expense_analysis.items(), key=lambda x: x[1]['total'], reverse=True)[:5]:
        print(f"  - {cat}: ₩{info['total']:,} ({info['count']}건)")

    print(f"\n월별 추이:")
    print(f"  - 분석 기간: {len(monthly_analysis)}개월")

    return enhanced_data

if __name__ == "__main__":
    enhanced_data = process_enhanced_data()

    # 상위 납부자 표시
    print("\n" + "="*70)
    print("회비 납부 상위 회원 (총 납부액 기준)")
    print("="*70)

    member_analysis = enhanced_data['member_analysis']
    sorted_members = sorted(
        member_analysis.items(),
        key=lambda x: x[1]['total_paid'],
        reverse=True
    )

    for rank, (member, info) in enumerate(sorted_members, 1):
        print(f"{rank}. {member:10s} | 총액: ₩{info['total_paid']:>12,} | "
              f"건수: {info['payment_count']:3d} | "
              f"평균: ₩{info['average_amount']:>10,.0f} | "
              f"최근: {info['last_payment_date']}")
