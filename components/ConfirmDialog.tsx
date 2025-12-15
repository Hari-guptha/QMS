'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogContextType {
  confirm: (message: string) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirm = (msg: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(msg);
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = async () => {
    if (resolvePromise) {
      setIsProcessing(true);
      // Small delay to show processing state
      setTimeout(() => {
        resolvePromise(true);
        setIsOpen(false);
        setMessage('');
        setResolvePromise(null);
        setIsProcessing(false);
      }, 100);
    }
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setMessage('');
    setResolvePromise(null);
    setIsProcessing(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-md">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Confirm Action</h2>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={handleCancel}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  )}
                </div>
                
                {/* Modal Body */}
                <div className="p-6">
                  <p className="text-foreground">{message}</p>
                </div>
                
                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
}

