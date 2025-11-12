#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
엑셀 파일을 읽어서 대시보드 데이터로 변환하는 스크립트
"""

import pandas as pd
import json
from datetime import datetime
import os

def read_kakao_bank_excel(file_path):
    """카카오뱅크 거래내역 엑셀 파일 읽기"""
    print(f"\n{'='*60}")
    print(f"카카오뱅크 파일 분석: {file_path}")
    print('='*60)

    try:
        # 엑셀 파일 읽기 (여러 시트가 있을 수 있으므로 확인)
        xls = pd.ExcelFile(file_path)
        print(f"시트 목록: {xls.sheet_names}")

        # 첫 번째 시트 읽기
        df = pd.read_excel(file_path, sheet_name=0)
        print(f"\n컬럼 목록: {df.columns.tolist()}")
        print(f"\n데이터 샘플 (처음 5개):")
        print(df.head())
        print(f"\n데이터 타입:")
        print(df.dtypes)
        print(f"\n총 행 수: {len(df)}")

        return df
    except Exception as e:
        print(f"오류 발생: {e}")
        return None

def read_shinhan_bank_excel(file_path):
    """신한은행 거래내역 엑셀 파일 읽기"""
    print(f"\n{'='*60}")
    print(f"신한은행 파일 분석: {file_path}")
    print('='*60)

    try:
        # .xls 파일은 xlrd를 사용
        df = pd.read_excel(file_path, engine='xlrd')
        print(f"\n컬럼 목록: {df.columns.tolist()}")
        print(f"\n데이터 샘플 (처음 5개):")
        print(df.head())
        print(f"\n데이터 타입:")
        print(df.dtypes)
        print(f"\n총 행 수: {len(df)}")

        return df
    except Exception as e:
        print(f"오류 발생: {e}")
        return None

def read_report_excel(file_path):
    """사우회 회비 결산 보고서 엑셀 파일 읽기"""
    print(f"\n{'='*60}")
    print(f"결산 보고서 파일 분석: {file_path}")
    print('='*60)

    try:
        xls = pd.ExcelFile(file_path)
        print(f"시트 목록: {xls.sheet_names}")

        # 모든 시트 읽기
        for sheet_name in xls.sheet_names:
            print(f"\n--- 시트: {sheet_name} ---")
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            print(f"컬럼 목록: {df.columns.tolist()}")
            print(f"데이터 샘플:")
            print(df.head())
            print(f"총 행 수: {len(df)}")

        return xls
    except Exception as e:
        print(f"오류 발생: {e}")
        return None

if __name__ == "__main__":
    # 파일 경로
    kakao_file = "251111_사우회회비 통장 거래 내역(카카오뱅크계좌).xlsx"
    shinhan_file = "신한은행_거래내역조회_20251111111910.xls"
    report_file = "사우회_회비_결산_보고서_최종.xlsx"

    # 파일 존재 확인
    print("파일 존재 확인:")
    print(f"카카오뱅크: {os.path.exists(kakao_file)}")
    print(f"신한은행: {os.path.exists(shinhan_file)}")
    print(f"결산 보고서: {os.path.exists(report_file)}")

    # 각 파일 읽기
    kakao_df = read_kakao_bank_excel(kakao_file)
    shinhan_df = read_shinhan_bank_excel(shinhan_file)
    report_xls = read_report_excel(report_file)
