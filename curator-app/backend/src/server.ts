import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { JWTPayload } from "jose";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || process.env.WEBSITES_PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "supersecret123";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || FRONTEND_URL;
const DEFAULT_PROFILE_IMAGE =
  "https://images.unsplash.com/photo-1723537742563-15c3d351dbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    console.error("[security] FATAL: JWT_SECRET environment variable is not set in production. Exiting.");
    process.exit(1);
  } else {
    console.warn("[security] JWT_SECRET not set — using insecure default. Never deploy without setting this.");
  }
}
const isAzure = Boolean(process.env.WEBSITE_SITE_NAME || process.env.WEBSITE_INSTANCE_ID);
const ENTRA_CLIENT_ID = process.env.ENTRA_CLIENT_ID || "";
const ENTRA_OPENID_CONFIG_URL = process.env.ENTRA_OPENID_CONFIG_URL || "";
const allowedOrigins = new Set(
  CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
);

const ALLOWED_CATEGORIES = [
  "technology",
  "politics",
  "business",
  "science",
  "culture",
  "climate",
  "health",
  "sports",
] as const;

const ALLOWED_THEMES = ["light", "dark", "system"] as const;
const ALLOWED_NOTIFICATION_PREFERENCES = ["daily", "breaking", "weekly", "none"] as const;
const PROVIDER_CONFIG = {
  entra: Boolean(ENTRA_CLIENT_ID && ENTRA_OPENID_CONFIG_URL),
  google:
    Boolean(ENTRA_CLIENT_ID && ENTRA_OPENID_CONFIG_URL) &&
    process.env.ENTRA_GOOGLE_ENABLED === "true",
  apple:
    Boolean(ENTRA_CLIENT_ID && ENTRA_OPENID_CONFIG_URL) &&
    process.env.ENTRA_APPLE_ENABLED === "true",
} as const;

type ThemePreference = (typeof ALLOWED_THEMES)[number];
type NotificationPreference = (typeof ALLOWED_NOTIFICATION_PREFERENCES)[number];
type ExternalIdentityProvider = "entra" | "google" | "apple";

interface EntraIdTokenClaims extends JWTPayload {
  email?: string;
  emails?: string[];
  idp?: string;
  identityProvider?: string;
  name?: string;
  oid?: string;
  preferred_username?: string;
  sub?: string;
}

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

interface PublicIdentity {
  provider: string;
  providerEmail: string | null;
}

interface SessionResponseBody {
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    memberSince: string;
    themePreference: ThemePreference;
  };
  onboarding: {
    currentStep: number;
    completed: boolean;
    selectedCategories: string[];
    themePreference: ThemePreference;
    notificationPreference: NotificationPreference;
    autoSaveEnabled: boolean;
  };
  identities: PublicIdentity[];
}

interface RequestError {
  message: string;
  statusCode: number;
}

interface EntraOpenIdConfiguration {
  issuer: string;
  jwks_uri: string;
}

type JoseModule = typeof import("jose");

let entraOpenIdConfigurationPromise: Promise<EntraOpenIdConfiguration> | null = null;
let entraJwks: ReturnType<JoseModule["createRemoteJWKSet"]> | null = null;
let joseModulePromise: Promise<JoseModule> | null = null;

