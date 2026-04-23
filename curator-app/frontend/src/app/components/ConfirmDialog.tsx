import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  const variantStyles = {
    danger: 'bg-error text-on-error',
    warning: 'bg-secondary text-on-secondary',
    info: 'bg-inverse-surface text-white'
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-[40px] border border-outline-variant/15 shadow-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-outline" />
        </button>
        
        <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-4 pr-8">
          {title}
        </h2>
        
        <p className="text-on-surface-variant leading-relaxed mb-8">
          {description}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface py-4 px-6 rounded-full transition-all"
          >
            {cancelText}
          </button>
          
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 ${variantStyles[variant]} py-4 px-6 rounded-full transition-all hover:opacity-90 shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
