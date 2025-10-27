'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  console.log('SignUp response:', { authData, error });

  if (error) {
    console.error('Supabase signup error:', error);
    redirect('/error');
  }

  // Supabase Authでユーザー作成成功後、Prismaにもレコードを作成
  if (authData.user) {
    console.log('Creating user in Prisma:', {
      id: authData.user.id,
      email: authData.user.email,
    });
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
          role: 'MEMBER',
        },
      });
      console.log('User created successfully in Prisma');
    } catch (error) {
      console.error('Prisma User creation error:', error);
      redirect('/error');
    }
  } else {
    console.log('No user in authData - email confirmation might be required');
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
