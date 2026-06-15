export type RazorpayOrderCheckout = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  prefill?: { email?: string; name?: string };
};

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay script failed to load"));
    document.body.appendChild(script);
  });
}

function resolveKeyId(serverKeyId: string): string {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || serverKeyId;
}

/** Standard Checkout — order_id flow per Razorpay docs. */
export async function openStandardRazorpayCheckout(
  order: RazorpayOrderCheckout,
): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay checkout is unavailable.");
  }

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({
      key: resolveKeyId(order.keyId),
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: order.name ?? "The Curator",
      description: order.description ?? "Subscription",
      prefill: order.prefill ?? {},
      theme: { color: "#31332b" },
      handler: (response: RazorpaySuccessResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    });

    checkout.on("payment.failed", (response: { error?: { description?: string } }) => {
      reject(new Error(response?.error?.description ?? "Payment failed"));
    });

    checkout.open();
  });
}

export type RazorpayCheckoutPayload = {
  provider: "razorpay";
  mode: "order" | "subscription";
  keyId: string;
  tier: string;
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  currency?: string;
  prefill?: { email?: string; name?: string };
  name: string;
  description: string;
  callbackUrl: string;
};

/** Legacy subscription + order payload from /api/billing/v1/checkout/ */
export async function openRazorpayCheckout(
  payload: RazorpayCheckoutPayload,
  onSuccess: (response: RazorpaySuccessResponse & { razorpay_subscription_id?: string }) => void | Promise<void>,
): Promise<void> {
  if (payload.mode === "order" && payload.orderId && payload.amount && payload.currency) {
    const response = await openStandardRazorpayCheckout({
      keyId: payload.keyId,
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      name: payload.name,
      description: payload.description,
      prefill: payload.prefill,
    });
    await onSuccess(response);
    return;
  }

  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");

  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      key: resolveKeyId(payload.keyId),
      name: payload.name,
      description: payload.description,
      prefill: payload.prefill ?? {},
      theme: { color: "#31332b" },
      subscription_id: payload.subscriptionId,
      handler: (response: RazorpaySuccessResponse & { razorpay_subscription_id?: string }) => {
        Promise.resolve(onSuccess(response)).then(resolve).catch(reject);
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    };

    const checkout = new window.Razorpay!(options);
    checkout.on("payment.failed", (response: { error?: { description?: string } }) => {
      reject(new Error(response?.error?.description ?? "Payment failed"));
    });
    checkout.open();
  });
}
