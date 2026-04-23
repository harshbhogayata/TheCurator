import { useState } from 'react';
import { useReadingPreferences } from '../context/ReadingPreferencesContext';

interface ArticleReactionsProps {
  articleId: string;
}

export function ArticleReactions({ articleId }: ArticleReactionsProps) {
  const { getReaction, setReaction, removeReaction } = useReadingPreferences();
  const currentReaction = getReaction(articleId);
  const [showReactions, setShowReactions] = useState(false);
  
  const reactions = [
    { id: 'insightful' as const, emoji: '👏', label: 'Insightful' },
    { id: 'important' as const, emoji: '🔥', label: 'Important' },
    { id: 'eyeopening' as const, emoji: '💡', label: 'Eye-opening' }
  ];
  
  const handleReaction = (reactionId: 'insightful' | 'important' | 'eyeopening') => {
    if (currentReaction?.reaction === reactionId) {
      removeReaction(articleId);
    } else {
      setReaction(articleId, reactionId);
    }
    setShowReactions(false);
  };
  
  const currentReactionData = reactions.find(r => r.id === currentReaction?.reaction);
  
  return (
    <div className="relative">
      {/* Reaction Button */}
      <button
        onClick={() => setShowReactions(!showReactions)}
        className={`px-6 py-3 rounded-full border-2 transition-all ${
          currentReaction?.reaction
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:bg-surface-container'
        }`}
      >
        {currentReaction?.reaction ? (
          <span className="flex items-center gap-2">
            <span className="text-xl">{currentReactionData?.emoji}</span>
            <span className="text-sm font-medium">{currentReactionData?.label}</span>
          </span>
        ) : (
          <span className="text-sm font-medium">Add Reaction</span>
        )}
      </button>
      
      {/* Reactions Menu */}
      {showReactions && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowReactions(false)}
          />
          
          {/* Menu */}
          <div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-surface-container-lowest border-2 border-outline-variant/30 shadow-2xl p-3 rounded-3xl z-50 animate-scale-in"
            style={{ minWidth: '240px' }}
          >
            <div className="space-y-2">
              {reactions.map(reaction => (
                <button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    currentReaction?.reaction === reaction.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="text-2xl">{reaction.emoji}</span>
                  <span className="font-medium">{reaction.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
