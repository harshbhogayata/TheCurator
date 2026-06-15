import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ChevronDown, ChevronUp, Mail, MessageCircle } from "lucide-react-native";

import { useTheme } from "../../src/providers/theme-provider";
import { SUPPORT_EMAIL } from "../../src/constants/site";
import { PillPageHeader } from "../../src/ui/pill-page-header";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is The Curator?",
    answer:
      "The Curator is a premium journalism platform that synthesizes news from 10+ global sources into concise, balanced narratives. We distill complex stories into essential insights you need to stay informed.",
  },
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer:
      'Tap "Get Started" on the welcome screen, then create an account with your email and password. You\'ll have immediate access to free features, with the option to upgrade for premium content.',
  },
  {
    category: "Subscription",
    question: "What are the subscription tiers?",
    answer:
      "We offer 3 paid tiers: Basic ($5/month - ad-free, 50 saves), Premium ($15/month - audio, unlimited saves, exclusive content), and Lifetime ($299 one-time - all Premium features forever).",
  },
  {
    category: "Subscription",
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel anytime from Settings. Your access continues until the end of your billing period. Lifetime subscriptions cannot be cancelled as they are one-time purchases.",
  },
  {
    category: "Features",
    question: "What are Audio Briefs?",
    answer:
      "Audio Briefs are professionally narrated versions of our daily digests and articles. Available for Premium and Lifetime members, perfect for listening during commutes or workouts.",
  },
  {
    category: "Features",
    question: "How many articles can I save?",
    answer:
      "Free users get 25 saves, Basic tier gets 50, and Premium/Lifetime tiers get unlimited saves organized in custom collections.",
  },
  {
    category: "Features",
    question: "What are source insights?",
    answer:
      "Source insights show you which publications contributed to each narrative, helping you understand different perspectives and dig deeper into stories that interest you.",
  },
  {
    category: "Technical",
    question: "Which devices are supported?",
    answer:
      "The Curator is available as a mobile app for iOS and Android, as well as a web app for desktop browsers.",
  },
  {
    category: "Technical",
    question: "Is my data secure?",
    answer:
      "Yes. We use industry-standard encryption, secure servers, and never sell your personal data. Read our Privacy Policy for details.",
  },
];

const categories = ["All", "Getting Started", "Subscription", "Features", "Technical"];

export default function HelpScreen() {
  const { palette } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      searchQuery === "" ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <PillPageHeader title="Help & Support" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
        >
          <Search size={18} color={palette.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for help..."
            placeholderTextColor={palette.onSurfaceVariant + "80"}
            style={{
              flex: 1,
              fontFamily: "Manrope_400Regular",
              fontSize: 15,
              color: palette.onSurface,
              paddingVertical: 14,
              paddingHorizontal: 10,
            }}
          />
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={{
                backgroundColor: selectedCategory === category ? palette.inverseSurface : palette.surfaceContainerLow,
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Manrope_500Medium",
                  fontSize: 13,
                  color: selectedCategory === category ? palette.inverseOnSurface : palette.onSurface,
                }}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* FAQ Title */}
        <Text
          style={{
            fontFamily: "Newsreader_700Bold",
            fontSize: 22,
            color: palette.onSurface,
            marginBottom: 12,
          }}
        >
          Frequently Asked Questions
        </Text>

        {/* FAQ Items */}
        {filteredFAQs.length === 0 ? (
          <View
            style={{
              backgroundColor: palette.surfaceContainerLowest,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.outlineVariant + "26",
              padding: 40,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Manrope_400Regular",
                fontSize: 14,
                color: palette.onSurfaceVariant,
              }}
            >
              No results found. Try a different search term.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8, marginBottom: 24 }}>
            {filteredFAQs.map((faq, index) => {
              const isExpanded = expandedIndex === index;
              return (
                <View
                  key={`${faq.category}-${index}`}
                  style={{
                    backgroundColor: palette.surfaceContainerLowest,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: palette.outlineVariant + "26",
                    overflow: "hidden",
                  }}
                >
                  <Pressable
                    onPress={() => setExpandedIndex(isExpanded ? null : index)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 16,
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "Manrope_600SemiBold",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          color: palette.onSurfaceVariant,
                          marginBottom: 4,
                        }}
                      >
                        {faq.category}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Manrope_600SemiBold",
                          fontSize: 15,
                          color: palette.onSurface,
                        }}
                      >
                        {faq.question}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={18} color={palette.onSurfaceVariant} />
                    ) : (
                      <ChevronDown size={18} color={palette.onSurfaceVariant} />
                    )}
                  </Pressable>

                  {isExpanded && (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                      <Text
                        style={{
                          fontFamily: "Manrope_400Regular",
                          fontSize: 14,
                          color: palette.onSurfaceVariant,
                          lineHeight: 22,
                        }}
                      >
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Contact Support */}
        <View
          style={{
            backgroundColor: palette.surfaceContainerLowest,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: palette.outlineVariant + "26",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "Newsreader_700Bold",
              fontSize: 22,
              color: palette.onSurface,
              marginBottom: 8,
            }}
          >
            Still Need Help?
          </Text>
          <Text
            style={{
              fontFamily: "Manrope_400Regular",
              fontSize: 14,
              color: palette.onSurfaceVariant,
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            Can't find what you're looking for? Our support team is here to help.
          </Text>

          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: palette.surfaceContainerLow,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={20} color={palette.onPrimaryContainer} />
              </View>
              <View>
                <Text style={{ fontFamily: "Manrope_500Medium", fontSize: 15, color: palette.onSurface }}>
                  Email Support
                </Text>
                <Text style={{ fontFamily: "Manrope_400Regular", fontSize: 13, color: palette.onSurfaceVariant }}>
                  {SUPPORT_EMAIL}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: palette.surfaceContainerLow,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: palette.secondaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={20} color={palette.onSecondaryContainer} />
              </View>
              <View>
                <Text style={{ fontFamily: "Manrope_500Medium", fontSize: 15, color: palette.onSurface }}>
                  Live Chat
                </Text>
                <Text style={{ fontFamily: "Manrope_400Regular", fontSize: 13, color: palette.onSurfaceVariant }}>
                  Available 9am-5pm EST
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
