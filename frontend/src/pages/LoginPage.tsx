import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck, Truck, GraduationCap, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, showToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT');
  const [identifier, setIdentifier] = useState<string>('student@campus.edu');
  const [password, setPassword] = useState<string>('student123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Handle role selection change
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'STUDENT') {
      setIdentifier('student@campus.edu');
      setPassword('student123');
    } else if (role === 'DELIVERY_PARTNER') {
      setIdentifier('driver@campus.edu');
      setPassword('driver123');
    } else if (role === 'OPERATIONS_MANAGER') {
      setIdentifier('operator@campus.edu');
      setPassword('operator123');
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login({
        email_or_username: identifier.trim(),
        password: password,
        role: selectedRole,
      });

      // Redirect based on authorized role
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'STUDENT') {
          navigate('/student', { replace: true });
        } else if (user.role === 'DELIVERY_PARTNER') {
          navigate('/partner', { replace: true });
        } else {
          navigate('/analytics', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-8">
      {/* Header Branding */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-2 bg-amazon-navy rounded-2xl border-2 border-amazon-orange/50 shadow-md">
          <img
            src="/logo.jpg"
            alt="CampusConnect Logo"
            className="w-16 h-16 object-contain rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-amazon-navy tracking-tight">
          Campus<span className="text-amazon-orange">Connect</span> Authentication
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto font-medium">
          Smarter Campus Deliveries. Select your operational role to access your dedicated dashboard.
        </p>
      </div>

      {/* 3 Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User / Student Login Option */}
        <button
          type="button"
          onClick={() => handleRoleSelect('STUDENT')}
          className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between space-y-3 ${
            selectedRole === 'STUDENT'
              ? 'bg-white border-amazon-orange shadow-lg ring-2 ring-amazon-orange/30'
              : 'bg-white border-amazon-border hover:border-gray-400 opacity-80 hover:opacity-100'
          }`}
        >
          {selectedRole === 'STUDENT' && (
            <span className="absolute top-3 right-3 text-amazon-orange">
              <CheckCircle2 size={18} />
            </span>
          )}
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amazon-orange flex items-center justify-center border border-amber-200">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amazon-navy">User / Student</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Track order status, select campus pickup lockers, and submit feedback.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amazon-orange flex items-center space-x-1">
            <span>Student Sign In</span>
            <ArrowRight size={12} />
          </span>
        </button>

        {/* Delivery Person Login Option */}
        <button
          type="button"
          onClick={() => handleRoleSelect('DELIVERY_PARTNER')}
          className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between space-y-3 ${
            selectedRole === 'DELIVERY_PARTNER'
              ? 'bg-white border-amazon-navy shadow-lg ring-2 ring-amazon-navy/30'
              : 'bg-white border-amazon-border hover:border-gray-400 opacity-80 hover:opacity-100'
          }`}
        >
          {selectedRole === 'DELIVERY_PARTNER' && (
            <span className="absolute top-3 right-3 text-amazon-navy">
              <CheckCircle2 size={18} />
            </span>
          )}
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-amazon-navy flex items-center justify-center border border-blue-200">
              <Truck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amazon-navy">Delivery Person</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Manage assigned delivery queues, 1-click handovers, and failure recovery.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amazon-navy flex items-center space-x-1">
            <span>Driver Staff Sign In</span>
            <ArrowRight size={12} />
          </span>
        </button>

        {/* Operator Login Option */}
        <button
          type="button"
          onClick={() => handleRoleSelect('OPERATIONS_MANAGER')}
          className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between space-y-3 ${
            selectedRole === 'OPERATIONS_MANAGER'
              ? 'bg-white border-amazon-dark shadow-lg ring-2 ring-amazon-dark/30'
              : 'bg-white border-amazon-border hover:border-gray-400 opacity-80 hover:opacity-100'
          }`}
        >
          {selectedRole === 'OPERATIONS_MANAGER' && (
            <span className="absolute top-3 right-3 text-amazon-green">
              <CheckCircle2 size={18} />
            </span>
          )}
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-amazon-green flex items-center justify-center border border-green-200">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-amazon-navy">Campus Operator</h3>
              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
                Exclusive CSV dataset upload desk, complaints resolution, and macro analytics.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amazon-green flex items-center space-x-1">
            <span>Admin Operator Sign In</span>
            <ArrowRight size={12} />
          </span>
        </button>
      </div>

      {/* Login Form Container */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-amazon-border shadow-md space-y-6 max-w-xl mx-auto">
        <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-amazon-navy">
              {selectedRole === 'STUDENT'
                ? 'User / Student Sign In'
                : selectedRole === 'DELIVERY_PARTNER'
                ? 'Delivery Person Staff Portal'
                : 'Campus Operator Admin Portal'}
            </h2>
            <p className="text-xs text-gray-500">
              Enter your credentials to access authorized {selectedRole === 'STUDENT' ? 'student tracking' : selectedRole === 'DELIVERY_PARTNER' ? 'delivery operations' : 'campus administration'} tools.
            </p>
          </div>
          <div className="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amazon-light text-amazon-navy border border-gray-200">
            {selectedRole === 'STUDENT' ? 'Student Role' : selectedRole === 'DELIVERY_PARTNER' ? 'Driver Role' : 'Admin Role'}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-700 flex items-start space-x-2">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Failed</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Email / Username */}
          <div className="space-y-1.5">
            <label className="block font-bold text-amazon-navy uppercase tracking-wider text-[11px]">
              {selectedRole === 'STUDENT' ? 'Student Email or ID' : selectedRole === 'DELIVERY_PARTNER' ? 'Driver Email or Staff ID' : 'Operator Email or Admin ID'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={selectedRole === 'STUDENT' ? 'student@campus.edu' : selectedRole === 'DELIVERY_PARTNER' ? 'driver@campus.edu' : 'operator@campus.edu'}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-amazon-orange focus:border-amazon-orange text-amazon-navy text-xs bg-white"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-amazon-navy uppercase tracking-wider text-[11px]">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-amazon-orange focus:border-amazon-orange text-amazon-navy text-xs bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Demo Quick-Fill Bar */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-[11px] text-amber-900">
            <div>
              <span className="font-bold">Demo Account: </span>
              <span className="font-mono">
                {selectedRole === 'STUDENT'
                  ? 'student@campus.edu / student123'
                  : selectedRole === 'DELIVERY_PARTNER'
                  ? 'driver@campus.edu / driver123'
                  : 'operator@campus.edu / operator123'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRoleSelect(selectedRole)}
              className="text-amazon-orange hover:underline font-bold text-[10px] uppercase tracking-wider ml-2 shrink-0"
            >
              Auto-Fill
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 text-white ${
              selectedRole === 'STUDENT'
                ? 'bg-amazon-orange hover:bg-amazon-amber text-amazon-navy'
                : selectedRole === 'DELIVERY_PARTNER'
                ? 'bg-amazon-navy hover:bg-amazon-dark'
                : 'bg-amazon-dark hover:bg-gray-800 text-amazon-amber border border-amazon-orange/40'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to {selectedRole === 'STUDENT' ? 'Student Portal' : selectedRole === 'DELIVERY_PARTNER' ? 'Delivery Dashboard' : 'Operator Admin'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
