'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Authentication Provider
 * Verifies authentication state on app load and route changes
 * Redirects to login if authentication fails
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const verifyAuth = useAuthStore((state) => state.verifyAuth);
  const [isChecking, setIsChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    async function checkAuth() {
      // Skip auth check for public routes
      if (isPublicRoute) {
        setIsChecking(false);
        return;
      }

      // Verify authentication
      const isValid = await verifyAuth();

      if (!isValid && !isPublicRoute) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
      }

      setIsChecking(false);
    }

    checkAuth();
  }, [pathname, isPublicRoute, router, verifyAuth]); // Re-check on route change

  // Show loading state while checking authentication
  if (isChecking && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
