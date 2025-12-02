import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password required");
                }

                try {
                    // Find user by email
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });

                    if (!user) {
                        throw new Error("No user found with this email");
                    }

                    // Verify password (assuming password is stored in a custom field)
                    // Note: You'll need to add a password field to User model
                    const isValid = await bcrypt.compare(credentials.password, user.password || "");

                    if (!isValid) {
                        throw new Error("Invalid password");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.photoURL,
                    };
                } catch (error: any) {
                    throw new Error(error.message || "Authentication failed");
                }
            }
        }),
    ],
    pages: {
        signIn: '/auth',
        error: '/auth',
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
        async signIn({ user, account, profile }) {
            // For Google OAuth, create user in database if doesn't exist
            if (account?.provider === "google" && user.email) {
                try {
                    await prisma.user.upsert({
                        where: { email: user.email },
                        create: {
                            email: user.email,
                            name: user.name || null,
                            photoURL: user.image || null,
                            emailVerified: true,
                        },
                        update: {
                            name: user.name || undefined,
                            photoURL: user.image || undefined,
                        },
                    });
                } catch (error) {
                    console.error("Error creating/updating user:", error);
                }
            }
            return true;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


