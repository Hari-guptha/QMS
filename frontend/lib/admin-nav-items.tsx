import { useI18n } from '@/lib/i18n';
import {
  Users,
  FolderOpen,
  List,
  BarChart3,
  LayoutDashboard,
  UserCheck,
} from 'lucide-react';

export function getAdminNavItems(t: (key: string) => string) {
  return [
    {
      href: '/admin/analytics',
      label: t('admin.analytics'),
      icon: BarChart3,
    },
    {
      href: '/admin/users',
      label: t('admin.usersManagement'),
      icon: Users,
    },
    {
      href: '/admin/categories',
      label: t('admin.categories'),
      icon: FolderOpen,
    },
    {
      href: '/admin/queues',
      label: t('admin.allQueues'),
      icon: List,
    },
    {
      href: '/admin/visitors',
      label: t('admin.visitors'),
      icon: UserCheck,
    },
  ];
}

