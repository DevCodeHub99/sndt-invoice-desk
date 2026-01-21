'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

const authRoutes = ['/auth/login', '/auth/register', '/auth/setup'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.includes(pathname);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="min-h-screen pt-16 px-4 pb-6 lg:pt-8 lg:ml-60 lg:px-8">
        {children}
      </main>
    </>
  );
}
