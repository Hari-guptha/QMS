'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminNavItems } from '@/lib/admin-nav-items';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  UserPlus,
  Clock,
  Users,
  Loader2,
  Wifi,
  WifiOff,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useConfirm } from '@/components/ConfirmDialog';

export default function CategoriesManagement() {
  const router = useRouter();
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryModal, setEditingCategoryModal] = useState<any | null>(null);
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedWaitTime: 0,
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    estimatedWaitTime: 0,
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadCategories();
    loadAgents();

    // Set up socket connection for real-time updates
    const user = auth.getUser();
    if (user) {
      const socket = getSocket();
      setSocketConnected(socket.connected);

      // Join admin room for category updates
      const handleConnect = () => {
        socket.emit('join-admin-room', user.id);
        setSocketConnected(true);
        console.log('Socket connected, joined admin room:', user.id);
      };

      const handleDisconnect = () => {
        setSocketConnected(false);
        console.log('Socket disconnected');
      };

      if (socket.connected) {
        handleConnect();
      } else {
        socket.on('connect', handleConnect);
      }

      socket.on('disconnect', handleDisconnect);

      // Listen for category events
      const handleCategoryCreated = (category: any) => {
        console.log('Category created event received:', category);
        // Only add if it's active (handle MSSQL bit type)
        if (!isFalsy(category.isActive)) {
          loadCategories();
        }
      };

      const handleCategoryUpdated = (category: any) => {
        console.log('Category updated event received:', category);
        // Reload to handle activation/deactivation
        loadCategories();
        // Update modal if editing this category
        setEditingCategoryModal((prev) => {
          if (prev && prev.id === category.id) {
            return category;
          }
          return prev;
        });
      };

      const handleCategoryDeleted = (categoryId: string) => {
        console.log('Category deleted event received:', categoryId);
        // Remove from local state immediately
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      };

      socket.on('category:created', handleCategoryCreated);
      socket.on('category:updated', handleCategoryUpdated);
      socket.on('category:deleted', handleCategoryDeleted);

      // Cleanup on unmount
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('category:created', handleCategoryCreated);
        socket.off('category:updated', handleCategoryUpdated);
        socket.off('category:deleted', handleCategoryDeleted);
      };
    }
  }, [router]);

  // Helper to check boolean values (MSSQL returns 1/0 for bit)
  const isTruthy = (val: any) => val === true || val === 1;
  const isFalsy = (val: any) => val === false || val === 0;

  const loadCategories = async () => {
    try {
      const response = await adminApi.getCategories();
      // Filter out inactive (soft-deleted) categories (handle MSSQL bit type)
      const activeCategories = response.data.filter((cat: any) => !isFalsy(cat.isActive));
      setCategories(activeCategories);
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
    setCreating(true);
    try {
      await adminApi.createCategory(formData);
      setShowForm(false);
      setFormData({ name: '', description: '', estimatedWaitTime: 0 });
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create service');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setFormData({ name: '', description: '', estimatedWaitTime: 0 });
  };

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) => {
    const query = searchQuery.toLowerCase();
    return (
      category.name?.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(
      t('admin.categories.deleteConfirm'),
      {
        requireText: 'confirm',
        title: t('common.deleteService'),
        description: t('common.deleteServiceWarning')
      }
    );

    if (!confirmed) return;
    try {
      const response = await adminApi.deleteCategory(id, true);
      const result = response.data || response;

      // Check if it was soft-deleted (deactivated) or hard-deleted
      if (result.deactivated) {
        // Soft delete - remove from UI but show message
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        alert(result.message || 'Service has been deactivated because it has associated tickets.');
      } else {
        // Hard delete - remove from UI
        setCategories((prev) => prev.filter((cat) => cat.id !== id));
        // Show success message if available
        if (result.message) {
          console.log(result.message);
        }
      }
      // Socket will handle the live update
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete service';
      alert(errorMessage);
      // Reload on error to ensure consistency
      loadCategories();
    }
  };

  const handleEdit = (category: any) => {
    // If in table view, open modal instead of switching to grid view
    if (viewMode === 'table') {
      setEditingCategoryModal(category);
      setEditFormData({
        name: category.name,
        description: category.description || '',
        estimatedWaitTime: category.estimatedWaitTime || 0,
      });
      return;
    }
    // For grid view, use inline editing
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
      alert(error.response?.data?.message || 'Failed to update service');
    }
  };

  const handleUpdateModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryModal) return;
    setUpdating(true);
    try {
      await adminApi.updateCategory(editingCategoryModal.id, editFormData);
      setEditingCategoryModal(null);
      setEditFormData({ name: '', description: '', estimatedWaitTime: 0 });
      loadCategories();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update service');
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingCategoryModal(null);
    setEditFormData({ name: '', description: '', estimatedWaitTime: 0 });
    setAssigningAgent(null);
  };

  const handleAssignAgent = async (categoryId: string, agentId: string) => {
    try {
      await adminApi.assignAgent(categoryId, agentId);
      // Reload to get updated category with agent
      const response = await adminApi.getCategories();
      const activeCategories = response.data.filter((cat: any) => !isFalsy(cat.isActive));
      setCategories(activeCategories);
      setAssigningAgent(null);
      // Update the modal's category data if it's open
      if (editingCategoryModal && editingCategoryModal.id === categoryId) {
        const updatedCategory = activeCategories.find((cat: any) => cat.id === categoryId);
        if (updatedCategory) {
          setEditingCategoryModal(updatedCategory);
        }
      }
      // Note: Backend should emit 'category:agent-assigned' socket event
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to assign agent');
    }
  };

  const handleRemoveAgent = async (categoryId: string, agentId: string) => {
    const confirmed = await confirm(t('admin.categories.removeAgentConfirm'));
    if (!confirmed) return;
    try {
      await adminApi.removeAgent(categoryId, agentId);
      // Reload to get updated category
      const response = await adminApi.getCategories();
      const activeCategories = response.data.filter((cat: any) => !isFalsy(cat.isActive));
      setCategories(activeCategories);
      // Update the modal's category data if it's open
      if (editingCategoryModal && editingCategoryModal.id === categoryId) {
        const updatedCategory = activeCategories.find((cat: any) => cat.id === categoryId);
        if (updatedCategory) {
          setEditingCategoryModal(updatedCategory);
        }
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove agent');
    }
  };

  const adminNavItems = getAdminNavItems(t);

  if (loading) {
    return (
      <DashboardLayout navItems={adminNavItems} role="admin">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-lg text-muted-foreground">{t('admin.categories.loading')}</div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={adminNavItems} role="admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-chart-2/10 rounded-lg">
                <FolderOpen className="w-6 h-6 text-chart-2" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t('admin.categories.title')}</h1>
            </div>

            {/* View Toggle - Outside Search Container */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 p-1 bg-card/80 dark:bg-card border border-border rounded-xl">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={t('common.gridView')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  title={t('common.tableView')}
                >
                  <List className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Search and Add Button - Combined in One Container */}
              <div className="flex items-center gap-0 bg-card/80 dark:bg-card border border-border rounded-xl px-2 py-1">
                <span className="pl-2 pr-1 text-xl text-primary/80">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder={t('admin.categories.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full min-w-0 py-1 outline-none border-0 bg-transparent rounded-lg focus:ring-0 focus-visible:ring-0 shadow-none text-base px-2 text-foreground placeholder:text-muted-foreground transition-[color,box-shadow]"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                    title={t('common.clearFilter') || 'Clear filter'}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
                <span className="mx-2 h-6 w-px bg-border"></span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-primary-foreground h-9 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-all shadow-none font-semibold text-base"
                >
                  <span className="hidden sm:inline">{t('admin.users.add')}</span>
                  <span className="sm:hidden text-xl leading-none">+</span>
                </motion.button>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${socketConnected
              ? 'bg-chart-2/10 border-chart-2/30 text-chart-2'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
          >
            {socketConnected ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {socketConnected ? t('admin.categories.liveUpdates') : t('admin.categories.disconnected')}
            </span>
          </motion.div>
        </motion.div>

        {/* Edit Form Modal */}
        <AnimatePresence>
          {editingCategoryModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseEditModal}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-3xl max-h-[75vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{t('admin.categories.editTitle')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('admin.categories.editDesc')}</p>
                    </div>
                    <button
                      onClick={handleCloseEditModal}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleUpdateModal} className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.serviceName')}
                        </label>
                        <motion.input
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          type="text"
                          placeholder={t('admin.categories.serviceName')}
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.description')}
                        </label>
                        <motion.textarea
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          placeholder={t('admin.categories.description')}
                          value={editFormData.description}
                          onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.estWaitTime')}
                        </label>
                        <motion.input
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          type="number"
                          placeholder={t('admin.categories.estWaitTime')}
                          value={editFormData.estimatedWaitTime}
                          onChange={(e) => setEditFormData({ ...editFormData, estimatedWaitTime: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          min="0"
                        />
                      </div>

                      {/* Agent Assignment Section */}
                      <div className="border-t border-border pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {t('admin.categories.assignedAgents')}
                          </h4>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setAssigningAgent(assigningAgent === editingCategoryModal.id ? null : editingCategoryModal.id)}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1"
                          >
                            {assigningAgent === editingCategoryModal.id ? (
                              <>
                                <X className="w-3 h-3" />
                                {t('common.cancel')}
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                {t('admin.categories.assign')}
                              </>
                            )}
                          </motion.button>
                        </div>

                        <AnimatePresence>
                          {assigningAgent === editingCategoryModal.id && (
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
                                    handleAssignAgent(editingCategoryModal.id, value);
                                  }
                                }}
                                placeholder={t('admin.categories.selectAgent')}
                                options={[
                                  { value: '', label: t('admin.categories.selectAgent') },
                                  ...agents
                                    .filter((agent) => {
                                      // Check if agent is assigned to ANY service (not just the current one)
                                      // Handle MSSQL bit type (1/0) for isActive
                                      const assignedToAnyService = categories.some((cat) =>
                                        cat.agentCategories?.some(
                                          (ac: any) => ac.agentId === agent.id && isTruthy(ac.isActive)
                                        )
                                      );
                                      return !assignedToAnyService;
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
                          {editingCategoryModal.agentCategories?.filter((ac: any) => isTruthy(ac.isActive)).length > 0 ? (
                            editingCategoryModal.agentCategories
                              .filter((ac: any) => isTruthy(ac.isActive))
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
                                    type="button"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRemoveAgent(editingCategoryModal.id, ac.agentId)}
                                    className="text-destructive hover:text-destructive/80 text-xs"
                                  >
                                    {t('admin.categories.remove')}
                                  </motion.button>
                                </motion.div>
                              ))
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">{t('admin.categories.noAgents')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={updating}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {updating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('common.updating')}
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            {t('common.save')}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Create Form Modal */}
        <AnimatePresence>
          {showForm && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{t('admin.categories.createTitle')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('admin.categories.createDesc')}</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleCreate} className="p-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.serviceName')}
                        </label>
                        <motion.input
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          type="text"
                          placeholder={t('admin.categories.serviceName')}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.description')}
                        </label>
                        <motion.textarea
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          placeholder={t('admin.categories.description')}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition min-h-[100px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                          {t('admin.categories.estWaitTime')}
                        </label>
                        <motion.input
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          type="number"
                          placeholder={t('admin.categories.estWaitTime')}
                          value={formData.estimatedWaitTime}
                          onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={creating}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t('admin.users.creating')}
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            {t('admin.categories.create')}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Categories Grid View */}
        {viewMode === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {paginatedCategories.map((category, index) => (
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
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        {t('admin.categories.serviceName')}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        {t('admin.categories.description')}
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        {t('admin.categories.estWaitTime')}
                      </label>
                      <input
                        type="number"
                        value={formData.estimatedWaitTime}
                        onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border border-border rounded-lg text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="flex-1 bg-chart-2 text-white px-3 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-1"
                      >
                        <Save className="w-4 h-4" />
                        {t('common.save')}
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
                        {t('common.cancel')}
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
                      <span>{t('admin.categories.estWait')} {category.estimatedWaitTime} {t('customer.minutes')}</span>
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t('admin.categories.assignedAgents')}
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
                              {t('common.cancel')}
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              {t('admin.categories.assign')}
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
                              placeholder={t('admin.categories.selectAgent')}
                              options={[
                                { value: '', label: t('admin.categories.selectAgent') },
                                ...agents
                                  .filter((agent) => {
                                    // Check if agent is assigned to ANY service (not just the current one)
                                    // Handle MSSQL bit type (1/0) for isActive
                                    const assignedToAnyService = categories.some((cat) =>
                                      cat.agentCategories?.some(
                                        (ac: any) => ac.agentId === agent.id && isTruthy(ac.isActive)
                                      )
                                    );
                                    return !assignedToAnyService;
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
                        {category.agentCategories?.filter((ac: any) => isTruthy(ac.isActive)).length > 0 ? (
                          category.agentCategories
                            .filter((ac: any) => isTruthy(ac.isActive))
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
                                  {t('admin.categories.remove')}
                                </motion.button>
                              </motion.div>
                            ))
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">{t('admin.categories.noAgents')}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        )}

        {/* Categories Table View */}
        {viewMode === 'table' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="w-6 h-6 text-chart-2" />
                {t('admin.categories.title')} ({filteredCategories.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('admin.categories.serviceName')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('admin.categories.description')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('admin.categories.estWait')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('admin.categories.assignedAgents')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('admin.users.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <AnimatePresence>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          {searchQuery ? t('admin.users.noUsersFound') : t('common.noCategoriesAvailable')}
                        </td>
                      </tr>
                    ) : (
                      paginatedCategories.map((category, index) => (
                        <motion.tr
                          key={category.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                                <FolderOpen className="w-5 h-5 text-chart-2" />
                              </div>
                              <div className="font-medium text-foreground">{category.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-foreground text-sm max-w-md">
                              {category.description || (
                                <span className="text-muted-foreground italic">{t('common.noDescription')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-foreground text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {category.estimatedWaitTime} {t('customer.minutes')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-foreground text-sm">
                                {category.agentCategories?.filter((ac: any) => isTruthy(ac.isActive)).length || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(category)}
                                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                                {t('common.edit')}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(category.id)}
                                className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('common.delete')}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination - Separate Div */}
        {filteredCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 bg-white dark:bg-[#171717] border border-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${currentPage === 1
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-foreground hover:bg-muted'
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('admin.users.previous')}
                </button>
                <span className="text-sm text-muted-foreground">
                  {t('admin.users.page')} {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${currentPage === totalPages
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-foreground hover:bg-muted'
                    }`}
                >
                  {t('common.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('common.limit')}</span>
                <div className="w-20">
                  <Select
                    value={itemsPerPage.toString()}
                    onChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                    options={[
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
