import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from './sidebar';
import { useAuth } from '@/hooks/use-auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  // Impostiamo darkMode come predefinito (come richiesto dall'utente)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [location] = useLocation();
  const { user } = useAuth();

  // Forza modalità scura all'avvio
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Login page has its own layout, so we don't wrap it
  if (location === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar superiore */}
      <header className="bg-gray-900 border-b border-gray-800 py-3 px-4 fixed w-full z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 text-primary hover:text-primary/90">
            <Shield className="h-6 w-6" />
            <span className="text-xl font-bold">SecureGuard</span>
          </Link>
          
          {/* Menu di navigazione */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/dashboard" className={`text-sm font-medium hover:text-primary ${location === '/dashboard' ? 'text-primary' : 'text-gray-300'}`}>
              Dashboard
            </Link>
            <Link href="/scanner" className={`text-sm font-medium hover:text-primary ${location === '/scanner' ? 'text-primary' : 'text-gray-300'}`}>
              Scans
            </Link>
            <Link href="/compliance" className={`text-sm font-medium hover:text-primary ${location === '/compliance' ? 'text-primary' : 'text-gray-300'}`}>
              NIS2 Compliance
            </Link>
            <Link href="/plans" className={`text-sm font-medium hover:text-primary ${location === '/plans' ? 'text-primary' : 'text-gray-300'}`}>
              Pricing
            </Link>
          </nav>
          
          {/* Azioni utente */}
          <div className="flex items-center space-x-4">
            <Link href="/scanner">
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Start Scan
              </Button>
            </Link>
            
            <Link href="/account" className="flex items-center space-x-2 text-gray-300 hover:text-primary">
              <span className="hidden md:inline">{user?.name || 'My Account'}</span>
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      
      {/* Contenuto principale */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
