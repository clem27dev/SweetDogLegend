import React, { useState } from 'react';
import { useGame } from '../../lib/stores/useGame';
import { useAuth } from '../../lib/stores/useAuth';
import { useAudio } from '../../lib/stores/useAudio';

const GameMenu: React.FC = () => {
  const { start } = useGame();
  const { user, logout } = useAuth();
  const { isMuted, toggleMute } = useAudio();
  const [showControls, setShowControls] = useState(false);
  
  // Handle starting the game
  const handleStart = () => {
    console.log('Starting game');
    start();
  };
  
  // Toggle the controls modal
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="game-menu">
      <div className="menu-container">
        <h1 className="game-title">Sweet Dog</h1>
        <h2 className="game-subtitle">La Légende d'Ayana et des Chiens Protecteurs</h2>
        
        <div className="menu-buttons">
          <button className="menu-button start-button" onClick={handleStart}>
            Jouer
          </button>
          
          <button className="menu-button" onClick={toggleControls}>
            {showControls ? 'Cacher les contrôles' : 'Voir les contrôles'}
          </button>
          
          <button 
            className="menu-button" 
            onClick={toggleMute}
          >
            {isMuted ? 'Activer le son' : 'Désactiver le son'}
          </button>
          
          <button className="menu-button" onClick={logout}>
            Déconnexion
          </button>
        </div>
        
        {showControls && (
          <div className="controls-modal">
            <h3>Contrôles du jeu</h3>
            <ul>
              <li><strong>W / ↑</strong> - Se déplacer vers l'avant</li>
              <li><strong>S / ↓</strong> - Se déplacer vers l'arrière</li>
              <li><strong>A / ←</strong> - Se déplacer vers la gauche</li>
              <li><strong>D / →</strong> - Se déplacer vers la droite</li>
              <li><strong>Space</strong> - Sauter</li>
              <li><strong>E</strong> - Interagir</li>
            </ul>
          </div>
        )}
        
        <div className="menu-footer">
          {user && `Bonjour, ${user.username}! Aidez la Princesse Ayana à repousser les chats maléfiques!`}
        </div>
      </div>
    </div>
  );
};

export default GameMenu;