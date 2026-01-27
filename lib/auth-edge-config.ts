import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { UserRole } from '@prisma/client';

export const authEdgeConfig = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [],
} satisfies NextAuthConfig;

// Edge Runtime用のauth関数（middleware専用）
export const { auth: authEdge } = NextAuth(authEdgeConfig);
