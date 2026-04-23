import { useState, useEffect } from 'react';
import { Menu, Plus, FolderOpen, Bookmark, Trash2, Edit2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { SubscriptionBadge } from '../components/SubscriptionBadge';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useCollections } from '../context/CollectionsContext';
import { IMAGES } from '../constants/images';

export function Collections() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { success, error: showError } = useToast();
  const { collections, createCollection, deleteCollection, updateCollection } = useCollections();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }

  // Safety check for collections
  const safeCollections = collections || [];
  
  const createNewCollection = () => {
    setShowCreateModal(true);
  };
  
  const handleCreateSubmit = () => {
    if (!newName.trim()) {
      showError('Please enter a collection name');
      return;
    }
    
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    createCollection(newName.trim(), newDescription.trim(), randomColor);
    success('Collection created!');
    setShowCreateModal(false);
    setNewName('');
    setNewDescription('');
  };
  
  const handleDeleteCollection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    if (deleteId) {
      deleteCollection(deleteId);
      success('Collection deleted');
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex justify-between items-center gap-3">
          {/* Left: Menu Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/menu')}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Collections
            </h1>
          </div>
          
          {/* Right: Badge + Profile (Pill Container) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-4 py-2 flex items-center gap-3">
            <SubscriptionBadge size="sm" />
            <div 
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/15 cursor-pointer"
              onClick={() => navigate('/account')}
            >
              <img 
                src={user?.profileImage || IMAGES.profile.main}
                className="w-full h-full object-cover" 
                alt="User profile" 
              />
            </div>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-5xl mx-auto">
        {/* Create Collection Button */}
        <div className="mb-8">
          <button
            onClick={createNewCollection}
            className="w-full bg-inverse-surface hover:bg-primary text-white rounded-[40px] p-6 flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <Plus className="w-6 h-6" />
            <span className="font-medium text-lg">Create New Collection</span>
          </button>
        </div>
        
        {/* Collections Grid */}
        {safeCollections.length === 0 ? (
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-16 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-outline" />
            <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3">
              No Collections Yet
            </h2>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
              Create collections to organize your saved articles by topic, project, or interest.
            </p>
            <button
              onClick={createNewCollection}
              className="bg-inverse-surface text-white px-8 py-3 rounded-full hover:bg-primary transition-all"
            >
              Create First Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {safeCollections.map((collection) => (
              <div
                key={collection.id}
                className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-6 hover:bg-surface-container-low transition-all group cursor-pointer"
                onClick={() => navigate(`/collection/${collection.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${collection.color} flex items-center justify-center`}>
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDeleteCollection(e, collection.id)}
                      className="w-8 h-8 rounded-full hover:bg-error/10 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-2">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-outline">
                    <Bookmark className="w-4 h-4" />
                    <span>{(collection.articleIds || []).length} articles</span>
                  </div>
                  <span className="text-outline text-xs">{collection.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-surface-container-lowest rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-6">
              Create New Collection
            </h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm text-outline mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Tech News, Travel Ideas..."
                  className="w-full px-4 py-3 rounded-[20px] bg-surface-container border border-outline-variant/15 focus:outline-none focus:border-primary transition-colors text-on-surface"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-outline mb-2">Description (optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="What's this collection about?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-[20px] bg-surface-container border border-outline-variant/15 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="flex-1 px-6 py-3 rounded-full bg-inverse-surface hover:bg-primary transition-colors text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-surface-container-lowest rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Delete Collection?
            </h3>
            
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              This will remove the collection but keep your saved articles. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-full bg-error hover:bg-error-dim transition-colors text-on-error"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}