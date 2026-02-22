// ============================================
// MAIN APP COMPONENT
// ============================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { navigateTo, useRoute } from '@/lib/router';
import { lazy, Suspense } from 'react';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const StudentsPage = lazy(() => import('@/pages/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const StudentProfilePage = lazy(() => import('@/pages/StudentProfilePage').then((m) => ({ default: m.StudentProfilePage })));
const StudentAcademicRecordsPage = lazy(() =>
  import('@/pages/StudentAcademicRecordsPage').then((m) => ({ default: m.StudentAcademicRecordsPage }))
);
const AddStudentPage = lazy(() => import('@/pages/AddStudentPage').then((m) => ({ default: m.AddStudentPage })));
const EditStudentPage = lazy(() => import('@/pages/EditStudentPage').then((m) => ({ default: m.EditStudentPage })));

// ============================================
// ROUTER COMPONENT
// ============================================

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const route = useRoute();

  const pageLoadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading page...</p>
      </div>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && route.page !== 'login') {
    navigateTo({ page: 'login' });
    return null;
  }

  // Redirect to dashboard if authenticated and on login page
  if (isAuthenticated && route.page === 'login') {
    navigateTo({ page: 'dashboard' });
    return null;
  }

  // Render appropriate page
  return (
    <Suspense fallback={pageLoadingFallback}>
      {route.page === 'login' && <LoginPage />}
      {route.page === 'dashboard' && <DashboardPage />}
      {route.page === 'students' && <StudentsPage />}
      {route.page === 'student-profile' && <StudentProfilePage studentId={route.studentId} />}
      {route.page === 'student-academic-records' && <StudentAcademicRecordsPage studentId={route.studentId} />}
      {route.page === 'add-student' && <AddStudentPage />}
      {route.page === 'edit-student' && <EditStudentPage studentId={route.studentId} />}
    </Suspense>
  );
}

// ============================================
// MAIN APP
// ============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
