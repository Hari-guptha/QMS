'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Queue Management System
          </h1>
          <p className="text-xl text-gray-600">
            Universal Queue Management for Any Business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/customer/check-in"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold mb-2">Customer</h2>
            <p className="text-gray-600">Check in and get your token</p>
          </Link>

          <Link
            href="/agent/login"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-semibold mb-2">Agent</h2>
            <p className="text-gray-600">Manage your queue</p>
          </Link>

          <Link
            href="/admin/login"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h2 className="text-2xl font-semibold mb-2">Admin</h2>
            <p className="text-gray-600">System administration</p>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/status"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Public Status Page
          </Link>
        </div>
      </div>
    </div>
  );
}
