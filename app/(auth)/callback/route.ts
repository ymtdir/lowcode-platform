import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('認証コード交換エラー:', error.message);
      return NextResponse.redirect(`${origin}/error`);
    }

    // ユーザー情報を取得
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Prismaにユーザーが存在するか確認
    if (user) {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      // 存在しなければ作成
      if (!existingUser) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              email: user.email!,
              role: 'MEMBER',
            },
          });
          console.log('Prismaにユーザーを作成しました:', user.email);
        } catch (error) {
          console.error('Prismaユーザー作成エラー:', error);
          return NextResponse.redirect(`${origin}/error`);
        }
      }
    }
  }

  // ダッシュボードにリダイレクト
  return NextResponse.redirect(`${origin}/`);
}
