'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ConfirmOptions {
  requireText?: string;
  title?: string;
  description?: string;
}

interface ConfirmDialogContextType {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
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
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [userInput, setUserInput] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirm = (msg: string, opts: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setMessage(msg);
      setOptions(opts);
      setUserInput('');
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleConfirm = async () => {
    if (options.requireText && userInput !== options.requireText) {
      return;
    }

    if (resolvePromise) {
      setIsProcessing(true);
      // Small delay to show processing state
      setTimeout(() => {
        resolvePromise(true);
        setIsOpen(false);
        setMessage('');
        setUserInput('');
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
    setUserInput('');
    setResolvePromise(null);
    setIsProcessing(false);
  };

  const isButtonDisabled = isProcessing || (options.requireText && userInput !== options.requireText);

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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            >
              <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-md">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{options.title || (language === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action')}</h2>
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
                  <p className="text-foreground font-medium mb-2">{message}</p>
                  {options.description && (
                    <p className="text-sm text-muted-foreground mb-4 bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                      {options.description}
                    </p>
                  )}

                  {options.requireText && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {language === 'ar' 
                          ? <>يرجى كتابة <span className="font-bold text-foreground">"{options.requireText}"</span> للتأكيد.</>
                          : <>Please type <span className="font-bold text-foreground">"{options.requireText}"</span> to confirm.</>}
                      </p>
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="w-full p-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isButtonDisabled) {
                            handleConfirm();
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                  {!isProcessing && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!!isButtonDisabled}
                    className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
                        {t('customer.processing')}
                      </>
                    ) : (
                      t('common.confirm')
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
