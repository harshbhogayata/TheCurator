import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, Mail, Calendar, MapPin, Save, User as UserIcon, AlertTriangle, X } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { IMAGES } from '../constants/images';

export function Account() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, signOut } = useAuth();
  const { success } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Auth guard
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setProfileImage(user.profileImage || IMAGES.profile.main);
    }
  }, [user]);
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };
  
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setHasChanges(true);
  };
  
  const handleSave = () => {
    updateProfile({ name, email, profileImage });
    setHasChanges(false);
    success('Profile updated successfully!');
  };
  
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        success('Image must be smaller than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        success('Please select an image file');
        return;
      }
      
      // Read file and convert to base64 for preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        setHasChanges(true);
        success('Photo uploaded! Click "Save Changes" to update your profile.');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDeleteAccount = () => {
    signOut();
    success('Account deleted successfully');
    navigate('/', { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center gap-3">
          {/* Left: Back Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Account
            </h1>
          </div>
        </div>
      </header>
      
      <main className="pt-32 px-6 max-w-2xl mx-auto">
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-outline-variant/30 shadow-lg">
              <img 
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button 
              onClick={handleImageUpload}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-1">
              {user.name}
            </h2>
            <div className="flex items-center gap-2 text-outline text-sm">
              <Calendar className="w-4 h-4" />
              <span>Member since {user.memberSince}</span>
            </div>
          </div>
        </div>
        
        {/* Form Fields */}
        <div className="space-y-4 mb-8">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-6">
            <label className="flex items-center gap-3 mb-3 text-outline text-sm uppercase tracking-wider">
              <UserIcon className="w-4 h-4" />
              Full Name
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-transparent text-on-surface text-lg focus:outline-none"
              placeholder="Enter your name"
            />
          </div>
          
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-6">
            <label className="flex items-center gap-3 mb-3 text-outline text-sm uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full bg-transparent text-on-surface text-lg focus:outline-none"
              placeholder="Enter your email"
            />
          </div>
          
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-6">
            <label className="flex items-center gap-3 mb-3 text-outline text-sm uppercase tracking-wider">
              <MapPin className="w-4 h-4" />
              User ID
            </label>
            <div className="w-full text-outline text-lg font-mono">
              {user.id}
            </div>
          </div>
        </div>
        
        {/* Account Info */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface mb-4 px-2">
            Account Information
          </h2>
          
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/15">
                <span className="text-outline text-sm">Account Status</span>
                <span className="text-on-surface font-medium">Active</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-outline-variant/15">
                <span className="text-outline text-sm">Member Since</span>
                <span className="text-on-surface font-medium">{user.memberSince}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-outline text-sm">Account Type</span>
                <span className="text-on-surface font-medium">Premium Reader</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Danger Zone */}
        <section className="mb-8">
          <h2 className="font-[family-name:var(--font-headline)] text-xl italic text-on-surface mb-4 px-2">
            Danger Zone
          </h2>
          
          <div className="bg-error/5 backdrop-blur-xl border border-error/20 rounded-[30px] p-6">
            <div className="mb-4">
              <h3 className="text-error font-medium mb-1">Delete Account</h3>
              <p className="text-sm text-on-surface-variant">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-error hover:bg-error/90 text-on-error px-6 py-2 rounded-full text-sm transition-all"
            >
              Delete My Account
            </button>
          </div>
        </section>
        
        {/* Save Button - Only show if changes were made */}
        {hasChanges && (
          <div className="flex justify-center sticky bottom-24 z-10">
            <button 
              onClick={handleSave}
              className="bg-inverse-surface text-white px-12 py-4 rounded-full uppercase tracking-widest text-sm transition-all shadow-2xl hover:bg-primary active:scale-95 flex items-center gap-2 border-2 border-white/50"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        )}
        
        {/* Hidden file input for image upload */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </main>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-surface-container-lowest rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-1">
                  Delete Account?
                </h3>
                <p className="text-sm text-on-surface-variant">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              Are you sure you want to permanently delete your account? All your data, including saved articles, collections, and preferences will be lost forever.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-outline-variant hover:bg-surface-container transition-colors text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-6 py-3 rounded-full bg-error hover:bg-error-dim transition-colors text-on-error"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
}