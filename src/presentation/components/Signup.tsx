import { ArrowRight, Cloud, Cpu, Database, Layers, Lock, Mail, Network, Server, User, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SignupProps {
  onSwitchToLogin?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(email.trim(), name.trim(), password, department.trim() || undefined);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left Side - Futuristic Enterprise Architecture Visualization */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Enterprise Architecture Visualization */}
        <div className="relative z-10 w-full max-w-2xl">
          {/* Logo Section */}
          <div className="mb-12 flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-2xl shadow-2xl border border-white/20">
                <Network className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Equity Bank
              </h1>
              <p className="text-purple-300/70 text-sm font-medium">Enterprise Architecture Platform</p>
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="relative">
            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30">
                  <Cpu className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Top Layer - Cloud Services */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-10">
              <div className="flex gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500/80 to-cyan-500/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                      <Cloud className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-blue-400/50 to-transparent"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Layer - Applications */}
            <div className="absolute right-0 top-1/2 transform translate-x-8 -translate-y-1/2 z-10">
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                      <Layers className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-1/2 right-full transform translate-x-0 -translate-y-1/2 w-12 h-0.5 bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Layer - Databases */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8 z-10">
              <div className="flex gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500/80 to-teal-500/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-gradient-to-t from-cyan-400/50 to-transparent"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Left Layer - Servers */}
            <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 z-10">
              <div className="flex flex-col gap-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500/80 to-purple-500/80 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
                      <Server className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute top-1/2 left-full transform -translate-x-0 -translate-y-1/2 w-12 h-0.5 bg-gradient-to-l from-indigo-400/50 to-transparent"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-2 gap-4">
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-purple-300/80 text-xs font-medium mb-1">Join the Team</div>
              <div className="text-white/60 text-xs">Start creating amazing solutions</div>
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-blue-300/80 text-xs font-medium mb-1">Enterprise Ready</div>
              <div className="text-white/60 text-xs">Built for professionals</div>
            </div>
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Background elements for mobile */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl blur-lg opacity-50"></div>
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 rounded-xl shadow-xl border border-white/20">
                <Network className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Equity Bank
              </h1>
              <p className="text-purple-300/70 text-xs font-medium">Enterprise Architecture</p>
            </div>
          </div>

          {/* Signup Card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                Create Account
              </h2>
              <p className="text-purple-200/80 text-sm">
                Sign up to start using the platform
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-purple-200">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-purple-400/60" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-purple-200">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-400/60" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="your.email@equitybank.co.ke"
                  />
                </div>
              </div>

              {/* Department Field (Optional) */}
              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-medium text-purple-200">
                  Department <span className="text-purple-300/50 text-xs">(Optional)</span>
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="block w-full px-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                  placeholder="Engineering, IT, etc."
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-purple-200">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400/60" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-purple-200">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400/60" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-purple-200/80 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => {
                    if (onSwitchToLogin) {
                      onSwitchToLogin();
                    } else {
                      window.location.hash = '#login';
                      window.location.reload();
                    }
                  }}
                  className="text-purple-300 hover:text-white font-medium underline transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-6 text-purple-300/60 text-sm">
            © 2024 Equity Bank Limited. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;

