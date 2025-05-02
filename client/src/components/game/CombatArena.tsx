import React, { useEffect, useState } from 'react';
import { useCombat } from '../../lib/stores/useCombat';
import { useAudio } from '../../lib/stores/useAudio';
import { useGame } from '../../lib/stores/useGame';
import { CombatAction, CombatParticipant } from '../../lib/types';

interface CombatArenaProps {
  inMenu?: boolean;
}

// Combat Arena component for turn-based battles
const CombatArena: React.FC<CombatArenaProps> = ({ inMenu = false }) => {
  const { 
    encounter, 
    fetchActiveCombat, 
    startCombat,
    executeAction,
    executeEnemyAction,
    distributeCombatRewards 
  } = useCombat();
  
  const { restart, end } = useGame();
  const { playSuccess, playHit } = useAudio();
  
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [actionExecuting, setActionExecuting] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  
  // Check for active combat when component mounts
  useEffect(() => {
    const checkForActiveCombat = async () => {
      const hasActiveCombat = await fetchActiveCombat();
      
      if (!hasActiveCombat && !inMenu) {
        // If no active combat and not in menu, start a new combat
        startNewCombat();
      }
    };
    
    checkForActiveCombat();
  }, [fetchActiveCombat, inMenu]);
  
  // Start a new combat encounter
  const startNewCombat = async () => {
    try {
      setIsStarting(true);
      addToCombatLog('Un groupe de chats maléfiques vous attaque!');
      
      // Start combat with difficulty 1 (easy)
      await startCombat(1);
      
      addToCombatLog('Préparez-vous au combat!');
    } catch (error) {
      console.error('Failed to start combat:', error);
      restart(); // Go back to menu if combat fails to start
    } finally {
      setIsStarting(false);
    }
  };
  
  // Add a message to the combat log
  const addToCombatLog = (message: string) => {
    setCombatLog(prevLog => [...prevLog, message]);
  };
  
  // Select an action to perform
  const handleSelectAction = (action: CombatAction) => {
    setSelectedAction(action);
  };
  
  // Execute the selected action
  const handleConfirmAction = async () => {
    if (!encounter || !selectedAction || actionExecuting) return;
    
    try {
      setActionExecuting(true);
      
      // Get the active participant
      const activeParticipant = encounter.participants[encounter.activeParticipantIndex];
      
      addToCombatLog(`${activeParticipant.name} utilise ${getActionLabel(selectedAction)}!`);
      
      // Execute the player's action
      const result = await executeAction(encounter.id, selectedAction);
      
      // Play appropriate sound effect
      if (selectedAction === CombatAction.ATTACK) {
        playHit();
      }
      
      // Add result to combat log
      if (result) {
        if (result.success) {
          if (result.damage) {
            addToCombatLog(`${getActionSuccessMessage(selectedAction)} ${result.damage} dégâts!`);
          } else {
            addToCombatLog(getActionSuccessMessage(selectedAction));
          }
        } else {
          addToCombatLog(getActionFailMessage(selectedAction));
        }
      }
      
      // Check if combat is over
      if (encounter.status !== 'ongoing') {
        handleCombatEnd();
        return;
      }
      
      // Enemy's turn
      if (encounter.activeParticipantIndex !== 0) {
        await handleEnemyTurn();
      }
      
      // Reset selected action
      setSelectedAction(null);
    } catch (error) {
      console.error('Failed to execute action:', error);
      addToCombatLog('Erreur lors de l\'exécution de l\'action.');
    } finally {
      setActionExecuting(false);
    }
  };
  
  // Handle enemy turn
  const handleEnemyTurn = async () => {
    if (!encounter) return;
    
    try {
      // Get the active enemy
      const activeEnemy = encounter.participants[encounter.activeParticipantIndex];
      
      addToCombatLog(`${activeEnemy.name} réfléchit...`);
      
      // Wait a bit for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Execute enemy action
      const result = await executeEnemyAction(encounter.id);
      
      // Play sound effect
      if (result?.action === CombatAction.ATTACK) {
        playHit();
      }
      
      // Add result to combat log
      if (result) {
        addToCombatLog(`${activeEnemy.name} utilise ${getActionLabel(result.action)}!`);
        
        if (result.success) {
          if (result.damage) {
            addToCombatLog(`${getActionSuccessMessage(result.action)} ${result.damage} dégâts!`);
          } else {
            addToCombatLog(getActionSuccessMessage(result.action));
          }
        } else {
          addToCombatLog(getActionFailMessage(result.action));
        }
      }
      
      // Check if combat is over
      if (encounter.status !== 'ongoing') {
        handleCombatEnd();
      }
    } catch (error) {
      console.error('Failed to execute enemy action:', error);
      addToCombatLog('Erreur lors du tour de l\'ennemi.');
    }
  };
  
  // Handle the end of combat
  const handleCombatEnd = () => {
    if (!encounter) return;
    
    if (encounter.status === 'victory') {
      playSuccess();
      addToCombatLog('Victoire! Vous avez vaincu les chats maléfiques!');
    } else if (encounter.status === 'defeat') {
      addToCombatLog('Défaite! Vos chiens ont été vaincus.');
    }
  };
  
  // Collect rewards after combat
  const handleCollectRewards = async () => {
    if (!encounter) return;
    
    try {
      await distributeCombatRewards(encounter.id);
      restart(); // Go back to the game menu
    } catch (error) {
      console.error('Failed to collect rewards:', error);
    }
  };
  
  // Return to menu
  const handleReturnToMenu = () => {
    restart(); // Go back to the game menu
  };
  
  // Render a health bar for a participant
  const renderHealthBar = (participant: CombatParticipant) => {
    const healthPercent = (participant.currentHp / participant.maxHp) * 100;
    const barColorClass = participant.isEnemy ? 'health-bar-red' : 'health-bar-green';
    
    return (
      <div className="health-bar-container">
        <div 
          className={`health-bar ${barColorClass}`}
          style={{ width: `${healthPercent}%` }}
        ></div>
      </div>
    );
  };
  
  // Get a friendly label for an action
  const getActionLabel = (action: CombatAction): string => {
    switch (action) {
      case CombatAction.ATTACK:
        return 'Attaque';
      case CombatAction.DEFEND:
        return 'Défense';
      case CombatAction.PASS:
        return 'Passe';
      default:
        return action;
    }
  };
  
  // Get success message for an action
  const getActionSuccessMessage = (action: CombatAction): string => {
    switch (action) {
      case CombatAction.ATTACK:
        return 'L\'attaque touche et inflige';
      case CombatAction.DEFEND:
        return 'La défense est en place, réduit les dégâts reçus!';
      case CombatAction.PASS:
        return 'Le tour passe.';
      default:
        return 'L\'action réussit.';
    }
  };
  
  // Get fail message for an action
  const getActionFailMessage = (action: CombatAction): string => {
    switch (action) {
      case CombatAction.ATTACK:
        return 'L\'attaque manque sa cible!';
      case CombatAction.DEFEND:
        return 'La défense n\'a pas pu être mise en place!';
      case CombatAction.PASS:
        return 'Tour passé.';
      default:
        return 'L\'action échoue.';
    }
  };
  
  // If no encounter, show loading
  if (!encounter) {
    return (
      <div className="combat-arena">
        <div className="loading-content">
          <h2>Préparation du combat...</h2>
          <div className="loading-paw-prints">
            <span className="bounce">🐾</span>
            <span className="bounce">🐾</span>
            <span className="bounce">🐾</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Show rewards screen if combat is over
  if (encounter.status === 'victory' || encounter.status === 'defeat') {
    return (
      <div className="combat-arena rewards-screen">
        <h2>{encounter.status === 'victory' ? 'Victoire!' : 'Défaite!'}</h2>
        
        {encounter.status === 'victory' && (
          <div className="rewards-container">
            <h3>Récompenses</h3>
            <div className="reward-item">PLK: +{encounter.rewards.plk}</div>
            <div className="reward-item">LOR: +{encounter.rewards.lor}</div>
            <div className="reward-item">Gemmes: +{encounter.rewards.gems}</div>
            <div className="reward-item">Expérience: +{encounter.rewards.exp}</div>
          </div>
        )}
        
        <button 
          className="collect-rewards-btn"
          onClick={encounter.status === 'victory' ? handleCollectRewards : handleReturnToMenu}
        >
          {encounter.status === 'victory' ? 'Collecter les récompenses' : 'Retour au menu'}
        </button>
      </div>
    );
  }
  
  // Get the active participant
  const activeParticipant = encounter.participants[encounter.activeParticipantIndex];
  const isPlayerTurn = !activeParticipant.isEnemy;
  
  // Split participants into player team and enemy team
  const playerTeam = encounter.participants.filter(p => !p.isEnemy);
  const enemyTeam = encounter.participants.filter(p => p.isEnemy);
  
  return (
    <div className="combat-arena">
      <div className="combat-header">
        <h2>Combat contre les chats maléfiques</h2>
        <div className="combat-turn">
          Tour {encounter.currentTurn} • 
          {isPlayerTurn ? 'Votre tour' : 'Tour de l\'ennemi'}
        </div>
      </div>
      
      <div className="combat-field">
        <div className="player-team">
          <h3>Vos chiens</h3>
          
          {playerTeam.map((participant) => (
            <div 
              key={participant.id}
              className={`
                participant 
                player 
                ${participant.id === activeParticipant.id ? 'active' : ''} 
                ${participant.defeated ? 'defeated' : ''}
              `}
            >
              <div className="participant-name">{participant.name}</div>
              <div className="participant-hp">
                PV: {participant.currentHp}/{participant.maxHp}
              </div>
              
              {renderHealthBar(participant)}
              
              <div className="participant-stats">
                <div>Force: {participant.strength}</div>
                <div>Agilité: {participant.agility}</div>
                <div>Défense: {participant.defense}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="enemy-team">
          <h3>Ennemis</h3>
          
          {enemyTeam.map((participant) => (
            <div 
              key={participant.id}
              className={`
                participant 
                enemy 
                ${participant.id === activeParticipant.id ? 'active' : ''} 
                ${participant.defeated ? 'defeated' : ''}
              `}
            >
              <div className="participant-name">{participant.name}</div>
              <div className="participant-hp">
                PV: {participant.currentHp}/{participant.maxHp}
              </div>
              
              {renderHealthBar(participant)}
              
              <div className="participant-stats">
                <div>Force: {participant.strength}</div>
                <div>Agilité: {participant.agility}</div>
                <div>Défense: {participant.defense}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="combat-log">
        {combatLog.map((message, index) => (
          <div key={index} className="log-entry">{message}</div>
        ))}
      </div>
      
      {isPlayerTurn && (
        <div className="combat-actions">
          <button 
            className={`action-btn attack ${selectedAction === CombatAction.ATTACK ? 'selected' : ''}`}
            onClick={() => handleSelectAction(CombatAction.ATTACK)}
            disabled={actionExecuting}
          >
            Attaque
          </button>
          
          <button 
            className={`action-btn defend ${selectedAction === CombatAction.DEFEND ? 'selected' : ''}`}
            onClick={() => handleSelectAction(CombatAction.DEFEND)}
            disabled={actionExecuting}
          >
            Défense
          </button>
          
          <button 
            className={`action-btn pass ${selectedAction === CombatAction.PASS ? 'selected' : ''}`}
            onClick={() => handleSelectAction(CombatAction.PASS)}
            disabled={actionExecuting}
          >
            Passer
          </button>
          
          <button 
            className="confirm-btn"
            onClick={handleConfirmAction}
            disabled={!selectedAction || actionExecuting}
          >
            {actionExecuting ? 'Exécution...' : 'Confirmer'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CombatArena;