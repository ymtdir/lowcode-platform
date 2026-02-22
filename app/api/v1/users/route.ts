import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageUsers } from '@/lib/permissions';

/**
 * GET /api/v1/users
 * ユーザー一覧を取得する
 * 権限: Adminのみ
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // Admin権限チェック
  if (!canManageUsers(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(users);
  } catch {
    return apiError('ユーザー一覧の取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/v1/users
 * ユーザーを作成する
 * 権限: Adminのみ
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // Admin権限チェック
  if (!canManageUsers(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('リクエストボディが不正です', 'BAD_REQUEST', 400);
  }

  const {
    name,
    email: rawEmail,
    password,
    role,
  } = body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    role?: unknown;
  };

  // メールアドレスを正規化（前後の空白除去・小文字化）
  const email =
    typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : rawEmail;

  // バリデーション
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return apiError('nameは必須です', 'VALIDATION_ERROR', 422);
  }
  if (!email || typeof email !== 'string') {
    return apiError('有効なemailを入力してください', 'VALIDATION_ERROR', 422);
  }
  // @とドメインの.を含む基本フォーマットチェック
  if (!email.includes('@') || !email.split('@')[1]?.includes('.')) {
    return apiError('有効なemailを入力してください', 'VALIDATION_ERROR', 422);
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return apiError(
      'passwordは6文字以上で入力してください',
      'VALIDATION_ERROR',
      422
    );
  }
  if (
    role !== undefined &&
    !['ADMIN', 'DEVELOPER', 'MEMBER'].includes(role as string)
  ) {
    return apiError(
      'roleはADMIN、DEVELOPER、MEMBERのいずれかを指定してください',
      'VALIDATION_ERROR',
      422
    );
  }

  try {
    // メールアドレスの重複チェック（正規化済みの値で検索）
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return apiError(
        'このメールアドレスは既に使用されています',
        'BAD_REQUEST',
        400
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        role: (role as 'ADMIN' | 'DEVELOPER' | 'MEMBER') || 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(newUser, 201);
  } catch (error) {
    // TOCTOU競合などによるメールアドレスの一意制約違反
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return apiError(
        'このメールアドレスは既に使用されています',
        'BAD_REQUEST',
        400
      );
    }
    return apiError('ユーザーの作成に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
