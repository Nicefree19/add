'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Vote,
  Users,
  Settings
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      title: '대시보드',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: '선거 관리',
      href: '/admin/elections',
      icon: Vote,
    },
    {
      title: '사용자 관리',
      href: '/admin/users',
      icon: Users,
    },
  ];

  return (
    <AdminGuard>
      <div className="flex gap-6">
        {/* 사이드바 */}
        <aside className="w-64 bg-white rounded-lg shadow p-4 space-y-2 sticky top-6 h-fit">
          <div className="px-3 py-2 mb-4">
            <h2 className="text-lg font-bold text-gray-800">관리자</h2>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </aside>

        {/* 메인 컨텐츠 */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
