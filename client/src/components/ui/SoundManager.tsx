import React, { useEffect } from 'react';
import { useAudio } from '../../lib/stores/useAudio';
import { useGame } from '../../lib/stores/useGame';

const SoundManager: React.FC = () => {
  const { 
    backgroundMusic, 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound, 
    isMuted, 
    toggleMute 
  } = useAudio();
  const { phase } = useGame();
  
  // Initialize audio on component mount
  useEffect(() => {
    // Create audio elements
    const bgm = new Audio('/sounds/background_music.mp3');
    bgm.loop = true;
    bgm.volume = 0.3;
    
    const hit = new Audio('/sounds/hit.mp3');
    const success = new Audio('/sounds/success.mp3');
    
    // Set the audio in the store
    setBackgroundMusic(bgm);
    setHitSound(hit);
    setSuccessSound(success);
    
    // Clean up on unmount
    return () => {
      bgm.pause();
      bgm.currentTime = 0;
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);
  
  // Handle background music based on game phase
  useEffect(() => {
    if (!backgroundMusic) return;
    
    if (phase === 'playing' && !isMuted) {
      backgroundMusic.play().catch(err => {
        console.error('Failed to play background music:', err);
      });
    } else {
      backgroundMusic.pause();
    }
    
    return () => {
      backgroundMusic.pause();
    };
  }, [backgroundMusic, phase, isMuted]);
  
  return (
    <div className="sound-control">
      <button 
        className="sound-button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Activer le son' : 'Désactiver le son'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
};

export default SoundManager;