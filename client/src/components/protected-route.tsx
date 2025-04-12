import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Log per debug
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("ProtectedRoute - Reindirizzamento a /login");
      // Utilizziamo un redirect forzato invece di navigate
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Reindirizzamento...</p>
        </div>
      </div>
    );
  }

  // Utente autenticato, mostra i figli
  return <>{children}</>;
};

export default ProtectedRoute;
