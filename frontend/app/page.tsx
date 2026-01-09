'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Settings, 
  ArrowRight, 
  Ticket,
  Clock,
  BarChart3,
  Shield,
  Zap,
  CheckCircle2
} from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3
    }
  }
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5
    }
  }
};

export default function Home() {
  const { t } = useI18n();
  
  const cards = [
    {
      href: '/customer/check-in',
      icon: Users,
      title: t('home.customer'),
      description: t('home.customerDesc'),
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
      delay: 0
    },
    {
      href: '/agent/login',
      icon: UserCheck,
      title: t('home.agent'),
      description: t('home.agentDesc'),
      color: 'from-chart-2/20 to-chart-2/5',
      iconColor: 'text-chart-2',
      iconBg: 'bg-chart-2/10',
      delay: 0.1
    },
    {
      href: '/admin/login',
      icon: Settings,
      title: t('home.admin'),
      description: t('home.adminDesc'),
      color: 'from-chart-1/20 to-chart-1/5',
      iconColor: 'text-chart-1',
      iconBg: 'bg-chart-1/10',
      delay: 0.2
    }
  ];

  const features = [
    {
      icon: Zap,
      title: t('home.featureLightning'),
      description: t('home.featureLightningDesc')
    },
    {
      icon: BarChart3,
      title: t('home.featureAnalytics'),
      description: t('home.featureAnalyticsDesc')
    },
    {
      icon: Shield,
      title: t('home.featureSecure'),
      description: t('home.featureSecureDesc')
    },
    {
      icon: Clock,
      title: t('home.featureRealtime'),
      description: t('home.featureRealtimeDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Theme Toggle and Language Selector Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="absolute top-4 right-4 z-50 flex items-center gap-2"
      >
        <LanguageSelector />
        <ThemeToggle />
      </motion.div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-background to-background border-b overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-18">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-2"
            >
              <Ticket className="w-10 h-10 text-primary" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-5xl md:text-3xl lg:text-5xl font-bold text-foreground tracking-tight mb-2"
            >
              {t('home.titleMain')}
              <span className="block text-primary mt-2">{t('home.titleSystem')}</span>
            </motion.h1>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                variants={cardVariants}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Link href={card.href}>
                  <div className={`relative h-full bg-gradient-to-br ${card.color} border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden`}>
                    {/* Hover Effect Background */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    
                    <div className="relative z-10">
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`inline-flex items-center justify-center w-16 h-16 ${card.iconBg} rounded-xl mb-6`}
                      >
                        <Icon className={`w-8 h-8 ${card.iconColor}`} />
                      </motion.div>
                      
                      <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {card.title}
                      </h2>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {card.description}
                      </p>
                      
                      <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                        <span>{t('home.getStarted')}</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
