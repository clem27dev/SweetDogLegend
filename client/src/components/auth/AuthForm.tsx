import React, { useState } from 'react';
import { useAuth } from '../../lib/stores/useAuth';

const AuthForm = () => {
  const { login, register, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
  };
  
  const validateForm = () => {
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (!isLoginMode && (!email || !email.includes('@'))) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    try {
      if (isLoginMode) {
        await login(username, password);
      } else {
        await register(username, password, email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-form-wrapper">
        <div className="auth-header">
          <h1>Sweet Dog</h1>
          <h2>La Légende d'Ayana et des Chiens Protecteurs</h2>
          
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(true)}
              disabled={isLoading}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${!isLoginMode ? 'active' : ''}`}
              onClick={() => setIsLoginMode(false)}
              disabled={isLoading}
            >
              Register
            </button>
          </div>
        </div>
        
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>
          
          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isLoginMode ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={handleToggleMode}
              className="toggle-button"
              disabled={isLoading}
            >
              {isLoginMode ? 'Register' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;