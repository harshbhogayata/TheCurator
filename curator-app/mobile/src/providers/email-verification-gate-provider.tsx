import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  needsEmailVerification,
  UNVERIFIED_ARTICLE_READ_LIMIT,
  unverifiedArticleStorageKey,
} from "../lib/email-verification";
import { useAuth } from "./auth-provider";
import { VerifyEmailGateModal } from "../ui/verify-email-gate-modal";

export type VerifyGateReason = "article_limit" | "save" | "collection" | "general";

interface EmailVerificationGateContextValue {
  needsVerify: boolean;
  openedArticleCount: number;
  remainingArticleReads: number;
  isLockedOut: boolean;
  canOpenArticle: (articleId: string) => boolean;
  registerArticleOpen: (articleId: string) => boolean;
  requireVerifiedEmail: (reason: VerifyGateReason) => boolean;
  showVerifyPrompt: (reason: VerifyGateReason) => void;
}

const EmailVerificationGateContext = createContext<EmailVerificationGateContextValue | null>(null);

async function loadOpenedArticleIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(unverifiedArticleStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

async function persistOpenedArticleIds(userId: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(unverifiedArticleStorageKey(userId), JSON.stringify(ids));
}

export function EmailVerificationGateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const needsVerify = needsEmailVerification(session);
  const [openedArticleIds, setOpenedArticleIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalReason, setModalReason] = useState<VerifyGateReason | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    if (!userId || !needsVerify) {
      setOpenedArticleIds([]);
      setHydrated(true);
      return;
    }

    void loadOpenedArticleIds(userId).then((ids) => {
      if (!cancelled) {
        setOpenedArticleIds(ids);
        setHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId, needsVerify]);

  useEffect(() => {
    if (!needsVerify && userId) {
      void AsyncStorage.removeItem(unverifiedArticleStorageKey(userId));
      setOpenedArticleIds([]);
    }
  }, [needsVerify, userId]);

  const showVerifyPrompt = useCallback((reason: VerifyGateReason) => {
    setModalReason(reason);
  }, []);

  const canOpenArticle = useCallback(
    (articleId: string) => {
      if (!needsVerify || !hydrated) return true;
      if (openedArticleIds.includes(articleId)) return true;
      return openedArticleIds.length < UNVERIFIED_ARTICLE_READ_LIMIT;
    },
    [hydrated, needsVerify, openedArticleIds],
  );

  const registerArticleOpen = useCallback(
    (articleId: string) => {
      if (!needsVerify || !hydrated || !userId) return true;
      if (openedArticleIds.includes(articleId)) return true;

      if (openedArticleIds.length >= UNVERIFIED_ARTICLE_READ_LIMIT) {
        showVerifyPrompt("article_limit");
        return false;
      }

      const next = [...openedArticleIds, articleId];
      setOpenedArticleIds(next);
      void persistOpenedArticleIds(userId, next);
      return true;
    },
    [hydrated, needsVerify, openedArticleIds, showVerifyPrompt, userId],
  );

  const requireVerifiedEmail = useCallback(
    (reason: VerifyGateReason) => {
      if (!needsVerify) return true;
      showVerifyPrompt(reason);
      return false;
    },
    [needsVerify, showVerifyPrompt],
  );

  const openedArticleCount = openedArticleIds.length;
  const remainingArticleReads = Math.max(
    0,
    UNVERIFIED_ARTICLE_READ_LIMIT - openedArticleCount,
  );
  const isLockedOut =
    needsVerify && hydrated && openedArticleCount >= UNVERIFIED_ARTICLE_READ_LIMIT;

  useEffect(() => {
    if (isLockedOut) {
      setModalReason("article_limit");
    } else if (modalReason === "article_limit") {
      setModalReason(null);
    }
  }, [isLockedOut, modalReason]);

  const value = useMemo(
    () => ({
      needsVerify,
      openedArticleCount,
      remainingArticleReads,
      isLockedOut,
      canOpenArticle,
      registerArticleOpen,
      requireVerifiedEmail,
      showVerifyPrompt,
    }),
    [
      canOpenArticle,
      isLockedOut,
      needsVerify,
      openedArticleCount,
      registerArticleOpen,
      remainingArticleReads,
      requireVerifiedEmail,
      showVerifyPrompt,
    ],
  );

  return (
    <EmailVerificationGateContext.Provider value={value}>
      {children}
      <VerifyEmailGateModal
        visible={modalReason !== null}
        reason={modalReason ?? "general"}
        onClose={() => setModalReason(null)}
        dismissible={modalReason !== "article_limit" && !isLockedOut}
      />
    </EmailVerificationGateContext.Provider>
  );
}

export function useEmailVerificationGate() {
  const context = useContext(EmailVerificationGateContext);
  if (!context) {
    throw new Error("useEmailVerificationGate must be used within EmailVerificationGateProvider");
  }
  return context;
}
