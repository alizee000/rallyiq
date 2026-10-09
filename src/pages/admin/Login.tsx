import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Trophy, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-lime-DEFAULT/10 via-cyan-DEFAULT/5 to-transparent -z-10"></div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-graphite-900 rounded-full flex items-center justify-center shadow-lg mb-6">
          <Trophy className="text-lime-DEFAULT" size={28} />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-graphite-100 tracking-tight mb-2">
          Admin Portal
        </h1>
        <p className="text-graphite-400 text-sm font-medium mb-8">Sign in to manage tournaments</p>

        <form onSubmit={handleLogin} className="w-full max-w-sm glass-card p-6 rounded-3xl space-y-5">
          {error && (
            <div className="p-3 bg-coral-DEFAULT/10 border border-coral-DEFAULT/20 rounded-xl">
              <p className="text-xs font-bold text-coral-DEFAULT text-center">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="text-graphite-400" size={18} />
              </div>
              <input
                type="email"
                required
                className="neo-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-graphite-100 placeholder:text-graphite-400 font-medium"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="text-graphite-400" size={18} />
              </div>
              <input
                type="password"
                required
                className="neo-input w-full rounded-2xl py-3.5 pl-11 pr-4 text-graphite-100 placeholder:text-graphite-400 font-medium"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="neo-btn w-full !bg-lime-DEFAULT text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>
          
          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => navigate('/')} 
              className="text-xs font-bold text-graphite-400 hover:text-graphite-100 transition-colors"
            >
              Return to Public View
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
