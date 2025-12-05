'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
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
    try {
      await adminApi.createUser(formData);
      setShowForm(false);
      setFormData({
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
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminApi.deleteUser(id);
      loadUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user');
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
            {showForm ? 'Cancel' : 'Create User'}
          </button>
        </div>

        {showForm && (
          <div className="bg-card text-card-foreground border rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Create New User</h2>
            <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                required
              />
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="text"
                placeholder="Employee ID (optional)"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              />
              <input
                type="text"
                placeholder="Counter Number (optional)"
                value={formData.counterNumber}
                onChange={(e) => setFormData({ ...formData, counterNumber: e.target.value })}
                className="px-4 py-2 border border-border rounded-md bg-input text-foreground focus:ring-[3px] focus:ring-ring focus:ring-opacity-50"
              />
              <button
                type="submit"
                className="bg-chart-2 text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity shadow-xs"
              >
                Create User
              </button>
            </form>
          </div>
        )}

        <div className="bg-card text-card-foreground border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-foreground">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-chart-4/20 text-chart-4 border border-chart-4/30' 
                        : 'bg-primary/20 text-primary border border-primary/30'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
