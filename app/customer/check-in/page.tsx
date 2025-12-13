'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { 
  Ticket, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function CustomerCheckIn() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'category' | 'details'>('category');

  useEffect(() => {
    loadCategories();

    // Set up socket connection for real-time updates
    const socket = getSocket();
    
    socket.emit('join-public-room');

    // Listen for category events
    const handleCategoryCreated = (category: any) => {
      console.log('Category created event received:', category);
      // Only add if it has at least one assigned agent
      if (category.agentCategories?.some((ac: any) => ac.isActive && ac.agent)) {
        loadCategories();
      }
    };

    const handleCategoryUpdated = (category: any) => {
      console.log('Category updated event received:', category);
      // Reload to check if it should be shown/hidden based on agents
      loadCategories();
    };

    const handleCategoryDeleted = (categoryId: string) => {
      console.log('Category deleted event received:', categoryId);
      // Remove from local state immediately
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      // If currently selected category was deleted, reset selection
      if (selectedCategory === categoryId) {
        setSelectedCategory('');
        setStep('category');
      }
    };

    const handleAgentAssigned = (data: any) => {
      console.log('Agent assigned event received:', data);
      // Reload categories to show newly assigned service
      loadCategories();
    };

    socket.on('category:created', handleCategoryCreated);
    socket.on('category:updated', handleCategoryUpdated);
    socket.on('category:deleted', handleCategoryDeleted);
    socket.on('category:agent-assigned', handleAgentAssigned);

    return () => {
      socket.off('category:created', handleCategoryCreated);
      socket.off('category:updated', handleCategoryUpdated);
      socket.off('category:deleted', handleCategoryDeleted);
      socket.off('category:agent-assigned', handleAgentAssigned);
    };
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await publicApi.getCategories();
      // Filter categories to only show those with at least one assigned agent
      const categoriesWithAgents = response.data.filter((category: any) => {
        // Check if agentCategories exists and has at least one active agent
        if (!category.agentCategories || category.agentCategories.length === 0) {
          return false;
        }
        const hasActiveAgent = category.agentCategories.some(
          (ac: any) => ac.isActive === true && ac.agent
        );
        return hasActiveAgent;
      });
      setCategories(categoriesWithAgents);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load service categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('details');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    setLoading(true);
    setError('');
    try {
      const response = await publicApi.checkIn({
        categoryId: selectedCategory,
        ...formData,
      });
      router.push(`/customer/token/${response.data.tokenNumber}`);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle Header */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">
              Customer Check-In
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select a service category and get your queue token instantly
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Progress Steps */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step === 'category' 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-primary/10 border-primary text-primary'
                }`}>
                  {step === 'category' ? (
                    <Ticket className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <span className={`font-medium ${step === 'category' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Select Service
                </span>
              </div>
              <div className="w-12 h-0.5 bg-border" />
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step === 'details' 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-muted border-border text-muted-foreground'
                }`}>
                  <User className="w-5 h-5" />
                </div>
                <span className={`font-medium ${step === 'details' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Your Details
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Selection Step */}
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {categoriesLoading ? (
                <div className="text-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading service categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No service categories available at the moment.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleCategorySelect(category.id)}
                      className="bg-card text-card-foreground border-2 border-border rounded-xl p-6 hover:border-primary hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <Ticket className="w-6 h-6 text-primary" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                      {category.estimatedWaitTime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Est. wait: {category.estimatedWaitTime} min</span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Details Form Step */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 md:p-8 max-w-2xl mx-auto">
                {/* Selected Category Display */}
                {selectedCategoryData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Ticket className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Selected Service</p>
                          <p className="font-semibold text-foreground">{selectedCategoryData.name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setStep('category');
                          setSelectedCategory('');
                        }}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      placeholder="Enter your full name"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      placeholder="+1234567890"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      placeholder="your@email.com"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-4"
                  >
                    <button
                      type="submit"
                      disabled={loading || !selectedCategory}
                      className="w-full bg-primary text-primary-foreground py-4 rounded-md font-semibold hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-2 group"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Get My Token</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <a
            href="/status"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <Ticket className="w-4 h-4" />
            View Queue Status
          </a>
          <span className="text-muted-foreground mx-4">•</span>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
