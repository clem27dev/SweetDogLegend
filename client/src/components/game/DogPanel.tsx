import React, { useState, useEffect } from 'react';
import { useDogs } from '../../lib/stores/useDogs';
import { Dog, DogActivity } from '../../lib/types';

interface DogPanelProps {
  inMenu?: boolean;
}

const DogPanel = ({ inMenu = false }: DogPanelProps) => {
  const { dogs, fetchDogs, feedDog, petDog, trainDog } = useDogs();
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch dogs on component mount
  useEffect(() => {
    const loadDogs = async () => {
      setIsLoading(true);
      await fetchDogs();
      setIsLoading(false);
    };
    
    loadDogs();
  }, [fetchDogs]);
  
  // Select first dog by default if none selected
  useEffect(() => {
    if (dogs && dogs.length > 0 && !selectedDog) {
      setSelectedDog(dogs[0]);
    }
  }, [dogs, selectedDog]);
  
  const handleSelectDog = (dog: Dog) => {
    setSelectedDog(dog);
  };
  
  const handleFeed = async () => {
    if (selectedDog) {
      await feedDog(selectedDog.id);
    }
  };
  
  const handlePet = async () => {
    if (selectedDog) {
      await petDog(selectedDog.id);
    }
  };
  
  const handleTrain = async () => {
    if (selectedDog) {
      await trainDog(selectedDog.id);
    }
  };
  
  // Function to render stat bars
  const renderStatBar = (value: number, max: number = 100, color: string = 'blue') => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    
    return (
      <div className="stat-bar-container">
        <div 
          className={`stat-bar stat-bar-${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };
  
  if (isLoading) {
    return <div className="dog-panel">Loading dogs...</div>;
  }
  
  if (!dogs || dogs.length === 0) {
    return <div className="dog-panel">No dogs available</div>;
  }
  
  if (!selectedDog) {
    return <div className="dog-panel">Select a dog</div>;
  }
  
  const isDisabled = selectedDog.activity !== DogActivity.IDLE;
  
  return (
    <div className={`dog-panel ${inMenu ? 'in-menu' : ''}`}>
      <div className="dog-list">
        {dogs.map((dog) => (
          <div 
            key={dog.id}
            className={`dog-list-item ${selectedDog.id === dog.id ? 'selected' : ''}`}
            onClick={() => handleSelectDog(dog)}
          >
            <div className="dog-list-name">{dog.name}</div>
            <div className="dog-list-level">Lv. {dog.level}</div>
            <div className="dog-list-status">
              {dog.activity !== DogActivity.IDLE ? dog.activity : 'Idle'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="dog-details">
        <h2>{selectedDog.name} ({selectedDog.isAdult ? 'Adult' : 'Puppy'})</h2>
        <div className="dog-level">
          Level {selectedDog.level} - Experience: {selectedDog.experience}
        </div>
        
        <div className="dog-stats">
          <div className="stat-row">
            <div className="stat-label">Strength</div>
            <div className="stat-value">{selectedDog.stats.strength}</div>
            {renderStatBar(selectedDog.stats.strength, 100, 'red')}
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Agility</div>
            <div className="stat-value">{selectedDog.stats.agility}</div>
            {renderStatBar(selectedDog.stats.agility, 100, 'green')}
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Defense</div>
            <div className="stat-value">{selectedDog.stats.defense}</div>
            {renderStatBar(selectedDog.stats.defense, 100, 'blue')}
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Happiness</div>
            <div className="stat-value">{selectedDog.stats.happiness}</div>
            {renderStatBar(selectedDog.stats.happiness)}
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Loyalty</div>
            <div className="stat-value">{selectedDog.stats.loyalty}</div>
            {renderStatBar(selectedDog.stats.loyalty)}
          </div>
          
          <div className="stat-row">
            <div className="stat-label">Energy</div>
            <div className="stat-value">{selectedDog.stats.energy}</div>
            {renderStatBar(selectedDog.stats.energy)}
          </div>
        </div>
        
        <div className="dog-actions">
          <button 
            className="dog-action-btn feed-btn" 
            onClick={handleFeed}
            disabled={isDisabled}
          >
            Feed
          </button>
          
          <button 
            className="dog-action-btn pet-btn" 
            onClick={handlePet}
            disabled={isDisabled}
          >
            Pet
          </button>
          
          <button 
            className="dog-action-btn train-btn" 
            onClick={handleTrain}
            disabled={isDisabled}
          >
            Train
          </button>
        </div>
      </div>
    </div>
  );
};

export default DogPanel;