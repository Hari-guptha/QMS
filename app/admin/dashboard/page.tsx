'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';
import { 
  Users, 
  FolderOpen, 
  List, 
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { duration: 0.3 }
  }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5 }
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const user = auth.getUser();
    if (user?.role !== 'admin') {
      router.push('/admin/login');
      return;
    }

    loadDashboard();
  }, [router]);

  const loadDashboard = async () => {
    try {
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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
            <div className="text-lg text-muted-foreground">Loading dashboard...</div>
          </motion.div>
        </div>
      </div>
    );
  }

  const quickLinks = [
    {
      href: '/admin/users',
      icon: Users,
      title: 'Users Management',
      description: 'Manage agents and users',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    {
      href: '/admin/categories',
      icon: FolderOpen,
      title: 'Categories',
      description: 'Manage service categories',
      color: 'from-chart-2/20 to-chart-2/5',
      iconColor: 'text-chart-2',
      iconBg: 'bg-chart-2/10',
    },
    {
      href: '/admin/queues',
      icon: List,
      title: 'All Queues',
      description: 'View and manage all queues',
      color: 'from-chart-1/20 to-chart-1/5',
      iconColor: 'text-chart-1',
      iconBg: 'bg-chart-1/10',
    },
    {
      href: '/admin/analytics',
      icon: BarChart3,
      title: 'Analytics',
      description: 'View reports and statistics',
      color: 'from-chart-4/20 to-chart-4/5',
      iconColor: 'text-chart-4',
      iconBg: 'bg-chart-4/10',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your queue management system
          </p>
        </motion.div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.href}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={cardVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={link.href}>
                  <div className={`relative h-full bg-gradient-to-br ${link.color} border border-border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden`}>
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex items-center justify-center w-14 h-14 ${link.iconBg} rounded-xl mb-4`}
                    >
                      <Icon className={`w-7 h-7 ${link.iconColor}`} />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {link.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {link.description}
                    </p>
                    <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                      <span className="text-sm">View</span>
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-card text-card-foreground border rounded-2xl shadow-sm p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Quick Stats</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 }}
              className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Avg Wait Time</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.avgWaitTime || 0}
                <span className="text-xl text-muted-foreground ml-2">min</span>
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 }}
              className="p-6 bg-gradient-to-br from-chart-2/10 to-chart-2/5 border border-chart-2/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-chart-2" />
                <span className="text-sm font-medium text-muted-foreground">Avg Service Time</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.avgServiceTime || 0}
                <span className="text-xl text-muted-foreground ml-2">min</span>
              </p>
            </motion.div>
            <motion.div
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
              className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-medium text-muted-foreground">Abandonment Rate</span>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {stats.abandonmentRate?.toFixed(1) || 0}
                <span className="text-xl text-muted-foreground ml-2">%</span>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