if (isProduction || isAzure) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");
      callback(null, allowedOrigins.has(normalizedOrigin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function deriveDisplayName(email: string) {
  const base = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Curator Reader";
  return base
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function createAuthToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getAuthorizationToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

function formatMemberSince(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (ALLOWED_THEMES as readonly string[]).includes(value);
}

function isNotificationPreference(value: unknown): value is NotificationPreference {
  return (
    typeof value === "string" &&
    (ALLOWED_NOTIFICATION_PREFERENCES as readonly string[]).includes(value)
  );
}

function clampOnboardingStep(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.min(4, Math.max(1, Math.trunc(value)));
}

function isExternalIdentityProvider(value: unknown): value is ExternalIdentityProvider {
  return value === "entra" || value === "google" || value === "apple";
}

function createRequestError(message: string, statusCode: number): RequestError {
  return { message, statusCode };
}

function isRequestError(error: unknown): error is RequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    "statusCode" in error &&
    typeof (error as RequestError).message === "string" &&
    typeof (error as RequestError).statusCode === "number"
  );
}

async function getJoseModule() {
  if (!joseModulePromise) {
    joseModulePromise = import("jose");
  }

  return joseModulePromise;
}

async function getEntraOpenIdConfiguration() {
  if (!PROVIDER_CONFIG.entra) {
    throw createRequestError("Microsoft Entra External ID is not configured yet.", 503);
  }

  if (!entraOpenIdConfigurationPromise) {
    entraOpenIdConfigurationPromise = fetch(ENTRA_OPENID_CONFIG_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load Entra OpenID configuration: ${response.status}`);
        }

        return (await response.json()) as EntraOpenIdConfiguration;
      })
      .catch((error) => {
        entraOpenIdConfigurationPromise = null;
        throw error;
      });
  }

  return entraOpenIdConfigurationPromise;
}

async function verifyEntraIdToken(idToken: string) {
  const { createRemoteJWKSet, jwtVerify } = await getJoseModule();
  const metadata = await getEntraOpenIdConfiguration();

  if (!entraJwks) {
    entraJwks = createRemoteJWKSet(new URL(metadata.jwks_uri));
  }

  const verification = await jwtVerify(idToken, entraJwks, {
    audience: ENTRA_CLIENT_ID,
    issuer: metadata.issuer,
  });

  return verification.payload as EntraIdTokenClaims;
}

function extractEmailFromEntraClaims(payload: EntraIdTokenClaims) {
  if (typeof payload.email === "string" && payload.email.includes("@")) {
    return normalizeEmail(payload.email);
  }

  if (
    typeof payload.preferred_username === "string" &&
    payload.preferred_username.includes("@")
  ) {
    return normalizeEmail(payload.preferred_username);
  }

  if (Array.isArray(payload.emails)) {
    const email = payload.emails.find(
      (value): value is string => typeof value === "string" && value.includes("@"),
    );

    if (email) {
      return normalizeEmail(email);
    }
  }

  return null;
}

function resolveExternalProvider(
  payload: EntraIdTokenClaims,
  providerHint: ExternalIdentityProvider,
): ExternalIdentityProvider {
  if (providerHint !== "entra") {
    return providerHint;
  }

  const identityProvider = `${payload.idp ?? payload.identityProvider ?? ""}`.toLowerCase();

  if (identityProvider.includes("google")) {
    return "google";
  }

  if (identityProvider.includes("apple")) {
    return "apple";
  }

  return "entra";
}

function ensureIdentityProviderEnabled(provider: ExternalIdentityProvider) {
  if (!PROVIDER_CONFIG[provider]) {
    if (provider === "google" || provider === "apple") {
      throw createRequestError(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not enabled yet.`,
        503,
      );
    }

    throw createRequestError("Microsoft Entra External ID is not configured yet.", 503);
  }
}

