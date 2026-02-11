import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASS,
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [process.env.APP_URL!],

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "ACTIVE",
        required: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Option: use BetterAuth provided URL (recommended)
      // const verificationUrl = url;

      try {
        const verificationUrl = `${process.env.APP_URL}/verify-email/?token=${token}`;

        const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
  </head>
  <body style="margin:0; padding:0; background:#f6f7fb; font-family: Arial, Helvetica, sans-serif; color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb; padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(16,24,40,0.08);">
            <tr>
              <td style="padding:28px 28px 18px 28px; background:#111827;">
                <div style="font-size:18px; font-weight:700; color:#ffffff; letter-spacing:0.2px;">
                  Prisma Blog
                </div>
                <div style="font-size:13px; color:#cbd5e1; margin-top:6px;">
                  Email Verification
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <div style="font-size:20px; font-weight:700; margin:0 0 12px 0;">
                  Verify your email address
                </div>
                <div style="font-size:14px; line-height:1.6; color:#334155;">
                  Hi ${user?.name ? user.name : "there"},<br/>
                  Thanks for signing up for <b>Prisma Blog</b>. Please confirm your email address to activate your account.
                </div>

                <div style="margin:22px 0 18px 0;">
                  <a href="${verificationUrl}"
                     style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-size:14px; font-weight:700;">
                    Verify Email
                  </a>
                </div>

                <div style="font-size:13px; line-height:1.6; color:#475569;">
                  This verification link may expire for your security.
                </div>

                <div style="margin-top:18px; font-size:12px; line-height:1.6; color:#64748b;">
                  If the button doesn’t work, copy and paste this link into your browser:
                  <div style="margin-top:8px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; word-break:break-all;">
                    <a href="${verificationUrl}" style="color:#2563eb; text-decoration:none;">${verificationUrl}</a>
                  </div>
                </div>

                <div style="margin-top:18px; font-size:12px; line-height:1.6; color:#94a3b8;">
                  If you didn’t create an account, you can safely ignore this email.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px 26px 28px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                <div style="font-size:12px; color:#64748b; line-height:1.6;">
                  © ${new Date().getFullYear()} Prisma Blog. All rights reserved.
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

        const info = await transporter.sendMail({
          from: `"Prisma Blog" <${process.env.APP_USER}>`,
          to: user.email,
          subject: "Verify your email for Prisma Blog",
          text: `Verify your email address:\n\n${verificationUrl}\n\nIf you didn't request this, ignore this email.`,
          html,
        });

        console.log("Verification email sent:", info.messageId);
      } catch (err) {
        console.error("Failed to send verification email:", err);
        throw err;
      }
    },
  },

  // ✅ FIX: close objects properly and place socialProviders inside main config
  socialProviders: {
    google: {
      prompt: "select_account consent",
      accessType: "offline",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
