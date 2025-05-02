import React, { useState } from 'react';
import { useAuth } from '../../lib/stores/useAuth';

// Authentication form component
const AuthForm: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Get auth functions from store
  const { login, register, isLoading, error: authError, clearError } = useAuth();
  
  // Handle tab switch
  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    clearError();
    setError(null);
  };
  
  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!username || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    // Attempt login
    const success = await login(username, password);
    if (!success && !authError) {
      setError('Échec de la connexion. Veuillez réessayer.');
    }
  };
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!username || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    
    // Validate username length
    if (username.length < 3 || username.length > 20) {
      setError('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères.');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    // Attempt registration
    const success = await register(username, email, password);
    if (!success && !authError) {
      setError('Échec de l\'inscription. Veuillez réessayer.');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Sweet Dog</h1>
          <h2>La Légende d'Ayana et des Chiens Protecteurs</h2>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} 
            onClick={() => switchTab('login')}
          >
            Connexion
          </button>
          <button 
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`} 
            onClick={() => switchTab('register')}
          >
            Inscription
          </button>
        </div>
        
        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input 
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input 
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {(error || authError) && (
              <div className="auth-error">
                {error || authError}
              </div>
            )}
            
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="reg-username">Nom d'utilisateur</label>
              <input 
                type="text"
                id="reg-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reg-password">Mot de passe</label>
              <input 
                type="password"
                id="reg-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmer le mot de passe</label>
              <input 
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            {(error || authError) && (
              <div className="auth-error">
                {error || authError}
              </div>
            )}
            
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>© 2025 Sweet Dog - La Légende d'Ayana et des Chiens Protecteurs</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;