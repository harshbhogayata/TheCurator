import {
  EventType,
  type AuthenticationResult,
  LogLevel,
  PublicClientApplication,
  type RedirectRequest,
} from "@azure/msal-browser";

export type EntraProvider = "entra" | "google" | "apple";
export type EntraIntentMode = "signin" | "signup" | "link";

interface PendingEntraIntent {
  createdAt: number;
  mode: EntraIntentMode;
  provider: EntraProvider;
}

const AUTH_INTENT_KEY = "curator_entra_intent";
const ENTRA_CLIENT_ID = import.meta.env.VITE_ENTRA_CLIENT_ID?.trim() || "";
const ENTRA_AUTHORITY = import.meta.env.VITE_ENTRA_AUTHORITY?.trim() || "";
const ENTRA_KNOWN_AUTHORITY = import.meta.env.VITE_ENTRA_KNOWN_AUTHORITY?.trim() || "";
const ENTRA_REDIRECT_PATH = import.meta.env.VITE_ENTRA_REDIRECT_PATH?.trim() || "/auth/callback";
const ENTRA_POST_LOGOUT_REDIRECT_PATH =
  import.meta.env.VITE_ENTRA_POST_LOGOUT_REDIRECT_PATH?.trim() || "/";

export const isEntraConfigured = Boolean(
  ENTRA_CLIENT_ID && ENTRA_AUTHORITY && ENTRA_KNOWN_AUTHORITY,
);

let msalInstancePromise: Promise<PublicClientApplication> | null = null;

function getAbsolutePath(pathname: string) {
  return new URL(pathname, window.location.origin).toString();
}

function getDomainHint(provider: EntraProvider) {
  if (provider === "google") {
    return "Google";
  }

  if (provider === "apple") {
    return "apple";
  }

  return undefined;
}

function persistEntraIntent(intent: PendingEntraIntent) {
  sessionStorage.setItem(AUTH_INTENT_KEY, JSON.stringify(intent));
}

function consumeEntraIntent(): PendingEntraIntent | null {
  const rawIntent = sessionStorage.getItem(AUTH_INTENT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);

  if (!rawIntent) {
    return null;
  }

  try {
    const intent = JSON.parse(rawIntent) as PendingEntraIntent;
    const isFresh = Date.now() - intent.createdAt < 10 * 60 * 1000;
    const isValidMode = ["signin", "signup", "link"].includes(intent.mode);
    const isValidProvider = ["entra", "google", "apple"].includes(intent.provider);

    if (!isFresh || !isValidMode || !isValidProvider) {
      return null;
    }

    return intent;
  } catch {
    return null;
  }
}

async function getMsalInstance() {
  if (!isEntraConfigured) {
    throw new Error("Microsoft Entra External ID is not configured yet.");
  }

  if (!msalInstancePromise) {
    msalInstancePromise = (async () => {
      const instance = new PublicClientApplication({
        auth: {
          authority: ENTRA_AUTHORITY,
          clientId: ENTRA_CLIENT_ID,
          knownAuthorities: [ENTRA_KNOWN_AUTHORITY],
          navigateToLoginRequestUrl: false,
          postLogoutRedirectUri: getAbsolutePath(ENTRA_POST_LOGOUT_REDIRECT_PATH),
          redirectUri: getAbsolutePath(ENTRA_REDIRECT_PATH),
        },
        cache: {
          cacheLocation: "sessionStorage",
          storeAuthStateInCookie: false,
        },
        system: {
          loggerOptions: {
            loggerCallback(level, message, containsPii) {
              if (containsPii) {
                return;
              }

              switch (level) {
                case LogLevel.Error:
                  console.error(message);
                  break;
                case LogLevel.Warning:
                  console.warn(message);
                  break;
                case LogLevel.Info:
                  console.info(message);
                  break;
                default:
                  console.debug(message);
              }
            },
          },
        },
      });

      await instance.initialize();

      if (!instance.getActiveAccount() && instance.getAllAccounts().length > 0) {
        instance.setActiveAccount(instance.getAllAccounts()[0]);
      }

      instance.addEventCallback((event) => {
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
          instance.setActiveAccount(event.payload.account);
        }
      });

      return instance;
    })();
  }

  return msalInstancePromise;
}

export async function beginEntraRedirect(mode: EntraIntentMode, provider: EntraProvider) {
  const instance = await getMsalInstance();
  const request: RedirectRequest = {
    redirectUri: getAbsolutePath(ENTRA_REDIRECT_PATH),
    scopes: [],
  };
  const domainHint = getDomainHint(provider);

  if (mode === "signup") {
    request.prompt = "create";
  } else if (mode === "link") {
    request.prompt = "select_account";
  }

  if (domainHint) {
    request.extraQueryParameters = {
      domain_hint: domainHint,
    };
  }

  persistEntraIntent({
    createdAt: Date.now(),
    mode,
    provider,
  });

  await instance.loginRedirect(request);
}

export async function handleEntraRedirectCallback(): Promise<{
  intent: PendingEntraIntent | null;
  result: AuthenticationResult | null;
}> {
  const instance = await getMsalInstance();
  const result = await instance.handleRedirectPromise();

  if (result?.account) {
    instance.setActiveAccount(result.account);
  }

  return {
    intent: consumeEntraIntent(),
    result,
  };
}

export async function logoutEntraIfPossible() {
  if (!isEntraConfigured) {
    return false;
  }

  const instance = await getMsalInstance();
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0];

  if (!account) {
    return false;
  }

  await instance.logoutRedirect({
    account,
    postLogoutRedirectUri: getAbsolutePath(ENTRA_POST_LOGOUT_REDIRECT_PATH),
  });

  return true;
}
