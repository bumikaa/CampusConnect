import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PackageCheck, ShieldAlert, BarChart3, Settings, User, Search, LayoutDashboard, LogOut, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-amazon-navy text-white shadow-md sticky top-0 z-50">
      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <Link to={isAuthenticated ? (user?.role === 'STUDENT' ? '/student' : user?.role === 'DELIVERY_PARTNER' ? '/partner' : '/analytics') : '/login'} className="flex items-center space-x-3 group">
          <img
            src="/CampusConnect/logo.jpg"
            alt="CampusConnect Logo"
            className="w-10 h-10 object-contain rounded-lg border border-amazon-orange/40 bg-amazon-navy p-0.5"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center">
              Campus<span className="text-amazon-orange">Connect</span>
            </h1>
            <p className="text-[11px] text-gray-400 font-medium">Smarter Campus Deliveries. Faster Parcel Resolution.</p>
          </div>
        </Link>

        {/* Navigation links & User Session */}
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold overflow-x-auto">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className={`px-3.5 py-2 rounded-md flex items-center space-x-1.5 transition-colors font-bold ${
                  isActive('/login') ? 'bg-amazon-orange text-amazon-navy' : 'bg-amazon-orange hover:bg-amazon-amber text-amazon-navy'
                }`}
              >
                <LogIn size={15} />
                <span>Portal Sign In</span>
              </Link>
            ) : (
              <>
                {user?.role === 'STUDENT' && (
                  <Link
                    to="/student"
                    className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                      isActive('/student') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                    }`}
                  >
                    <Search size={15} />
                    <span>Track My Parcel</span>
                  </Link>
                )}

                {user?.role === 'DELIVERY_PARTNER' && (
                  <>
                    <Link
                      to="/partner"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/partner') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <LayoutDashboard size={15} />
                      <span>Assigned Deliveries</span>
                    </Link>

                    <Link
                      to="/processing"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/processing') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <PackageCheck size={15} />
                      <span>Bulk Parcel Search</span>
                    </Link>

                    <Link
                      to="/recovery"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/recovery') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <ShieldAlert size={15} />
                      <span>Failed Recovery Queue</span>
                    </Link>
                  </>
                )}

                {user?.role === 'OPERATIONS_MANAGER' && (
                  <>
                    <Link
                      to="/analytics"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/analytics') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <BarChart3 size={15} />
                      <span>Dataset Analytics</span>
                    </Link>

                    <Link
                      to="/partner"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/partner') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <LayoutDashboard size={15} />
                      <span>Batches & Dataset Ingest</span>
                    </Link>

                    <Link
                      to="/recovery"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/recovery') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <ShieldAlert size={15} />
                      <span>Unresolved Queue</span>
                    </Link>

                    <Link
                      to="/settings"
                      className={`px-3 py-2 rounded-md flex items-center space-x-1.5 transition-colors ${
                        isActive('/settings') ? 'bg-amazon-orange text-amazon-navy font-bold' : 'text-gray-300 hover:bg-amazon-dark hover:text-white'
                      }`}
                    >
                      <Settings size={15} />
                      <span>Configuration</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Profile & Logout Badge when authenticated */}
          {isAuthenticated && user && (
            <div className="flex items-center space-x-2 border-l border-gray-700 pl-3">
              <div className="flex items-center space-x-2 bg-amazon-dark px-2.5 py-1 rounded border border-gray-700 text-xs">
                <User size={13} className="text-amazon-amber" />
                <span className="text-gray-200 font-semibold">{user.full_name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-amazon-navy text-amazon-amber border border-amazon-orange/40">
                  {user.role === 'STUDENT' ? 'Student' : user.role === 'DELIVERY_PARTNER' ? 'Delivery Person' : 'Campus Operator'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-red-900/80 hover:bg-red-800 text-white px-2.5 py-1.5 rounded text-xs font-bold transition-colors border border-red-700 shadow-sm"
                title="Sign out of CampusConnect"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
