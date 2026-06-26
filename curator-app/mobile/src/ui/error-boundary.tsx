import React, { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AppErrorBoundaryState {
  hasError: boolean;
}

interface AppErrorBoundaryProps extends PropsWithChildren {
  onReset?: () => void;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error("AppErrorBoundary caught:", error, info.componentStack);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Something went wrong
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.3}>
            The Curator hit an unexpected error. You can try again without restarting the app.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try again"
            onPress={this.handleReset}
            style={styles.button}
          >
            <Text style={styles.buttonLabel} maxFontSizeMultiplier={1.2}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontFamily: "Newsreader_500Medium",
    fontSize: 28,
    textAlign: "center",
  },
  body: {
    fontFamily: "Manrope_400Regular",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.8,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  buttonLabel: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
    color: "#ffffff",
  },
});
