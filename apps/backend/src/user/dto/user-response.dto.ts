/**
 * 사용자 정보 응답 DTO
 *
 * 사용자 정보를 반환할 때 사용하는 형식
 * 민감한 정보는 제외
 */
export class UserResponseDto {
  id: string;
  employeeNo: string;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Prisma User 객체를 UserResponseDto로 변환
   */
  static fromPrisma(user: any): UserResponseDto {
    return {
      id: user.id,
      employeeNo: user.employeeNo,
      email: user.email,
      name: user.name,
      department: user.department,
      position: user.position,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 여러 사용자를 변환
   */
  static fromPrismaMany(users: any[]): UserResponseDto[] {
    return users.map((user) => UserResponseDto.fromPrisma(user));
  }
}
