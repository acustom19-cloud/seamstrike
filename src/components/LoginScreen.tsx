
import React, { useState } from 'react';
import SeamStrikeLogo from './SeamStrikeLogo';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background Graphic */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <div className="flex justify-center mb-6">
            <SeamStrikeLogo className="w-16 h-16" sport="Baseball" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isSignUp ? 'Join SeamStrike' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isSignUp ? 'Start managing your team like a pro.' : 'Sign in to access your team dashboard.'}
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all"
                  placeholder="coach@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all flex items-center justify-center mt-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 font-bold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
        
        {!isSignUp && (
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <button className="text-xs text-slate-400 hover:text-slate-600 font-medium">Forgot Password?</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
