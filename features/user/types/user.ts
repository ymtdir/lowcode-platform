import type { User as PrismaUser, Prisma } from '@prisma/client';

/**
 * ユーザー型（基本型）
 * get-users.tsのクエリ構造に対応（includeなし）
 */
export type User = PrismaUser;

/**
 * ユーザー型（グループメンバー情報を含む）
 * 将来的にグループメンバー情報が必要な場合に使用
 */
export type UserWithGroupMembers = Prisma.UserGetPayload<{
  include: {
    groupMembers: true;
    _count: {
      select: {
        groupMembers: true;
      };
    };
  };
}>;
