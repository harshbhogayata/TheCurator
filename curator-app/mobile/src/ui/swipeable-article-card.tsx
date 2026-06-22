import React, { memo, useRef, useCallback } from "react";
import { View, Pressable } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Bookmark, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "../providers/theme-provider";
import { useSavedArticles } from "../providers/saved-articles-provider";
import { ArticleCard } from "./article-card";
import type { Article } from "../data/articles";

interface SwipeableArticleCardProps {
  article: Article;
  onRemove?: () => void;
  showSaveButton?: boolean;
  enableSaveSwipe?: boolean;
  removeSwipeDirection?: "left" | "right";
}

function SwipeableArticleCardInner({
  article,
  onRemove,
  showSaveButton = false,
  enableSaveSwipe = true,
  removeSwipeDirection = "left",
}: SwipeableArticleCardProps) {
  const { palette } = useTheme();
  const { isArticleSaved, saveArticle, unsaveArticle } = useSavedArticles();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const savedState = isArticleSaved(article.id);
  const isSaved = savedState === true;

  const close = useCallback(() => swipeableRef.current?.close(), []);

  const handleToggleSave = useCallback(() => {
    if (savedState === null) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSaved) unsaveArticle(article.id);
    else saveArticle(article.id);
    close();
  }, [savedState, isSaved, article.id, saveArticle, unsaveArticle, close]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    close();
    onRemove?.();
  }, [close, onRemove]);

  const renderSaveAction = useCallback(() => (
    <View
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        paddingRight: 12,
      }}
    >
      <Pressable
        onPress={handleToggleSave}
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: isSaved ? palette.surfaceContainerHigh : palette.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bookmark
          size={20}
          color={isSaved ? palette.onSurface : palette.primaryForeground}
          fill={isSaved ? palette.onSurface : palette.primaryForeground}
        />
      </Pressable>
    </View>
  ), [handleToggleSave, isSaved, palette]);

  const renderDeleteLeftAction = useCallback(() => {
    if (!onRemove) return null;
    return (
      <View
        style={{
          justifyContent: "center",
          alignItems: "flex-start",
          paddingRight: 12,
        }}
      >
        <Pressable
          onPress={handleRemove}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: palette.error,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={20} color="#ffffff" />
        </Pressable>
      </View>
    );
  }, [handleRemove, onRemove, palette]);

  const renderDeleteRightAction = useCallback(() => {
    if (!onRemove) return null;
    return (
      <View
        style={{
          justifyContent: "center",
          alignItems: "flex-end",
          paddingLeft: 12,
        }}
      >
        <Pressable
          onPress={handleRemove}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: palette.error,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={20} color="#ffffff" />
        </Pressable>
      </View>
    );
  }, [handleRemove, onRemove, palette]);

  const leftActionsRenderer =
    onRemove && removeSwipeDirection === "right"
      ? renderDeleteLeftAction
      : enableSaveSwipe
        ? renderSaveAction
        : undefined;

  const rightActionsRenderer =
    onRemove && removeSwipeDirection === "left"
      ? renderDeleteRightAction
      : undefined;

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={leftActionsRenderer ? 50 : 10000}
      rightThreshold={rightActionsRenderer ? 50 : 10000}
      renderLeftActions={leftActionsRenderer}
      renderRightActions={rightActionsRenderer}
    >
      <ArticleCard
        article={article}
        variant="compact"
        showSaveButton={showSaveButton}
      />
    </ReanimatedSwipeable>
  );
}

export const SwipeableArticleCard = memo(SwipeableArticleCardInner);
