import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useCollections } from '../context/CollectionsContext';

const COLLECTION_COLORS = ['#6366f1', '#ef4444', '#22c55e', '#a855f7', '#eab308', '#ec4899'];

export function Collections() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const { collections, isLoading, createCollection, deleteCollection } = useCollections();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/welcome', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleCreateSubmit = () => {
    if (!newName.trim()) {
      showError('Please enter a collection name');
      return;
    }
    const color = COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)];
    createCollection(newName.trim(), newDescription.trim(), color);
    success('Collection created!');
    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
  };

  return (
    <AppShell title="Collections" archetype="feed">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">{collections.length} collections</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-full bg-inverse-surface px-5 py-2.5 text-sm text-inverse-on-surface hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            New Collection
          </button>
        </div>

        {isLoading ? (
          <p className="text-outline">Loading collections…</p>
        ) : collections.length === 0 ? (
          <div className="rounded-[60px] border border-outline-variant/15 bg-surface-container-lowest/70 p-16 text-center">
            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-outline" />
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">No collections yet</h2>
            <p className="mt-2 text-on-surface-variant">Organize saved articles into themed collections.</p>
          </div>
        ) : (
          <div className={`gap-4 ${isWebDesktop ? 'grid sm:grid-cols-2 xl:grid-cols-3' : 'grid grid-cols-1'}`}>
            {collections.map((collection) => (
              <div
                key={collection.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/collection/${collection.id}`)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/collection/${collection.id}`)}
                className="cursor-pointer rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest/70 p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: collection.color }}
                  >
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface">{collection.name}</h3>
                    {collection.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{collection.description}</p>
                    )}
                    <p className="mt-2 text-xs text-outline">
                      {collection.articleIds.length} article{collection.articleIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                      success('Collection deleted');
                    }}
                    className="rounded-full p-2 text-error hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[40px] border border-outline-variant/15 bg-surface-container-lowest p-8">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">New Collection</h2>
            <input
              type="text"
              placeholder="Collection name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-4 w-full rounded-full border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-on-surface"
            />
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="mt-3 w-full rounded-[24px] border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-on-surface"
              rows={3}
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-full border border-outline-variant/20 py-3 text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="flex-1 rounded-full bg-inverse-surface py-3 text-inverse-on-surface hover:bg-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
