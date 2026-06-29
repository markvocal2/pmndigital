import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://backend:3001';

class TwoFactorRequiredError extends CredentialsSignin {
  code = 'TWO_FACTOR_REQUIRED';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        const twoFactorCode = credentials?.twoFactorCode;
        if (typeof email !== 'string' || typeof password !== 'string') {
          return null;
        }
        try {
          const body: Record<string, string> = { email, password };
          if (typeof twoFactorCode === 'string' && twoFactorCode.length > 0) {
            body.twoFactorCode = twoFactorCode;
          }
          const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
          });
          if (res.status === 401) {
            const json = (await res.json().catch(() => ({}))) as {
              code?: string;
            };
            if (json.code === 'TWO_FACTOR_REQUIRED') {
              throw new TwoFactorRequiredError();
            }
            return null;
          }
          if (!res.ok) return null;
          const data = (await res.json()) as {
            user: { id: number; email: string; name: string | null; role?: string };
          };
          return {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name ?? null,
            role: data.user.role ?? 'USER',
          };
        } catch (e) {
          if (e instanceof TwoFactorRequiredError) throw e;
          return null;
        }
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'USER';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') session.user.id = token.id;
        if (typeof token.role === 'string') session.user.role = token.role;
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
