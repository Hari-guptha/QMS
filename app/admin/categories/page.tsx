'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Save,
  UserPlus,
  ArrowLeft,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { Select } from '@/components/ui/Select';

export default function CategoriesManagement() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedWaitTime: 0,
  });

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadCategories();
    loadAgents();
  }, [router]);

  const loadCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await adminApi.getAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCategory(formData);
      setShowForm(false);
      setFormData({ name: '', description: '', estimatedWaitTime: 0 });
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminApi.deleteCategory(id);
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      estimatedWaitTime: category.estimatedWaitTime || 0,
    });
  };

  const handleUpdate = async (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    try {
      await adminApi.updateCategory(categoryId, formData);
      setEditingCategory(null);
      setFormData({ name: '', description: '', estimatedWaitTime: 0 });
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update category');
    }
  };

  const handleAssignAgent = async (categoryId: string, agentId: string) => {
    try {
      await adminApi.assignAgent(categoryId, agentId);
      loadCategories();
      setAssigningAgent(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign agent');
    }
  };

  const handleRemoveAgent = async (categoryId: string, agentId: string) => {
    if (!confirm('Remove this agent from category?')) return;
    try {
      await adminApi.removeAgent(categoryId, agentId);
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove agent');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-lg text-muted-foreground">Loading categories...</div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <Link 
              href="/admin/dashboard" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <FolderOpen className="w-6 h-6 text-chart-2" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Categories Management</h1>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
          >
            {showForm ? (
              <>
                <X className="w-5 h-5" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Category
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card text-card-foreground border rounded-2xl shadow-lg p-8 mb-8 overflow-hidden"
            >
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                <Plus className="w-6 h-6 text-primary" />
                Create New Category
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <motion.input
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  type="text"
                  placeholder="Category Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 placeholder:text-muted-foreground/70 transition-all"
                  required
                />
                <motion.textarea
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 placeholder:text-muted-foreground/70 transition-all min-h-[100px]"
                />
                <motion.input
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  type="number"
                  placeholder="Estimated Wait Time (minutes)"
                  value={formData.estimatedWaitTime}
                  onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 placeholder:text-muted-foreground/70 transition-all"
                  min="0"
                />
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-chart-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Category
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
              >
                {editingCategory === category.id ? (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={(e) => handleUpdate(e, category.id)}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                      required
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                      rows={2}
                    />
                    <input
                      type="number"
                      value={formData.estimatedWaitTime}
                      onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                      min="0"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="flex-1 bg-chart-2 text-white px-3 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setFormData({ name: '', description: '', estimatedWaitTime: 0 });
                        }}
                        className="flex-1 bg-secondary text-secondary-foreground px-3 py-2 rounded-xl text-sm hover:bg-secondary/80 transition-colors border flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </motion.button>
                    </div>
                  </motion.form>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-chart-2/10 rounded-lg">
                          <FolderOpen className="w-5 h-5 text-chart-2" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(category)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                    {category.description && (
                      <p className="text-muted-foreground mb-4 text-sm">{category.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Est. wait: {category.estimatedWaitTime} min</span>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Assigned Agents
                        </h4>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAssigningAgent(assigningAgent === category.id ? null : category.id)}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1"
                        >
                          {assigningAgent === category.id ? (
                            <>
                              <X className="w-3 h-3" />
                              Cancel
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              Assign
                            </>
                          )}
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {assigningAgent === category.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 p-3 bg-muted border rounded-xl"
                          >
                            <Select
                              value=""
                              onChange={(value) => {
                                if (value) {
                                  handleAssignAgent(category.id, value);
                                }
                              }}
                              placeholder="Select agent..."
                              options={[
                                { value: '', label: 'Select agent...' },
                                ...agents
                                  .filter((agent) => {
                                    const assigned = category.agentCategories?.some(
                                      (ac: any) => ac.agentId === agent.id && ac.isActive
                                    );
                                    return !assigned;
                                  })
                                  .map((agent) => ({
                                    value: agent.id,
                                    label: `${agent.firstName} ${agent.lastName}`,
                                  })),
                              ]}
                              className="text-sm"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-2">
                        {category.agentCategories?.filter((ac: any) => ac.isActive).length > 0 ? (
                          category.agentCategories
                            .filter((ac: any) => ac.isActive)
                            .map((ac: any, idx: number) => (
                              <motion.div
                                key={ac.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex justify-between items-center p-3 bg-muted border rounded-xl text-sm"
                              >
                                <span className="text-foreground">
                                  {ac.agent?.firstName} {ac.agent?.lastName}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveAgent(category.id, ac.agentId)}
                                  className="text-destructive hover:text-destructive/80 text-xs"
                                >
                                  Remove
                                </motion.button>
                              </motion.div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">No agents assigned</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
