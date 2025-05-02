import React, { useEffect, useState } from 'react';
import { useDogs } from '../../lib/stores/useDogs';
import { useAudio } from '../../lib/stores/useAudio';
import { useResources } from '../../lib/stores/useResources';
import { Dog, DogActivity } from '../../lib/types';

interface DogPanelProps {
  inMenu?: boolean;
}

const DogPanel: React.FC<DogPanelProps> = ({ inMenu = false }) => {
  const { 
    dogs, 
    fetchDogs, 
    selectedDogId, 
    selectDog,
    feedDog,
    petDog,
    trainDog
  } = useDogs();
  
  const { resources, updateResources } = useResources();
  const { playSuccess } = useAudio();
  
  const [feedLoading, setFeedLoading] = useState(false);
  const [petLoading, setPetLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [breedingLoading, setBreedingLoading] = useState(false);
  
  // Fetch dogs when component mounts
  useEffect(() => {
    fetchDogs();
  }, [fetchDogs]);
  
  // Get the selected dog
  const selectedDog = dogs.find(dog => dog.id === selectedDogId);
  
  // If no dogs loaded yet, select the first one
  useEffect(() => {
    if (dogs.length > 0 && !selectedDogId) {
      selectDog(dogs[0].id);
    }
  }, [dogs, selectedDogId, selectDog]);
  
  // Handle selecting a dog
  const handleSelectDog = (dog: Dog) => {
    selectDog(dog.id);
  };
  
  // Handle feeding a dog
  const handleFeedDog = async () => {
    if (!selectedDog || !resources || feedLoading) return;
    
    // Check if player has enough PLK
    if (resources.plk < 2) {
      console.error('Not enough PLK to feed dog');
      return;
    }
    
    try {
      setFeedLoading(true);
      await feedDog(selectedDog.id);
      await updateResources(-2, 0, 0); // Reduce PLK by 2
      playSuccess();
    } catch (error) {
      console.error('Error feeding dog:', error);
    } finally {
      setFeedLoading(false);
    }
  };
  
  // Handle petting a dog
  const handlePetDog = async () => {
    if (!selectedDog || petLoading) return;
    
    try {
      setPetLoading(true);
      await petDog(selectedDog.id);
      playSuccess();
    } catch (error) {
      console.error('Error petting dog:', error);
    } finally {
      setPetLoading(false);
    }
  };
  
  // Handle training a dog
  const handleTrainDog = async () => {
    if (!selectedDog || !resources || trainLoading) return;
    
    // Check if player has enough LOR
    if (resources.lor < 5) {
      console.error('Not enough LOR to train dog');
      return;
    }
    
    try {
      setTrainLoading(true);
      await trainDog(selectedDog.id);
      await updateResources(0, -5, 0); // Reduce LOR by 5
      playSuccess();
    } catch (error) {
      console.error('Error training dog:', error);
    } finally {
      setTrainLoading(false);
    }
  };
  
  // Get status text for a dog
  const getDogStatusText = (dog: Dog) => {
    if (!dog.isAdult) {
      return 'Chiot';
    }
    
    switch (dog.activity) {
      case DogActivity.FEEDING:
        return 'En train de manger';
      case DogActivity.PETTING:
        return 'En train d\'être caressé';
      case DogActivity.TRAINING:
        return 'En entrainement';
      case DogActivity.BREEDING:
        return 'En élevage';
      case DogActivity.COMBATING:
        return 'En combat';
      default:
        return 'Disponible';
    }
  };
  
  // Get color for a stat bar
  const getStatBarColor = (stat: string) => {
    switch (stat) {
      case 'strength':
      case 'defense':
        return 'stat-bar-red';
      case 'happiness':
      case 'loyalty':
        return 'stat-bar-green';
      case 'agility':
      case 'energy':
        return 'stat-bar-blue';
      default:
        return '';
    }
  };
  
  // If no dogs yet, show a message
  if (dogs.length === 0) {
    return (
      <div className="dog-panel">
        <div className="dog-empty-state">
          Aucun chien disponible. Visitez la boutique pour adopter votre premier chien!
        </div>
      </div>
    );
  }
  
  return (
    <div className="dog-panel">
      <div className="dog-list">
        {dogs.map((dog) => (
          <div 
            key={dog.id}
            className={`dog-list-item ${selectedDogId === dog.id ? 'selected' : ''}`}
            onClick={() => handleSelectDog(dog)}
          >
            <div className="dog-list-name">{dog.name}</div>
            <div className="dog-list-level">Niveau {dog.level}</div>
            <div className="dog-list-status">{getDogStatusText(dog)}</div>
          </div>
        ))}
      </div>
      
      {selectedDog && (
        <div className="dog-details">
          <h2>{selectedDog.name}</h2>
          <div className="dog-level">
            Niveau {selectedDog.level} • {selectedDog.isAdult ? 'Adulte' : 'Chiot'} • 
            Exp: {selectedDog.experience}/100
          </div>
          
          <div className="dog-stats">
            <div className="stat-row">
              <div className="stat-label">Force</div>
              <div className="stat-value">{selectedDog.stats.strength}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('strength')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.strength)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-label">Agilité</div>
              <div className="stat-value">{selectedDog.stats.agility}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('agility')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.agility)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-label">Défense</div>
              <div className="stat-value">{selectedDog.stats.defense}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('defense')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.defense)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-label">Bonheur</div>
              <div className="stat-value">{selectedDog.stats.happiness}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('happiness')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.happiness)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-label">Loyauté</div>
              <div className="stat-value">{selectedDog.stats.loyalty}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('loyalty')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.loyalty)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="stat-row">
              <div className="stat-label">Énergie</div>
              <div className="stat-value">{selectedDog.stats.energy}</div>
              <div className="stat-bar-container">
                <div 
                  className={`stat-bar ${getStatBarColor('energy')}`} 
                  style={{ width: `${Math.min(100, selectedDog.stats.energy)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="dog-actions">
            <button 
              className="dog-action-btn feed-btn"
              onClick={handleFeedDog}
              disabled={
                feedLoading || 
                selectedDog.activity !== DogActivity.IDLE || 
                !resources?.plk || 
                resources.plk < 2
              }
            >
              Nourrir (2 PLK)
            </button>
            
            <button 
              className="dog-action-btn pet-btn"
              onClick={handlePetDog}
              disabled={
                petLoading || 
                selectedDog.activity !== DogActivity.IDLE
              }
            >
              Caresser
            </button>
            
            <button 
              className="dog-action-btn train-btn"
              onClick={handleTrainDog}
              disabled={
                trainLoading || 
                selectedDog.activity !== DogActivity.IDLE || 
                !resources?.lor || 
                resources.lor < 5
              }
            >
              Entraîner (5 LOR)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogPanel;