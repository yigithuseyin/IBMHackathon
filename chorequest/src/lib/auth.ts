import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            avatarColour: true,
            totalPoints: true,
          },
        });

        if (!user) {
          return null;
        }

        const passwordValid = await bcryptjs.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColour: user.avatarColour,
          totalPoints: user.totalPoints,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.avatarColour =
          (user as { avatarColour?: string }).avatarColour ?? "#6366f1";
        token.totalPoints =
          (user as { totalPoints?: number }).totalPoints ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.avatarColour = token.avatarColour as string;
        session.user.totalPoints = token.totalPoints as number;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
