import { useState } from 'react';
import { useNavigate } from 'react-router-dom' ;
import { authService } from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@facep.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.admin));
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Carte principale */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          
          {/* Header avec icône */}
          <div className="text-center pt-10 pb-6 px-6">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Reconnaissance Faciale
            </h1>
            <p className="text-blue-200 text-sm">Système de pointage intelligent</p>
          </div>

          {/* Logo FACEP */}
          <div className="text-center mb-8">
            <span className="text-4xl font-black text-white tracking-wider drop-shadow-lg">
              FACEP
            </span>
            <div className="w-16 h-0.5 bg-blue-300 mx-auto mt-3"></div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="px-8 pb-10">
            {error && (
              <div className="bg-red-500/20 border border-red-400 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Champ Email */}
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-2">
                  Adresse Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white/20 border border-white/30 rounded-xl 
                             text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 
                             focus:border-transparent transition duration-200"
                    placeholder="admin@facep.com"
                    required
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div>
                <label className="block text-blue-100 text-sm font-medium mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round"strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white/20 border border-white/30 rounded-xl 
                             text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 
                             focus:border-transparent transition duration-200"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Lien Mot de passe oublié */}
              <div className="text-right">
                <a href="#" className="text-sm text-blue-200 hover:text-white transition">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Bouton Connexion */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
                         text-white font-semibold py-3 px-4 rounded-xl transition duration-200 
                         transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-blue-500/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-8 py-5 bg-white/5 border-t border-white/10 text-center">
            <p className="text-xs text-blue-200">
              © 2024 FACEP. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
