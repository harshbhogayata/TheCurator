// Canonical type scale — import these instead of hard-coding fontFamily/fontSize/lineHeight.
// Body text is intentionally excluded: it's user-controlled via ReadingPreferences.

export const type = {
  // Editorial display — hero moments only
  display: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  // Article headlines
  headline: {
    fontFamily: "Newsreader_700Bold_Italic",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  // Section titles, modal headers
  headlineMd: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.2,
  },
  // Sub-section and settings headers
  headlineSm: {
    fontFamily: "Newsreader_500Medium_Italic",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.1,
  },
  // Card titles, list headers
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 20,
    lineHeight: 26,
  },
  // Compact card titles
  titleSm: {
    fontFamily: "Newsreader_400Regular",
    fontSize: 15,
    lineHeight: 21,
  },
  // Lead paragraph (first paragraph of article)
  bodyLead: {
    fontFamily: "Newsreader_400Regular",
    fontSize: 19,
    lineHeight: 30,
  },
  // UI labels, buttons
  label: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSm: {
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 18,
  },
  // Supporting text, timestamps
  caption: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    lineHeight: 16,
  },
  // Category labels, section overlines
  overline: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2.5,
    textTransform: "uppercase" as const,
  },
} as const;
