import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, Lock, Mail, ArrowRight, BrainCircuit } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials. Try student@amep.edu / password');
    }
    setLoading(false);
  };

  const fillCredentials = (role: 'student' | 'teacher') => {
    if (role === 'student') {
      setEmail('student@amep.edu');
      setPassword('password');
    } else {
      setEmail('teacher@amep.edu');
      setPassword('password');
    }
  };

  return (
    <div className="min-h-screen bg-alabaster-grey flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center animate-fade-in-up">
        <div className="flex justify-center mb-4">
          <div className="bg-yale-blue p-4 rounded-xl shadow-lg transform rotate-3 hover:rotate-0 transition duration-300">
            <Award className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-graphite mb-2 tracking-tight">Mastery</h1>
        <p className="text-graphite/70 font-medium">Adaptive Learning & Engagement</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-white/50">
        <h2 className="text-xl font-semibold mb-6 text-center text-graphite">Welcome Back</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-graphite/80 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-graphite/40" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-alabaster-grey rounded-lg focus:ring-2 focus:ring-yale-blue focus:border-yale-blue outline-none transition"
                placeholder="you@school.edu"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-graphite/80 mb-1">Password</label>
             <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-graphite/40" />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-alabaster-grey rounded-lg focus:ring-2 focus:ring-yale-blue focus:border-yale-blue outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yale-blue text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition flex justify-center items-center gap-2 shadow-lg shadow-yale-blue/20"
          >
            {loading ? 'Logging in...' : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 border-t border-alabaster-grey pt-6">
          <p className="text-xs text-center text-graphite/50 mb-4 uppercase tracking-wider font-bold">Quick Fill (Demo)</p>
          <div className="flex gap-2">
            <button onClick={() => fillCredentials('student')} className="flex-1 py-2 text-xs bg-alabaster-grey/30 hover:bg-yale-blue/10 text-yale-blue rounded border border-alabaster-grey transition font-medium">
              Student Demo
            </button>
            <button onClick={() => fillCredentials('teacher')} className="flex-1 py-2 text-xs bg-alabaster-grey/30 hover:bg-stormy-teal/10 text-stormy-teal rounded border border-alabaster-grey transition font-medium">
              Teacher Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;