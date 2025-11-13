#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
엑셀 파일을 읽어서 대시보드 JSON 데이터로 변환하는 스크립트
"""

import pandas as pd
import json
from datetime import datetime
import re

def clean_currency(value):
    """통화 문자열을 숫자로 변환"""
    if pd.isna(value):
        return 0
    if isinstance(value, (int, float)):
        return int(value)

    # 문자열에서 숫자만 추출
    value_str = str(value).replace(',', '').replace('원', '').replace(' ', '').strip()
    # 음수 처리
    if '-' in value_str:
        value_str = value_str.replace('-', '')
        return -int(float(value_str))
    try:
        return int(float(value_str))
    except:
        return 0

def parse_date(date_str):
    """다양한 날짜 형식을 ISO 형식으로 변환"""
    if pd.isna(date_str):
        return None

    date_str = str(date_str).strip()

    # 날짜 형식 패턴들
    patterns = [
        ('%Y-%m-%d %H:%M:%S', r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'),
        ('%Y.%m.%d %H:%M:%S', r'^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}:\d{2}$'),
        ('%Y-%m-%d', r'^\d{4}-\d{2}-\d{2}$'),
        ('%Y.%m.%d', r'^\d{4}\.\d{2}\.\d{2}$'),
    ]

    for fmt, pattern in patterns:
        if re.match(pattern, date_str):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except:
                pass

    return date_str

def determine_transaction_type(row):
    """거래 타입 결정 (income, expense, transfer)"""
    trans_type = str(row.get('구분', '')).strip()
    description = str(row.get('내용', '')).lower()

    # 구분 컬럼을 우선적으로 사용
    if '입금' in trans_type:
        # 입금취소는 출금으로 처리
        if '취소' in trans_type:
            return 'expense'
        return 'income'
    elif '출금' in trans_type:
        # 출금취소는 입금으로 처리
        if '취소' in trans_type:
            return 'income'
        return 'expense'
    elif '이체' in description:
        return 'transfer'
    else:
        return 'income'

def determine_category(row):
    """거래 카테고리 결정"""
    description = str(row.get('내용', '')).lower()
    trans_type = row.get('type', '')

    # 이자
    if '이자' in description:
        return '이자'

    # 세이프박스
    if '세이프박스' in description or row.get('is_safe_box', False):
        return '세이프박스'

    # 입금 카테고리
    if trans_type == 'income':
        if '회비' in description or '납부' in description:
            return '회비 납부'
        elif '이체' in description:
            return '이체 입금'
        else:
            return '기타 입금'

    # 출금 카테고리
    elif trans_type == 'expense':
        if 'atm' in description:
            return 'ATM 출금'
        elif '이체' in description:
            return '일반 이체'
        elif '송금' in description:
            return '송금'
        else:
            return '기타 출금'

    return '기타'

def process_all_transactions(report_file, kakao_file):
    """모든 거래 내역 처리"""
    transactions = []

    # 1. 결산 보고서에서 전체 거래 내역 읽기
    print("\n전체 거래 내역 처리 중...")
    # skiprows=2를 사용하여 제목과 빈 행 건너뛰기
    df_all = pd.read_excel(report_file, sheet_name='전체 거래 내역', skiprows=2)
    # 컬럼명 수동 설정
    df_all.columns = ['거래일시', '구분', '거래금액', '내용', '은행', '년도']

    for idx, row in df_all.iterrows():
        if pd.isna(row['거래일시']) or row['거래일시'] == '거래일시':
            continue

        amount = clean_currency(row['거래금액'])
        if amount == 0:
            continue

        trans = {
            'date': parse_date(row['거래일시']),
            'amount': abs(amount),
            'description': str(row['내용']).strip() if not pd.isna(row['내용']) else '',
            'bank': 'shinhan_bank' if '신한' in str(row.get('은행', '')) else 'kakao_bank',
            'is_safe_box': False
        }

        trans['type'] = determine_transaction_type({'구분': row['구분'], 'amount': amount, '내용': trans['description']})
        trans['category'] = determine_category(trans)
        trans['balance_after'] = 0  # 나중에 계산

        transactions.append(trans)

    # 2. 세이프박스 거래 내역 읽기
    print("세이프박스 거래 내역 처리 중...")
    df_safebox = pd.read_excel(report_file, sheet_name='세이프박스 거래내역', skiprows=2)
    df_safebox.columns = ['거래일시', '구분', '거래금액', '내용']

    for idx, row in df_safebox.iterrows():
        if pd.isna(row['거래일시']) or row['거래일시'] == '거래일시':
            continue

        amount = clean_currency(row['거래금액'])
        if amount == 0:
            continue

        trans = {
            'date': parse_date(row['거래일시']),
            'amount': abs(amount),
            'description': '세이프박스',
            'bank': 'kakao_bank',
            'is_safe_box': True
        }

        trans['type'] = determine_transaction_type({'구분': row['구분'], 'amount': amount, '내용': trans['description']})
        trans['category'] = '세이프박스'
        trans['balance_after'] = 0

        transactions.append(trans)

    # 날짜순 정렬
    transactions.sort(key=lambda x: x['date'])

    # 잔액 계산
    balance = 0
    safebox_balance = 0

    for trans in transactions:
        if trans['is_safe_box']:
            if trans['type'] == 'income':
                safebox_balance += trans['amount']
            else:
                safebox_balance -= trans['amount']
            trans['balance_after'] = safebox_balance
        else:
            if trans['type'] == 'income':
                balance += trans['amount']
            elif trans['type'] == 'expense':
                balance -= trans['amount']
            trans['balance_after'] = balance

    print(f"총 {len(transactions)}개의 거래 처리 완료")

    return transactions

def is_internal_transfer(description):
    """내부 이체 여부 확인 (계좌 간 이동)"""
    # '대체' 거래는 내부 이체로 간주
    return '대체' in description

def calculate_summary(transactions):
    """요약 통계 계산 (내부 이체 제외)"""
    total_income = 0
    total_expense = 0
    total_interest = 0
    kakao_balance = 0
    safebox_balance = 0
    internal_transfer_count = 0

    for trans in transactions:
        # 내부 이체 표시
        trans['is_internal_transfer'] = is_internal_transfer(trans['description'])

        if trans['is_safe_box']:
            if trans['type'] == 'income':
                safebox_balance += trans['amount']
            else:
                safebox_balance -= trans['amount']
        else:
            # 내부 이체는 수입/지출 통계에서 제외
            if trans['is_internal_transfer']:
                internal_transfer_count += 1
                # 잔액에는 반영
                if trans['type'] == 'income':
                    kakao_balance += trans['amount']
                elif trans['type'] == 'expense':
                    kakao_balance -= trans['amount']
            else:
                # 실제 수입/지출만 통계에 포함
                if trans['type'] == 'income':
                    total_income += trans['amount']
                    if trans['category'] == '이자':
                        total_interest += trans['amount']
                    kakao_balance += trans['amount']
                elif trans['type'] == 'expense':
                    total_expense += trans['amount']
                    kakao_balance -= trans['amount']

    # 마지막 거래의 잔액 사용
    kakao_transactions = [t for t in transactions if not t['is_safe_box']]
    if kakao_transactions:
        kakao_balance = kakao_transactions[-1]['balance_after']

    safebox_transactions = [t for t in transactions if t['is_safe_box']]
    if safebox_transactions:
        safebox_balance = safebox_transactions[-1]['balance_after']

    print(f"\n내부 이체 거래: {internal_transfer_count}건 (통계에서 제외)")

    return {
        'total_income': total_income,
        'total_expense': total_expense,
        'total_interest': total_interest,
        'kakao_balance': kakao_balance,
        'safebox_balance': safebox_balance,
        'total_balance': kakao_balance + safebox_balance,
        'total_transactions': len(transactions),
        'internal_transfers': internal_transfer_count
    }

def create_dashboard_data(transactions, summary):
    """대시보드 데이터 구조 생성"""
    return {
        'accounts': {
            'kakao_bank': {
                'account_number': '3333-28-1790885',
                'description': '카카오뱅크 저축예금',
                'balance': summary['kakao_balance']
            },
            'safe_box': {
                'description': '안전 자산 운용',
                'balance': summary['safebox_balance']
            },
            'shinhan_bank': {
                'account_number': '110-502-876387',
                'description': '신한은행 (폐쇄)',
                'balance': 0,
                'is_closed': True
            }
        },
        'summary': summary,
        'transactions': transactions,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

def main():
    """메인 함수"""
    print("="*60)
    print("엑셀 데이터를 대시보드 JSON으로 변환")
    print("="*60)

    # 파일 경로
    report_file = "사우회_회비_결산_보고서_최종.xlsx"
    kakao_file = "251111_사우회회비 통장 거래 내역(카카오뱅크계좌).xlsx"
    output_file = "dashboard_data.json"

    # 거래 내역 처리
    transactions = process_all_transactions(report_file, kakao_file)

    # 요약 통계 계산
    summary = calculate_summary(transactions)

    print("\n요약 통계:")
    print(f"  총 입금: ₩{summary['total_income']:,}")
    print(f"  총 출금: ₩{summary['total_expense']:,}")
    print(f"  이자 수익: ₩{summary['total_interest']:,}")
    print(f"  카카오뱅크 잔액: ₩{summary['kakao_balance']:,}")
    print(f"  세이프박스 잔액: ₩{summary['safebox_balance']:,}")
    print(f"  총 잔액: ₩{summary['total_balance']:,}")
    print(f"  총 거래 건수: {summary['total_transactions']}건")

    # 대시보드 데이터 생성
    dashboard_data = create_dashboard_data(transactions, summary)

    # JSON 파일로 저장
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dashboard_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ {output_file} 파일이 성공적으로 생성되었습니다!")
    print("="*60)

if __name__ == "__main__":
    main()
