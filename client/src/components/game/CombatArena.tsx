import React, { useState, useEffect } from 'react';
import { useCombat } from '../../lib/stores/useCombat';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';
import { CombatAction, CombatParticipant } from '../../lib/types';

interface CombatArenaProps {
  inMenu?: boolean;
}

const CombatArena = ({ inMenu = false }: CombatArenaProps) => {
  const { restart } = useGame();
  const { playHit, playSuccess } = useAudio();
  
  const { 
    encounter, 
    fetchActiveCombat, 
    startCombat, 
    executeAction, 
    executeEnemyAction, 
    distributeCombatRewards 
  } = useCombat();
  
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);
  const [showRewards, setShowRewards] = useState(false);
  
  // Load active combat on mount
  useEffect(() => {
    const loadCombat = async () => {
      setIsLoading(true);
      const hasActiveCombat = await fetchActiveCombat();
      
      if (!hasActiveCombat) {
        await startCombat(1); // Start a level 1 combat by default
      }
      
      setIsLoading(false);
    };
    
    loadCombat();
  }, [fetchActiveCombat, startCombat]);
  
  // Handle encounter status changes
  useEffect(() => {
    if (encounter && encounter.status !== 'ongoing' && !showRewards) {
      // Show victory or defeat message
      setActionLog(prev => [
        ...prev, 
        `Combat ${encounter.status === 'victory' ? 'Victory!' : 'Defeat!'}`
      ]);
      
      // Play appropriate sound
      if (encounter.status === 'victory') {
        playSuccess();
      }
      
      // Show rewards after a delay
      setTimeout(() => {
        setShowRewards(true);
      }, 2000);
    }
  }, [encounter, showRewards, playSuccess]);
  
  // Handle player action
  const handleActionSelect = (action: CombatAction) => {
    setSelectedAction(action);
  };
  
  const handleActionConfirm = async () => {
    if (!selectedAction || !encounter) return;
    
    // Execute player action
    setIsLoading(true);
    const result = await executeAction(encounter.id, selectedAction);
    setIsLoading(false);
    
    if (result) {
      // Play hit sound if it was an attack
      if (selectedAction === CombatAction.ATTACK) {
        playHit();
      }
      
      // Add action to log
      setActionLog(prev => [
        ...prev, 
        `You used ${selectedAction}!`
      ]);
      
      // Execute enemy action if combat is still ongoing
      if (encounter.status === 'ongoing') {
        setTimeout(async () => {
          setIsLoading(true);
          const enemyResult = await executeEnemyAction(encounter.id);
          setIsLoading(false);
          
          if (enemyResult) {
            playHit();
            setActionLog(prev => [
              ...prev, 
              `Enemy used ${enemyResult.action}!`
            ]);
          }
        }, 1000);
      }
    }
    
    // Reset selected action
    setSelectedAction(null);
  };
  
  // Handle collecting rewards
  const handleCollectRewards = async () => {
    if (!encounter) return;
    
    setIsLoading(true);
    await distributeCombatRewards(encounter.id);
    setIsLoading(false);
    
    // Return to main game
    restart();
  };
  
  // Render participant health bar
  const renderHealthBar = (participant: CombatParticipant) => {
    const healthPercentage = Math.max(0, (participant.currentHp / participant.maxHp) * 100);
    const barColor = participant.isEnemy ? 'red' : 'green';
    
    return (
      <div className="health-bar-container">
        <div 
          className={`health-bar health-bar-${barColor}`} 
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
    );
  };
  
  if (isLoading) {
    return <div className="combat-arena">Loading combat...</div>;
  }
  
  if (!encounter) {
    return <div className="combat-arena">No active combat</div>;
  }
  
  // Show rewards screen
  if (showRewards) {
    return (
      <div className="combat-arena rewards-screen">
        <h2>{encounter.status === 'victory' ? 'Victory!' : 'Defeat'}</h2>
        
        {encounter.status === 'victory' && (
          <div className="rewards-container">
            <h3>Rewards</h3>
            <div className="reward-item">🍖 PLK: {encounter.rewards.plk}</div>
            <div className="reward-item">🧱 LOR: {encounter.rewards.lor}</div>
            <div className="reward-item">💎 Gems: {encounter.rewards.gems}</div>
            <div className="reward-item">⭐ Experience: {encounter.rewards.exp}</div>
          </div>
        )}
        
        <button 
          className="collect-rewards-btn"
          onClick={handleCollectRewards}
        >
          {encounter.status === 'victory' ? 'Collect Rewards' : 'Return to Game'}
        </button>
      </div>
    );
  }
  
  // Get active participant
  const activeParticipant = encounter.participants[encounter.activeParticipantIndex];
  const isPlayerTurn = activeParticipant && !activeParticipant.isEnemy;
  
  // Separate participants into player's team and enemies
  const playerTeam = encounter.participants.filter(p => !p.isEnemy);
  const enemyTeam = encounter.participants.filter(p => p.isEnemy);
  
  return (
    <div className={`combat-arena ${inMenu ? 'in-menu' : ''}`}>
      <div className="combat-header">
        <h2>Combat - Level {encounter.difficulty}</h2>
        <div className="combat-turn">Turn {encounter.currentTurn}</div>
      </div>
      
      <div className="combat-field">
        <div className="player-team">
          {playerTeam.map((participant) => (
            <div 
              key={participant.id}
              className={`participant player ${participant.defeated ? 'defeated' : ''} ${activeParticipant?.id === participant.id ? 'active' : ''}`}
            >
              <div className="participant-name">{participant.name}</div>
              <div className="participant-hp">
                HP: {participant.currentHp}/{participant.maxHp}
              </div>
              {renderHealthBar(participant)}
              <div className="participant-stats">
                <div className="stat">STR: {participant.strength}</div>
                <div className="stat">AGI: {participant.agility}</div>
                <div className="stat">DEF: {participant.defense}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="enemy-team">
          {enemyTeam.map((participant) => (
            <div 
              key={participant.id}
              className={`participant enemy ${participant.defeated ? 'defeated' : ''} ${activeParticipant?.id === participant.id ? 'active' : ''}`}
            >
              <div className="participant-name">{participant.name}</div>
              <div className="participant-hp">
                HP: {participant.currentHp}/{participant.maxHp}
              </div>
              {renderHealthBar(participant)}
              <div className="participant-stats">
                <div className="stat">STR: {participant.strength}</div>
                <div className="stat">AGI: {participant.agility}</div>
                <div className="stat">DEF: {participant.defense}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="combat-log">
        {actionLog.map((log, index) => (
          <div key={index} className="log-entry">{log}</div>
        ))}
      </div>
      
      <div className="combat-actions">
        <button 
          className={`action-btn attack ${selectedAction === CombatAction.ATTACK ? 'selected' : ''}`}
          onClick={() => handleActionSelect(CombatAction.ATTACK)}
          disabled={!isPlayerTurn}
        >
          Attack
        </button>
        
        <button 
          className={`action-btn defend ${selectedAction === CombatAction.DEFEND ? 'selected' : ''}`}
          onClick={() => handleActionSelect(CombatAction.DEFEND)}
          disabled={!isPlayerTurn}
        >
          Defend
        </button>
        
        <button 
          className={`action-btn pass ${selectedAction === CombatAction.PASS ? 'selected' : ''}`}
          onClick={() => handleActionSelect(CombatAction.PASS)}
          disabled={!isPlayerTurn}
        >
          Pass
        </button>
        
        <button 
          className="confirm-btn"
          onClick={handleActionConfirm}
          disabled={!isPlayerTurn || !selectedAction}
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default CombatArena;