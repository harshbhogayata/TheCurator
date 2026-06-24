import React, { memo, useCallback, useLayoutEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import { Bookmark, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "../providers/theme-provider";
import { useSavedArticles } from "../providers/saved-articles-provider";
import { ArticleCard } from "./article-card";
import type { Article } from "../data/articles";

const ACTION_WIDTH = 80;

interface SwipeableArticleCardProps {
  article: Article;
  onRemove?: () => void;
  showSaveButton?: boolean;
  enableSaveSwipe?: boolean;
  /** Swipe row right to reveal delete (saved list pattern). */
  removeSwipeDirection?: "left" | "right";
  onSwipeRowOpen?: (articleId: string) => void;
  registerSwipeRow?: (articleId: string, methods: SwipeableMethods | null) => void;
}

function SwipeableArticleCardInner({
  article,
  onRemove,
  showSaveButton = false,
  enableSaveSwipe = true,
  removeSwipeDirection = "left",
  onSwipeRowOpen,
  registerSwipeRow,
}: SwipeableArticleCardProps) {
  const { palette } = useTheme();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const savedState = isArticleSaved(article.id);
  const isSaved = savedState === true;

  useLayoutEffect(() => {
    registerSwipeRow?.(article.id, swipeableRef.current);
    return () => registerSwipeRow?.(article.id, null);
  }, [article.id, registerSwipeRow]);

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const handleToggleSave = useCallback(() => {
    if (savedState === null) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved) unsaveArticle(article.id);
    else saveArticle(article.id);
    close();
  }, [savedState, isSaved, article.id, saveArticle, unsaveArticle, close]);

  const handleRemove = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    close();
    onRemove?.();
  }, [close, onRemove]);

  const handleSwipeWillOpen = useCallback(() => {
    registerSwipeRow?.(article.id, swipeableRef.current);
    onSwipeRowOpen?.(article.id);
  }, [article.id, onSwipeRowOpen, registerSwipeRow]);

  const renderSaveAction = useCallback(
    () => (
      <View style={styles.actionSlot}>
        <RectButton
          onPress={handleToggleSave}
          style={[
            styles.actionButton,
            {
              backgroundColor: isSaved ? palette.surfaceContainerHigh : palette.primary,
            },
          ]}
        >
          <Bookmark
            size={20}
            color={isSaved ? palette.onSurface : palette.primaryForeground}
            fill={isSaved ? palette.onSurface : palette.primaryForeground}
          />
        </RectButton>
      </View>
    ),
    [handleToggleSave, isSaved, palette],
  );

  const renderDeleteAction = useCallback(
    () => (
      <View style={styles.actionSlot}>
        <RectButton
          onPress={handleRemove}
          style={[styles.actionButton, { backgroundColor: palette.error }]}
        >
          <Trash2 size={20} color="#ffffff" />
        </RectButton>
      </View>
    ),
    [handleRemove, palette.error],
  );

  const revealDeleteOnRightSwipe = removeSwipeDirection === "right";
  const leftActionsRenderer = revealDeleteOnRightSwipe
    ? onRemove
      ? renderDeleteAction
      : undefined
    : enableSaveSwipe
      ? renderSaveAction
      : undefined;

  const rightActionsRenderer =
    !revealDeleteOnRightSwipe && onRemove ? renderDeleteAction : undefined;

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      dragOffsetFromLeftEdge={16}
      dragOffsetFromRightEdge={16}
      leftThreshold={leftActionsRenderer ? ACTION_WIDTH / 2 : 10_000}
      rightThreshold={rightActionsRenderer ? ACTION_WIDTH / 2 : 10_000}
      containerStyle={styles.container}
      childrenContainerStyle={[
        styles.childContainer,
        { backgroundColor: palette.background },
      ]}
      renderLeftActions={leftActionsRenderer}
      renderRightActions={rightActionsRenderer}
      onSwipeableWillOpen={handleSwipeWillOpen}
    >
      <ArticleCard
        article={article}
        variant="compact"
        showSaveButton={showSaveButton}
        gestureChild
      />
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  childContainer: {
    flex: 1,
  },
  actionSlot: {
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});

export const SwipeableArticleCard = memo(SwipeableArticleCardInner);
