import NextAuth, { NextAuthOptions } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';

const providers = [] as any[];
if (process.env.COGNITO_CLIENT_ID && process.env.COGNITO_CLIENT_SECRET && process.env.COGNITO_ISSUER) {
  providers.push(
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Cognito sub
        // @ts-ignore
        token.sub = (profile as any).sub || token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  // Fallback secret to reduce 500s if env not set; set NEXTAUTH_SECRET in production
  secret: process.env.NEXTAUTH_SECRET || 'set-a-strong-secret',
};

export default NextAuth(authOptions);