async function exchangeEntraIdentitySession(params: {
  idToken: string;
  providerHint: ExternalIdentityProvider;
  linkUserId?: string;
}) {
  const claims = await verifyEntraIdToken(params.idToken);
  const providerUserId =
    typeof claims.oid === "string"
      ? claims.oid
      : typeof claims.sub === "string"
        ? claims.sub
        : null;

  if (!providerUserId) {
    throw createRequestError("We couldn't verify your identity from Microsoft Entra.", 401);
  }

  const provider = resolveExternalProvider(claims, params.providerHint);
  ensureIdentityProviderEnabled(provider);
  const email = extractEmailFromEntraClaims(claims);
  const displayName =
    typeof claims.name === "string" && claims.name.trim().length > 0
      ? claims.name.trim()
      : email
        ? deriveDisplayName(email)
        : "Curator Reader";
  const now = new Date();
  let userId = params.linkUserId ?? "";

  await prisma.$transaction(async (tx) => {
    if (params.linkUserId) {
      const currentUser = await tx.user.findUnique({
        where: { id: params.linkUserId },
      });

      if (!currentUser) {
        throw createRequestError("You need an active Curator session to link that account.", 401);
      }

      const existingIdentity = await tx.authIdentity.findUnique({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId,
          },
        },
      });

      if (existingIdentity && existingIdentity.userId !== params.linkUserId) {
        throw createRequestError(
          "That identity is already connected to another Curator account.",
          409,
        );
      }

      await tx.authIdentity.upsert({
        where: {
          provider_providerUserId: {
            provider,
            providerUserId,
          },
        },
        update: {
          providerEmail: email,
          userId: params.linkUserId,
        },
        create: {
          userId: params.linkUserId,
          provider,
          providerUserId,
          providerEmail: email,
        },
      });

      await tx.user.update({
        where: { id: params.linkUserId },
        data: {
          emailVerifiedAt: email && email === currentUser.email ? now : currentUser.emailVerifiedAt,
        },
      });

      return;
    }

    const existingIdentity = await tx.authIdentity.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
    });

    if (existingIdentity) {
      userId = existingIdentity.userId;
    } else if (email) {
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const createdUser = await tx.user.create({
          data: {
            name: displayName,
            email,
            password: null,
            profileImage: DEFAULT_PROFILE_IMAGE,
            currentOnboardingStep: 2,
            emailVerifiedAt: now,
          },
        });

        userId = createdUser.id;
      }
    } else {
      throw createRequestError(
        "Your identity provider did not return an email address that Curator can use yet.",
        400,
      );
    }

    await tx.authIdentity.upsert({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      update: {
        providerEmail: email,
        userId,
      },
      create: {
        userId,
        provider,
        providerUserId,
        providerEmail: email,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: email ? now : undefined,
      },
    });
  });

  const session = await getSessionPayload(userId);

  if (!session) {
    throw createRequestError("Unable to load your Curator session right now.", 500);
  }

  return {
    token: createAuthToken(userId),
    ...session,
  };
}

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    if (!isProduction) {
      console.log(`[password-reset] ${email}: ${resetUrl}`);
    }
    return { delivered: false, previewUrl: resetUrl };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Reset your The Curator password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #18181b;">
          <h1 style="font-size: 24px;">Reset your password</h1>
          <p>We received a request to reset your The Curator password.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: #18181b; color: #ffffff; text-decoration: none;">
              Reset Password
            </a>
          </p>
          <p>If you did not request this, you can ignore this email.</p>
          <p>This link expires in 30 minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send reset email: ${errorText}`);
  }

  return { delivered: true };
}

async function ensureEmailIdentity(userId: string, email: string) {
  await prisma.authIdentity.upsert({
    where: {
      provider_providerUserId: {
        provider: "email",
        providerUserId: email,
      },
    },
    update: {
      providerEmail: email,
      userId,
    },
    create: {
      userId,
      provider: "email",
      providerUserId: email,
      providerEmail: email,
    },
  });
}

function serializeSessionData(user: {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  memberSince: Date;
  themePreference: string;
  notificationPreference: string;
  autoSaveEnabled: boolean;
  currentOnboardingStep: number;
  onboardingCompletedAt: Date | null;
  categoryPreferences: { categoryKey: string }[];
  identities: { provider: string; providerEmail: string | null }[];
}): SessionResponseBody {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      memberSince: formatMemberSince(user.memberSince),
      themePreference: isThemePreference(user.themePreference) ? user.themePreference : "system",
    },
    onboarding: {
      currentStep: clampOnboardingStep(user.currentOnboardingStep) ?? 1,
      completed: Boolean(user.onboardingCompletedAt),
      selectedCategories: user.categoryPreferences.map((entry) => entry.categoryKey),
      themePreference: isThemePreference(user.themePreference) ? user.themePreference : "system",
      notificationPreference: isNotificationPreference(user.notificationPreference)
        ? user.notificationPreference
        : "daily",
      autoSaveEnabled: user.autoSaveEnabled,
    },
    identities: user.identities.map((identity) => ({
      provider: identity.provider,
      providerEmail: identity.providerEmail,
    })),
  };
}

async function getSessionPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      categoryPreferences: {
        orderBy: { createdAt: "asc" },
      },
      identities: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    return null;
  }

  return serializeSessionData(user);
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = getAuthorizationToken(req);

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.authUserId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

app.get("/api/auth/providers", (_req, res) => {
  res.json({
    providers: {
      entra: PROVIDER_CONFIG.entra,
      google: PROVIDER_CONFIG.google,
      apple: PROVIDER_CONFIG.apple,
    },
  });
});

app.post("/api/auth/register", async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");
  const requestedName = String(req.body?.name || "").trim();

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Enter a valid email address" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: requestedName || deriveDisplayName(email),
        email,
        password: hashedPassword,
        profileImage: DEFAULT_PROFILE_IMAGE,
        currentOnboardingStep: 2,
      },
    });

    await ensureEmailIdentity(user.id, email);
    const session = await getSessionPayload(user.id);

    if (!session) {
      res.status(500).json({ error: "Unable to start onboarding" });
      return;
    }

    res.status(201).json({
      token: createAuthToken(user.id),
      ...session,
    });
  } catch (error) {
    console.error("register failed", error);
    res.status(500).json({ error: "Unable to create your account right now" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));
  const password = String(req.body?.password || "");

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    await ensureEmailIdentity(user.id, email);
    const session = await getSessionPayload(user.id);

    if (!session) {
      res.status(500).json({ error: "Unable to load your session" });
      return;
    }

    res.json({
      token: createAuthToken(user.id),
      ...session,
    });
  } catch (error) {
    console.error("login failed", error);
    res.status(500).json({ error: "Unable to sign in right now" });
  }
});

app.post("/api/auth/entra/session", async (req, res) => {
  const idToken = String(req.body?.idToken || "");
  const providerHint = isExternalIdentityProvider(req.body?.providerHint)
    ? req.body.providerHint
    : "entra";

  if (!idToken) {
    res.status(400).json({ error: "Identity token is required" });
    return;
  }

  try {
    const session = await exchangeEntraIdentitySession({
      idToken,
      providerHint,
    });

    res.json(session);
  } catch (error) {
    console.error("entra session exchange failed", error);
    res.status(isRequestError(error) ? error.statusCode : 500).json({
      error: isRequestError(error)
        ? error.message
        : "Unable to complete Microsoft Entra sign-in right now.",
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const session = await getSessionPayload(req.authUserId!);

  if (!session) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(session);
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const email = normalizeEmail(String(req.body?.email || ""));

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Enter a valid email address" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    let previewUrl: string | undefined;

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashValue(rawToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
      const result = await sendPasswordResetEmail(email, resetUrl);
      previewUrl = result.delivered ? undefined : result.previewUrl;
    }

    res.json({
      message: "If an account exists for that email, reset instructions have been sent.",
      previewUrl,
    });
  } catch (error) {
    console.error("forgot password failed", error);
    res.status(500).json({ error: "Unable to start password reset right now" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const password = String(req.body?.password || "");

  if (!token) {
    res.status(400).json({ error: "Reset token is required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashValue(token) },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: "This reset link is invalid or has expired" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          usedAt: null,
          id: { not: resetToken.id },
        },
        data: { usedAt: new Date() },
      }),
    ]);

    const session = await getSessionPayload(resetToken.userId);

    if (!session) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      token: createAuthToken(resetToken.userId),
      ...session,
    });
  } catch (error) {
    console.error("reset password failed", error);
    res.status(500).json({ error: "Unable to reset password right now" });
  }
});

app.get("/api/onboarding", requireAuth, async (req: AuthenticatedRequest, res) => {
  const session = await getSessionPayload(req.authUserId!);

  if (!session) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ onboarding: session.onboarding });
});

app.put("/api/onboarding", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUserId!;
  const currentStep = clampOnboardingStep(req.body?.currentStep);
  const selectedCategories = Array.isArray(req.body?.selectedCategories)
    ? req.body.selectedCategories.filter((value: unknown): value is string => typeof value === "string")
    : null;
  const themePreference = req.body?.themePreference;
  const notificationPreference = req.body?.notificationPreference;
  const autoSaveEnabled =
    typeof req.body?.autoSaveEnabled === "boolean" ? req.body.autoSaveEnabled : null;

  if (selectedCategories) {
    const invalidCategory = selectedCategories.find(
      (category: string) =>
        !ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number]),
    );

    if (invalidCategory) {
      res.status(400).json({ error: "One or more selected categories are invalid" });
      return;
    }
  }

  if (themePreference !== undefined && !isThemePreference(themePreference)) {
    res.status(400).json({ error: "Theme preference is invalid" });
    return;
  }

  if (
    notificationPreference !== undefined &&
    !isNotificationPreference(notificationPreference)
  ) {
    res.status(400).json({ error: "Notification preference is invalid" });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (currentStep !== null) {
        updateData.currentOnboardingStep = currentStep;
      }

      if (themePreference !== undefined) {
        updateData.themePreference = themePreference;
      }

      if (notificationPreference !== undefined) {
        updateData.notificationPreference = notificationPreference;
      }

      if (autoSaveEnabled !== null) {
        updateData.autoSaveEnabled = autoSaveEnabled;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: updateData,
        });
      }

      if (selectedCategories) {
        await tx.userCategoryPreference.deleteMany({
          where: { userId },
        });

        if (selectedCategories.length > 0) {
          await tx.userCategoryPreference.createMany({
            data: selectedCategories.map((categoryKey: string) => ({
              userId,
              categoryKey,
            })),
          });
        }
      }
    });

    const session = await getSessionPayload(userId);

    if (!session) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ onboarding: session.onboarding, user: session.user });
  } catch (error) {
    console.error("update onboarding failed", error);
    res.status(500).json({ error: "Unable to save onboarding progress" });
  }
});

app.post("/api/onboarding/complete", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUserId!;
  const session = await getSessionPayload(userId);

  if (!session) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (session.onboarding.selectedCategories.length < 3) {
    res.status(400).json({ error: "Select at least 3 categories to continue" });
    return;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompletedAt: new Date(),
        currentOnboardingStep: 4,
      },
    });

    const refreshedSession = await getSessionPayload(userId);

    if (!refreshedSession) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(refreshedSession);
  } catch (error) {
    console.error("complete onboarding failed", error);
    res.status(500).json({ error: "Unable to complete onboarding" });
  }
});

app.get("/api/account/identities", requireAuth, async (req: AuthenticatedRequest, res) => {
  const session = await getSessionPayload(req.authUserId!);

  if (!session) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ identities: session.identities });
});

app.post("/api/account/identities/link", requireAuth, async (req: AuthenticatedRequest, res) => {
  const idToken = String(req.body?.idToken || "");
  const providerHint = isExternalIdentityProvider(req.body?.providerHint)
    ? req.body.providerHint
    : "entra";

  if (!idToken) {
    res.status(400).json({ error: "Identity token is required" });
    return;
  }

  try {
    const session = await exchangeEntraIdentitySession({
      idToken,
      providerHint,
      linkUserId: req.authUserId,
    });

    res.json({
      user: session.user,
      onboarding: session.onboarding,
      identities: session.identities,
    });
  } catch (error) {
    console.error("identity link failed", error);
    res.status(isRequestError(error) ? error.statusCode : 500).json({
      error: isRequestError(error)
        ? error.message
        : "Unable to connect that identity right now.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
