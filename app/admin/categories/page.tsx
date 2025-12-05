'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

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
          <div className="text-xl text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <Link href="/admin/dashboard" className="text-primary hover:text-primary/80">
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors shadow-xs"
          >
            {showForm ? 'Cancel' : 'Create Category'}
          </button>
        </div>
        {showForm && (
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Create New Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              />
              <input
                type="number"
                placeholder="Estimated Wait Time (minutes)"
                value={formData.estimatedWaitTime}
                onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                min="0"
              />
              <button
                type="submit"
                className="bg-chart-2 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity shadow-xs"
              >
                Create Category
              </button>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-card text-card-foreground border rounded-xl shadow-sm p-6">
              {editingCategory === category.id ? (
                <form onSubmit={(e) => handleUpdate(e, category.id)} className="space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                    required
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                    rows={2}
                  />
                  <input
                    type="number"
                    value={formData.estimatedWaitTime}
                    onChange={(e) => setFormData({ ...formData, estimatedWaitTime: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                    min="0"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-chart-2 text-white px-3 py-1 rounded-md text-sm hover:opacity-90 transition-opacity shadow-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setFormData({ name: '', description: '', estimatedWaitTime: 0 });
                      }}
                      className="flex-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/80 transition-colors border"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{category.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-primary hover:text-primary/80 text-sm"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-destructive hover:text-destructive/80 text-sm"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm">{category.description}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Wait: {category.estimatedWaitTime} min
                  </p>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-semibold">Assigned Agents</h4>
                      <button
                        onClick={() => setAssigningAgent(assigningAgent === category.id ? null : category.id)}
                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        {assigningAgent === category.id ? 'Cancel' : '+ Assign'}
                      </button>
                    </div>

                    {assigningAgent === category.id && (
                      <div className="mb-3 p-2 bg-muted border rounded-md">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAssignAgent(category.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-2 py-1 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50 text-sm"
                          defaultValue=""
                        >
                          <option value="">Select agent...</option>
                          {agents
                            .filter((agent) => {
                              const assigned = category.agentCategories?.some(
                                (ac: any) => ac.agentId === agent.id && ac.isActive
                              );
                              return !assigned;
                            })
                            .map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.firstName} {agent.lastName}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      {category.agentCategories?.filter((ac: any) => ac.isActive).length > 0 ? (
                        category.agentCategories
                          .filter((ac: any) => ac.isActive)
                          .map((ac: any) => (
                            <div
                              key={ac.id}
                              className="flex justify-between items-center p-2 bg-muted border rounded-md text-sm"
                            >
                              <span>
                                {ac.agent?.firstName} {ac.agent?.lastName}
                              </span>
                              <button
                                onClick={() => handleRemoveAgent(category.id, ac.agentId)}
                                className="text-destructive hover:text-destructive/80 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No agents assigned</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

