import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultSqlitePath = path.resolve(__dirname, "../prisma/dev.db");
const sourceSqlitePath = process.env.SOURCE_SQLITE_PATH
  ? path.resolve(process.cwd(), process.env.SOURCE_SQLITE_PATH)
  : defaultSqlitePath;
const shouldForce = process.argv.includes("--force");

if (!process.env.DATABASE_URL?.startsWith("postgres")) {
  throw new Error("DATABASE_URL must point to PostgreSQL before importing SQLite data.");
}

if (!existsSync(sourceSqlitePath)) {
  throw new Error(`SQLite source database not found at ${sourceSqlitePath}`);
}

const prisma = new PrismaClient();
const sqlite = new DatabaseSync(sourceSqlitePath, { readonly: true });

function readTable(tableName) {
  return sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
}

function asDate(value) {
  return value ? new Date(value) : null;
}

function asBoolean(value) {
  return Boolean(value);
}

async function main() {
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0 && !shouldForce) {
    throw new Error(
      "Target PostgreSQL database already contains users. Re-run with --force to replace its data.",
    );
  }

  const users = readTable("User");
  const identities = readTable("AuthIdentity");
  const categoryPreferences = readTable("UserCategoryPreference");
  const passwordResetTokens = readTable("PasswordResetToken");

  console.log(
    `Importing ${users.length} users, ${identities.length} identities, ${categoryPreferences.length} category preferences, and ${passwordResetTokens.length} reset tokens from ${sourceSqlitePath}.`,
  );

  await prisma.$transaction(async (tx) => {
    if (existingUsers > 0 && shouldForce) {
      await tx.passwordResetToken.deleteMany();
      await tx.authIdentity.deleteMany();
      await tx.userCategoryPreference.deleteMany();
      await tx.user.deleteMany();
    }

    if (users.length > 0) {
      await tx.user.createMany({
        data: users.map((user) => ({
          id: String(user.id),
          name: String(user.name),
          email: String(user.email),
          password: user.password ? String(user.password) : null,
          profileImage: user.profileImage ? String(user.profileImage) : null,
          memberSince: asDate(user.memberSince) ?? new Date(),
          themePreference: String(user.themePreference ?? "system"),
          notificationPreference: String(user.notificationPreference ?? "daily"),
          autoSaveEnabled: asBoolean(user.autoSaveEnabled),
          currentOnboardingStep: Number(user.currentOnboardingStep ?? 1),
          onboardingCompletedAt: asDate(user.onboardingCompletedAt),
          emailVerifiedAt: asDate(user.emailVerifiedAt),
          createdAt: asDate(user.createdAt) ?? new Date(),
          updatedAt: asDate(user.updatedAt) ?? new Date(),
        })),
      });
    }

    if (identities.length > 0) {
      await tx.authIdentity.createMany({
        data: identities.map((identity) => ({
          id: String(identity.id),
          userId: String(identity.userId),
          provider: String(identity.provider),
          providerUserId: String(identity.providerUserId),
          providerEmail: identity.providerEmail ? String(identity.providerEmail) : null,
          createdAt: asDate(identity.createdAt) ?? new Date(),
          updatedAt: asDate(identity.updatedAt) ?? new Date(),
        })),
      });
    }

    if (categoryPreferences.length > 0) {
      await tx.userCategoryPreference.createMany({
        data: categoryPreferences.map((preference) => ({
          id: String(preference.id),
          userId: String(preference.userId),
          categoryKey: String(preference.categoryKey),
          createdAt: asDate(preference.createdAt) ?? new Date(),
        })),
      });
    }

    if (passwordResetTokens.length > 0) {
      await tx.passwordResetToken.createMany({
        data: passwordResetTokens.map((token) => ({
          id: String(token.id),
          userId: String(token.userId),
          tokenHash: String(token.tokenHash),
          expiresAt: asDate(token.expiresAt) ?? new Date(),
          usedAt: asDate(token.usedAt),
          createdAt: asDate(token.createdAt) ?? new Date(),
        })),
      });
    }
  });

  console.log("SQLite data imported into PostgreSQL successfully.");
}

try {
  await main();
} finally {
  sqlite.close();
  await prisma.$disconnect();
}
