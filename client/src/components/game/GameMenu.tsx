import React from 'react';
import { useGame } from '../../lib/stores/useGame';

const GameMenu = () => {
  const { start } = useGame();

  return (
    <div className="game-menu">
      <div className="menu-container">
        <h1 className="game-title">Sweet Dog</h1>
        <h2 className="game-subtitle">La Légende d'Ayana et des Chiens Protecteurs</h2>
        
        <div className="menu-buttons">
          <button 
            className="menu-button start-button" 
            onClick={start}
          >
            Start Adventure
          </button>
          
          <button className="menu-button">
            Settings
          </button>
          
          <button className="menu-button">
            Credits
          </button>
        </div>
        
        <div className="menu-footer">
          <p>Protect Princess Ayana from Viking Rico's evil cats!</p>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;