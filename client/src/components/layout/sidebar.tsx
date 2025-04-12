import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, Shield, FileText, ClipboardCheck, Package2, Settings, 
  HelpCircle, LogOut, Menu, X, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Get initials from user name
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Function to check if a route is active
  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, text: 'Dashboard', path: '/dashboard' },
    { icon: <Shield className="w-5 h-5" />, text: 'Security Scanner', path: '/scanner' },
    { icon: <FileText className="w-5 h-5" />, text: 'Reports', path: '/reports' },
    { icon: <ClipboardCheck className="w-5 h-5" />, text: 'NIS2 Compliance', path: '/compliance' },
    { icon: <Package2 className="w-5 h-5" />, text: 'Plans', path: '/plans' },
  ];

  const bottomMenuItems = [
    { icon: <Settings className="w-5 h-5" />, text: 'Settings', path: '/settings' },
    { icon: <HelpCircle className="w-5 h-5" />, text: 'Help', path: '/help' },
  ];

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location, setSidebarOpen]);

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Menu />
          </Button>
          <span className="text-lg font-semibold text-primary">SecurityScanner</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleDarkMode}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-primary">SecurityScanner</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white lg:hidden"
              >
                <X />
              </Button>
            </div>
            {/* User Info */}
            {user ? (
              <div className="mt-4 flex items-center space-x-3">
                <Avatar className="h-10 w-10 bg-primary text-white">
                  <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name || user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            )}
            {/* Plan Badge */}
            {user && (
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <span>Plan: {user.plan}</span>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-4 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.path}
                    className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <ul className="space-y-2">
                {bottomMenuItems.map((item, index) => (
                  <li key={index}>
                    <Link 
                      href={item.path}
                      className={`flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isActive(item.path) ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      {item.icon}
                      <span className="ml-3">{item.text}</span>
                    </Link>
                  </li>
                ))}
                {user && (
                  <li>
                    <button
                      onClick={logout}
                      className="w-full flex items-center px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="ml-3">Logout</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      <div 
        onClick={() => setSidebarOpen(false)} 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-30 lg:hidden ${
          sidebarOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      ></div>
    </>
  );
};

export default Sidebar;
