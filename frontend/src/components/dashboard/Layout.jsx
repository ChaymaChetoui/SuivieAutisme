// src/components/dashboard/Layout.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  Users, 
  Heart, 
  BarChart3, 
  Brain, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  User,
  ClipboardList,
  UserCheck,
  Calendar,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTherapist = user?.role === 'therapist';

  // Navigation pour Parent
  const parentNavigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Home },
    { name: 'Mes enfants', href: '/children', icon: Users },
    { name: 'Émotions', href: '/emotions', icon: Heart },
    { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
    { name: 'Insights IA', href: '/ai-insights', icon: Brain },
  ];

  // Navigation pour Thérapeute
  const therapistNavigation = [
    { name: 'Tableau de bord', href: '/therapist/dashboard', icon: Home },
    { name: 'Mes patients', href: '/therapist/patients', icon: UserCheck },
    { name: 'Sessions', href: '/therapist/sessions', icon: Calendar },
    { name: 'Rapports', href: '/therapist/reports', icon: FileText },
    { name: 'Statistiques', href: '/statistics', icon: BarChart3 },
    { name: 'Insights IA', href: '/ai-insights', icon: Brain },
  ];

  const navigation = isTherapist ? therapistNavigation : parentNavigation;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="sidebar sidebar-hidden">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">
              Autism Tracker
            </span>
          </div>

          {/* User Info */}
          <div className="px-6 mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%)' }}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.firstName || user?.email}
                </p>
                <p className="text-xs px-2 py-0.5 rounded-full inline-block" 
                   style={{ 
                     background: isTherapist ? '#dcfce7' : '#dbeafe',
                     color: isTherapist ? '#166534' : '#1e3a8a'
                   }}>
                  {isTherapist ? '👨‍⚕️ Thérapeute' : '👪 Parent'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`sidebar-nav-item ${active ? 'active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="px-4 space-y-1 border-t pt-4">
            <Link
              to="/settings"
              className="sidebar-nav-item"
            >
              <Settings className="sidebar-nav-icon" />
              Paramètres
            </Link>
            <button
              onClick={handleLogout}
              className="sidebar-nav-item w-full text-left"
              style={{ color: '#dc2626' }}
            >
              <LogOut className="sidebar-nav-icon" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="sidebar lg:hidden" style={{ zIndex: 999 }}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-6 mb-8">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold">Autism Tracker</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="sidebar-nav flex-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                  >
                    <Icon className="sidebar-nav-icon" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="w-6" />
        </div>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;