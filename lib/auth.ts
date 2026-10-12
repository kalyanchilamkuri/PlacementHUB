import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from './db';
import { ALLOWED_EMAIL_DOMAIN } from './site';
import { verifyPassword } from './password';

/**
 * Credentials sign-in. Auth.js only supports JWT sessions with this provider,
 * so there is no Session table — the cookie carries the identity, and the role
 * is copied into the token at sign-in.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },

  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? '')
          .trim()
          .toLowerCase();
        const password = String(raw?.password ?? '');

        // The domain gate, checked here as well as at registration.
        if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!(await verifyPassword(password, user.passwordHash))) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'STUDENT';
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = String(token.id ?? '');
      session.user.role = token.role === 'ADMIN' ? 'ADMIN' : 'STUDENT';
      return session;
    },
  },
});
