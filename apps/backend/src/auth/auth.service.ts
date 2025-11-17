import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { randomInt } from 'crypto';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  RequestOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
} from './dto';

/**
 * JWT Payload 타입
 */
interface JwtPayload {
  sub: string; // userId
  employeeNo: string;
  email: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * 인증 서비스
 *
 * 이메일 OTP 로그인 및 JWT 토큰 발급/갱신 관리
 *
 * 주요 기능:
 * - OTP 생성 및 이메일 발송
 * - OTP 검증 및 JWT 토큰 발급
 * - Refresh Token을 통한 Access Token 갱신
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly prisma: PrismaClient;

  // JWT 토큰 만료 시간 설정
  private readonly ACCESS_TOKEN_EXPIRY = '30m'; // 30분
  private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7일
  private readonly ACCESS_TOKEN_EXPIRY_SECONDS = 30 * 60; // 30분 (초 단위)

  // OTP 설정
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5; // OTP 유효 시간 5분

  constructor(private readonly jwtService: JwtService) {
    this.prisma = new PrismaClient();
  }

  /**
   * OTP 요청 처리
   *
   * 1. 이메일로 사용자 조회
   * 2. 6자리 OTP 생성
   * 3. DB에 저장 (만료 시간, 미사용 상태)
   * 4. 이메일 발송 (현재는 stub)
   *
   * @param dto - 이메일 정보
   * @returns 성공 메시지
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const { email } = dto;

    // 1. 사용자 존재 여부 확인
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '등록되지 않은 이메일입니다.',
      );
    }

    // 사용자 활성화 상태 확인
    if (!user.isActive) {
      throw new BusinessException(
        ErrorCode.USER_INACTIVE,
        '비활성화된 사용자입니다.',
      );
    }

    // 2. 6자리 OTP 생성
    const otpCode = this.generateOtpCode();

    // 3. OTP 토큰 DB 저장
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await this.prisma.otpToken.create({
      data: {
        userId: user.id,
        token: otpCode,
        purpose: 'login',
        expiresAt,
        isUsed: false,
      },
    });

    this.logger.log(
      `OTP generated for user ${user.email}: ${otpCode} (expires at ${expiresAt.toISOString()})`,
    );

    // 4. 이메일 발송 (TODO: 실제 이메일 발송 구현)
    // TODO: Implement email sending service
    // await this.emailService.sendOtp(user.email, otpCode);
    this.logger.warn(
      `TODO: Email send to ${user.email} with OTP code: ${otpCode}`,
    );

    return {
      message: 'OTP 코드가 이메일로 발송되었습니다.',
    };
  }

  /**
   * OTP 검증 및 로그인
   *
   * 1. 이메일과 OTP 코드로 토큰 조회
   * 2. 만료/사용 여부 검증
   * 3. 토큰을 사용됨으로 표시
   * 4. Access/Refresh JWT 토큰 생성
   *
   * @param dto - 이메일 및 OTP 코드
   * @returns JWT 토큰 및 사용자 정보
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const { email, code } = dto;

    // 1. 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '등록되지 않은 이메일입니다.',
      );
    }

    // 2. OTP 토큰 조회 (최신 것부터)
    const otpToken = await this.prisma.otpToken.findFirst({
      where: {
        userId: user.id,
        token: code,
        purpose: 'login',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // OTP 코드 유효성 검증
    if (!otpToken) {
      throw new BusinessException(
        ErrorCode.AUTH_OTP_INVALID,
        '유효하지 않은 OTP 코드입니다.',
      );
    }

    // 만료 여부 확인
    if (new Date() > otpToken.expiresAt) {
      throw new BusinessException(
        ErrorCode.AUTH_OTP_EXPIRED,
        'OTP 코드가 만료되었습니다. 새로운 코드를 요청해주세요.',
      );
    }

    // 이미 사용된 코드 확인
    if (otpToken.isUsed) {
      throw new BusinessException(
        ErrorCode.AUTH_OTP_ALREADY_USED,
        '이미 사용된 OTP 코드입니다. 새로운 코드를 요청해주세요.',
      );
    }

    // 3. OTP 토큰을 사용됨으로 표시
    await this.prisma.otpToken.update({
      where: { id: otpToken.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // 4. JWT 토큰 생성
    const tokens = this.generateTokens(user);

    this.logger.log(`User ${user.email} logged in successfully`);

    return {
      ...tokens,
      user: {
        id: user.id,
        employeeNo: user.employeeNo,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Refresh Token으로 Access Token 갱신
   *
   * 1. Refresh Token 검증
   * 2. 사용자 정보 확인
   * 3. 새로운 Access Token 발급
   *
   * @param dto - Refresh Token
   * @returns 새로운 Access Token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const { refreshToken } = dto;

    try {
      // 1. Refresh Token 검증
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
      );

      // Refresh Token 타입 확인
      if (payload.type !== 'refresh') {
        throw new BusinessException(
          ErrorCode.AUTH_INVALID_TOKEN,
          'Refresh Token이 아닙니다.',
        );
      }

      // 2. 사용자 존재 여부 및 활성화 상태 확인
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new BusinessException(
          ErrorCode.USER_NOT_FOUND,
          '사용자를 찾을 수 없습니다.',
        );
      }

      if (!user.isActive) {
        throw new BusinessException(
          ErrorCode.USER_INACTIVE,
          '비활성화된 사용자입니다.',
        );
      }

      // 3. 새로운 Access Token 생성
      const accessToken = this.generateAccessToken(user);

      this.logger.log(`Access token refreshed for user ${user.email}`);

      return {
        accessToken,
        expiresIn: this.ACCESS_TOKEN_EXPIRY_SECONDS,
      };
    } catch (error) {
      // JWT 검증 실패 처리
      if (error.name === 'TokenExpiredError') {
        throw new BusinessException(
          ErrorCode.AUTH_TOKEN_EXPIRED,
          'Refresh Token이 만료되었습니다. 다시 로그인해주세요.',
        );
      }

      if (error.name === 'JsonWebTokenError') {
        throw new BusinessException(
          ErrorCode.AUTH_INVALID_TOKEN,
          '유효하지 않은 Refresh Token입니다.',
        );
      }

      // BusinessException은 그대로 전파
      if (error instanceof BusinessException) {
        throw error;
      }

      // 기타 에러
      this.logger.error('Refresh token error:', error);
      throw new BusinessException(
        ErrorCode.AUTH_INVALID_TOKEN,
        'Token 갱신에 실패했습니다.',
      );
    }
  }

  /**
   * 6자리 랜덤 OTP 코드 생성
   *
   * 보안: crypto.randomInt() 사용으로 암호학적으로 안전한 난수 생성
   *
   * @returns 6자리 숫자 문자열
   */
  private generateOtpCode(): string {
    // randomInt(min, max)는 min 이상 max 미만의 난수 생성
    // 100000 ~ 999999 범위의 6자리 숫자
    return randomInt(100000, 1000000).toString();
  }

  /**
   * Access Token 및 Refresh Token 생성
   *
   * @param user - 사용자 정보
   * @returns Access Token 및 Refresh Token
   */
  private generateTokens(user: any): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  /**
   * Access Token 생성
   *
   * @param user - 사용자 정보
   * @returns Access Token
   */
  private generateAccessToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      employeeNo: user.employeeNo,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'access',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Refresh Token 생성
   *
   * @param user - 사용자 정보
   * @returns Refresh Token
   */
  private generateRefreshToken(user: any): string {
    const payload: JwtPayload = {
      sub: user.id,
      employeeNo: user.employeeNo,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
