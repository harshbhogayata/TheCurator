import { useState } from 'react';
import { X, Plus, FolderOpen, Check } from 'lucide-react';
import { useCollections } from '../context/CollectionsContext';
import { useToast } from './Toast';
import type { Article } from '../data/articles';

interface AddToCollectionModalProps {
  article: Article;
  onClose: () => void;
}

export function AddToCollectionModal({ article, onClose }: AddToCollectionModalProps) {
  const { collections, addArticleToCollection, removeArticleFromCollection, isArticleInCollection } = useCollections();
  const { success } = useToast();

  const handleToggleCollection = (collectionId: string) => {
    const isInCollection = isArticleInCollection(collectionId, article.id);
    
    if (isInCollection) {
      removeArticleFromCollection(collectionId, article.id);
      success('Removed from collection');
    } else {
      addArticleToCollection(collectionId, article);
      success('Added to collection');
    }
  };

  return (
    <div className="fixed inset-0 bg-inverse-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[60px] max-w-md w-full max-h-[70vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-[family-name:var(--font-headline)] text-xl text-on-surface">
              Add to Collection
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-on-surface" />
            </button>
          </div>
          <p className="text-sm text-on-surface-variant line-clamp-2">
            {article.title}
          </p>
        </div>
        
        {/* Collections List */}
        <div className="flex-1 overflow-y-auto p-6">
          {collections.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-outline" />
              <p className="text-on-surface-variant mb-4">
                No collections yet
              </p>
              <button
                onClick={onClose}
                className="text-primary hover:underline text-sm"
              >
                Create a collection first
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {collections.map((collection) => {
                const isInCollection = isArticleInCollection(collection.id, article.id);
                
                return (
                  <button
                    key={collection.id}
                    onClick={() => handleToggleCollection(collection.id)}
                    className={`w-full bg-surface-container-low/50 border border-outline-variant/15 rounded-[30px] p-4 hover:bg-surface-container-low transition-all text-left group ${
                      isInCollection ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${collection.color} flex items-center justify-center shrink-0`}>
                        <FolderOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-[family-name:var(--font-headline)] text-base text-on-surface truncate">
                          {collection.name}
                        </h3>
                        <p className="text-xs text-outline">
                          {(collection.articleIds || []).length} articles
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isInCollection ? 'bg-primary text-white' : 'bg-surface-container group-hover:bg-surface-container-high'
                      }`}>
                        {isInCollection ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4 text-outline" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
