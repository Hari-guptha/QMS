'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getAdminNavItems } from '@/lib/admin-nav-items';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Trash2,
  Mail,
  Shield,
  UserCheck,
  X,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  LayoutGrid,
  List
} from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useConfirm } from '@/components/ConfirmDialog';

export default function UsersManagement() {
  const router = useRouter();
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'agent',
    employeeId: '',
    counterNumber: '',
  });

  useEffect(() => {
    if (!auth.isAuthenticated() || auth.getUser()?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createUser(formData);
      setShowForm(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'agent',
        employeeId: '',
        counterNumber: '',
      });
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowForm(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'agent',
      employeeId: '',
      counterNumber: '',
    });
  };

  const handleDelete = async (user: any) => {
    let confirmed = false;

    if (user.role === 'agent') {
      confirmed = await confirm(
        t('admin.users.deleteConfirm'),
        {
          requireText: 'confirm',
          title: t('common.deleteAgent'),
          description: t('common.deleteAgentWarning')
        }
      );
    } else {
      confirmed = await confirm(t('admin.users.deleteConfirm'));
    }

    if (!confirmed) return;

    try {
      await adminApi.deleteUser(user.id, true);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEdit = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      username: user.username || '',
      email: user.email || '',
      password: '', // Don't pre-fill password
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'agent',
      employeeId: user.employeeId || '',
      counterNumber: user.counterNumber || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    setUpdating(true);
    try {
      // Remove password from update if it's empty
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await adminApi.updateUser(editingUserId, updateData);
      setEditingUserId(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'agent',
        employeeId: '',
        counterNumber: '',
      });
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user');
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingUserId(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'agent',
      employeeId: '',
      counterNumber: '',
    });
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query) ||
      user.employeeId?.toLowerCase().includes(query)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
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
            <div className="text-lg text-muted-foreground">{t('admin.users.loading')}</div>
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
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">{t('admin.users.title')}</h1>
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
                  placeholder={t('admin.users.search')}
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
        </motion.div>

        {/* Edit Form Modal */}
        <AnimatePresence>
          {editingUserId && (
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
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <div className="bg-card text-card-foreground border rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{t('admin.users.editTitle')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('admin.users.editDesc')}</p>
                    </div>
                    <button
                      onClick={handleCloseEditModal}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleUpdate} className="p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        type="text"
                        placeholder={t('common.username')}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        type="email"
                        placeholder={t('admin.users.table.email')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        type="password"
                        placeholder={t('admin.users.passwordPlaceholder')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        type="text"
                        placeholder={t('admin.users.firstName')}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        type="text"
                        placeholder={t('admin.users.lastName')}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Select
                          value={formData.role}
                          onChange={(value) => setFormData({ ...formData, role: value })}
                          options={[
                            { value: 'agent', label: t('admin.users.role.agent') },
                            { value: 'admin', label: t('admin.users.role.admin') },
                          ]}
                        />
                      </motion.div>
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        type="text"
                        placeholder={`${t('admin.users.employeeId')} ${t('admin.users.optional')}`}
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        type="text"
                        placeholder={`${t('admin.users.counterNumber')} ${t('admin.users.optional')}`}
                        value={formData.counterNumber}
                        onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      />
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
                            {t('admin.users.updating')}
                          </>
                        ) : (
                          <>
                            <Edit className="w-5 h-5" />
                            {t('admin.users.update')}
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
                      <h2 className="text-2xl font-bold text-foreground">{t('admin.users.createTitle')}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{t('admin.users.createDesc')}</p>
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
                    <div className="grid md:grid-cols-2 gap-4">
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        type="text"
                        placeholder={t('common.username')}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        type="email"
                        placeholder={t('admin.users.table.email')}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        type="password"
                        placeholder={t('admin.users.password')}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        type="text"
                        placeholder={t('admin.users.firstName')}
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        type="text"
                        placeholder={t('admin.users.lastName')}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        required
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Select
                          value={formData.role}
                          onChange={(value) => setFormData({ ...formData, role: value })}
                          options={[
                            { value: 'agent', label: t('admin.users.role.agent') },
                            { value: 'admin', label: t('admin.users.role.admin') },
                          ]}
                        />
                      </motion.div>
                      <motion.input
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                        type="text"
                        placeholder={`${t('admin.users.employeeId')} ${t('admin.users.optional')}`}
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      />
                      <motion.input
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        type="text"
                        placeholder={`${t('admin.users.counterNumber')} ${t('admin.users.optional')}`}
                        value={formData.counterNumber}
                        onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                        className="w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm bg-white dark:bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      />
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
                            <UserPlus className="w-5 h-5" />
                            {t('admin.users.create')}
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

        {/* Users Grid View */}
        {viewMode === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {paginatedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="bg-card text-card-foreground border rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h3>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4 flex-grow">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="break-all">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                        ? 'bg-chart-4/20 text-chart-4 border border-chart-4/30'
                        : 'bg-primary/20 text-primary border border-primary/30'
                        }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <UserCheck className="w-3 h-3" />
                        )}
                        {user.role}
                      </span>
                    </div>
                    {user.employeeId && (
                      <div className="text-sm text-muted-foreground">
                        {t('common.employeeId')}: {user.employeeId}
                      </div>
                    )}
                    {user.counterNumber && (
                      <div className="text-sm text-muted-foreground">
                        {t('common.counter')}: {user.counterNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEdit(user)}
                      className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {t('common.edit')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(user)}
                      className="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:bg-destructive/90 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Users Table View */}
        {viewMode === 'table' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card text-card-foreground border rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                {t('admin.users.allUsers')} ({filteredUsers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.username')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.name')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.email')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.role')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('admin.users.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        {searchQuery ? t('admin.users.noUsersFound') : t('admin.users.noUsersAvailable')}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-foreground text-sm">
                          {user.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-foreground">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                            ? 'bg-chart-4/20 text-chart-4 border border-chart-4/30'
                            : 'bg-primary/20 text-primary border border-primary/30'
                            }`}>
                            {user.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <UserCheck className="w-3 h-3" />
                            )}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(user)}
                              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              {t('common.edit')}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(user)}
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
        {filteredUsers.length > 0 && (
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
