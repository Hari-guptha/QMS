'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-4">
            Queue Management System
          </h1>
          <p className="text-xl text-muted-foreground">
            Universal Queue Management for Any Business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/customer/check-in"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold mb-2">Customer</h2>
            <p className="text-muted-foreground">Check in and get your token</p>
          </Link>

          <Link
            href="/agent/login"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-semibold mb-2">Agent</h2>
            <p className="text-muted-foreground">Manage your queue</p>
          </Link>

          <Link
            href="/admin/login"
            className="bg-card text-card-foreground border rounded-xl shadow-sm p-8 hover:shadow-md transition-shadow"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-2xl font-semibold mb-2">Admin</h2>
            <p className="text-muted-foreground">System administration</p>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/status"
            className="text-primary hover:text-primary/80 underline"
          >
            View Public Status Page
          </Link>
        </div>
      </div>
    </div>
  );
}
