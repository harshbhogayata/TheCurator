import { Linking, Pressable } from "react-native";

import { SUPPORT_EMAIL } from "../constants/site";
import { collectionsTierHelpText, subscriptionCancelHelpText } from "./tier-copy";

export interface HelpFaqItem {
  category: string;
  question: string;
  answer: string;
}

export function buildHelpFaqs(): HelpFaqItem[] {
  return [
    {
      category: "Getting Started",
      question: "What is The Curator?",
      answer:
        "The Curator is a premium journalism platform that synthesizes news from trusted global sources into concise, balanced narratives. We distill complex stories into the essential insights you need to stay informed.",
    },
    {
      category: "Getting Started",
      question: "How do I create an account?",
      answer:
        'Tap "Get Started" on the welcome screen, then create an account with your email and password. You\'ll have immediate access to free reading, with the option to upgrade for audio and more saves.',
    },
    {
      category: "Getting Started",
      question: "How do I change my display name or export my data?",
      answer:
        "Open Menu → your profile card (or the avatar in the header) → Account Details. You can edit your display name there and request a data export.",
    },
    {
      category: "Subscription",
      question: "What are the subscription tiers?",
      answer:
        "Free (ad-supported, 25 saves). Basic (₹499/month — ad-free, narrated briefs, collections, 100 saves). Premium (₹1,499/month — full article narration, unlimited saves). Lifetime (₹24,999 one-time — permanent Premium access). See Support Us for current pricing.",
    },
    {
      category: "Subscription",
      question: "Can I cancel my subscription?",
      answer: subscriptionCancelHelpText(),
    },
    {
      category: "Features",
      question: "What are Audio Briefs?",
      answer:
        "Audio Briefs are narrated daily digests of the editorial brief. Basic and above unlock brief audio. Premium and Lifetime add full article narration.",
    },
    {
      category: "Features",
      question: "How many articles can I save?",
      answer:
        "Free: 25 saves. Basic: 100 saves. Premium and Lifetime: unlimited saves. " + collectionsTierHelpText(),
    },
    {
      category: "Features",
      question: "What are source insights?",
      answer:
        "Source insights show which publications contributed to each narrative, helping you understand different perspectives and dig deeper into stories that interest you.",
    },
    {
      category: "Technical",
      question: "Which devices are supported?",
      answer:
        "The Curator is available as a mobile app for iOS and Android. A desktop web experience is planned.",
    },
    {
      category: "Technical",
      question: "Is my data secure?",
      answer:
        "Yes. We use industry-standard encryption, secure servers, and never sell your personal data. Read our Privacy Policy for details.",
    },
  ];
}

export async function openSupportEmail(): Promise<void> {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("The Curator — Support")}`;
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}
