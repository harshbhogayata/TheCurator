import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Plus, Edit2, Trash2, FolderOpen, X } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { ArticleCard } from '../components/ArticleCard';
import { useCollections } from '../context/CollectionsContext';
import { useSavedArticles } from '../context/SavedArticlesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import type { Article } from '../data/articles';

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    getCollectionById, 
    getCollectionArticles, 
    updateCollection, 
    deleteCollection,
    removeArticleFromCollection,
    addArticleToCollection
  } = useCollections();
  const { savedArticles } = useSavedArticles();
  const { success, error: showError } = useToast();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeArticleId, setRemoveArticleId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const collection = id ? getCollectionById(id) : undefined;
  const articles = id ? getCollectionArticles(id) : [];

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Redirect if collection not found
  useEffect(() => {
    if (isAuthenticated && id && !collection) {
      navigate('/collections', { replace: true });
    }
  }, [isAuthenticated, id, collection, navigate]);

  if (!isAuthenticated || !collection) {
    return null;
  }

  const handleDeleteCollection = () => {
    setShowDeleteModal(true);
  };
  
  const confirmDelete = () => {
    deleteCollection(collection.id);
    success('Collection deleted');
    navigate('/collections');
  };

  const handleEdit = () => {
    setEditName(collection.name);
    setEditDescription(collection.description || '');
    setShowEditModal(true);
  };
  
  const handleEditSubmit = () => {
    if (!editName.trim()) {
      showError('Please enter a collection name');
      return;
    }
    
    updateCollection(collection.id, {
      name: editName.trim(),
      description: editDescription.trim()
    });
    success('Collection updated');
    setShowEditModal(false);
  };

  const handleRemoveArticle = (articleId: string) => {
    setRemoveArticleId(articleId);
    setShowRemoveModal(true);
  };
  
  const confirmRemove = () => {
    if (removeArticleId) {
      removeArticleFromCollection(collection.id, removeArticleId);
      success('Article removed from collection');
      setShowRemoveModal(false);
      setRemoveArticleId(null);
    }
  };

  const handleAddArticle = (article: Article) => {
    addArticleToCollection(collection.id, article);
    success('Article added to collection');
  };

  const availableArticles = savedArticles.filter(
    article => !(collection.articleIds || []).includes(article.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex justify-between items-center gap-3">
          {/* Back Button */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate('/collections')}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Collection Info */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${collection.color} flex items-center justify-center shrink-0`}>
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface truncate">
                {collection.name}
              </h1>
            </div>
          </div>
          
          {/* Actions */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5 flex gap-1">
            <button 
              onClick={handleEdit}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <Edit2 className="w-5 h-5 text-on-surface" />
            </button>
            <button 
              onClick={handleDeleteCollection}
              className="w-10 h-10 rounded-full hover:bg-error/10 flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-5 h-5 text-error" />
            </button>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-5xl mx-auto">
        {/* Collection Header */}
        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-8 mb-8">
          {collection.description && (
            <p className="text-on-surface-variant mb-4">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="text-sm text-outline">
              {articles.length} article{articles.length !== 1 ? 's' : ''} • Created {collection.createdAt}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-inverse-surface hover:bg-primary text-white px-6 py-2 rounded-full flex items-center gap-2 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Articles</span>
            </button>
          </div>
        </div>
        
        {/* Articles Grid */}
        {articles.length === 0 ? (
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-16 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-outline" />
            <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-3">
              No Articles Yet
            </h2>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
              Add articles from your saved collection to organize them here.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-inverse-surface text-white px-8 py-3 rounded-full hover:bg-primary transition-all"
            >
              Add Articles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {articles.map((article) => (
              <div key={article.id} className="relative">
                {/* Delete Button */}
                <div className="absolute -top-3 -right-3 z-10">
                  <button
                    onClick={() => handleRemoveArticle(article.id)}
                    className="w-8 h-8 rounded-full bg-error text-error-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Add Articles Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-inverse-surface/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-[60px] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-8 border-b border-outline-variant/15">
              <div className="flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface">
                  Add Articles
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-on-surface" />
                </button>
              </div>
              <p className="text-on-surface-variant mt-2">
                Select from your saved articles
              </p>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {availableArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-on-surface-variant">
                    All your saved articles are already in this collection.
                  </p>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      navigate('/saved');
                    }}
                    className="mt-4 bg-inverse-surface text-white px-6 py-2 rounded-full hover:bg-primary transition-all"
                  >
                    Go to Saved
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableArticles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => {
                        handleAddArticle(article);
                        if (availableArticles.length === 1) {
                          setShowAddModal(false);
                        }
                      }}
                      className="bg-surface-container-low/50 border border-outline-variant/15 rounded-[40px] p-4 hover:bg-surface-container-low transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        <div 
                          className="relative w-20 h-20 shrink-0 overflow-hidden border border-outline-variant/15 shadow-md"
                          style={{ borderRadius: '30px 15px 40px 25px' }}
                        >
                          <img
                            src={`https://source.unsplash.com/400x400/?${article.imageQuery}`}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-[family-name:var(--font-headline)] text-lg text-on-surface mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          <div className="text-xs text-outline uppercase tracking-wider">
                            {article.category} • {article.readTime}
                          </div>
                        </div>
                        <button className="shrink-0 w-10 h-10 rounded-full bg-inverse-surface/10 group-hover:bg-inverse-surface text-outline group-hover:text-white flex items-center justify-center transition-all">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Collection Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-surface-container-lowest rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-6">
              Edit Collection
            </h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm text-outline mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-[20px] bg-surface-container border border-outline-variant/15 focus:outline-none focus:border-primary transition-colors text-on-surface"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-outline mb-2">Description (optional)</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-[20px] bg-surface-container border border-outline-variant/15 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="flex-1 px-6 py-3 rounded-full bg-inverse-surface hover:bg-primary transition-colors text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Collection Modal */}
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
                onClick={() => setShowDeleteModal(false)}
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
      
      {/* Remove Article Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-surface-container-lowest rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Remove Article?
            </h3>
            
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              This will remove the article from the collection but keep it in your saved articles.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setRemoveArticleId(null);
                }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-6 py-3 rounded-full bg-error hover:bg-error-dim transition-colors text-on-error"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}
