import { useState, useEffect } from "react";
import { useDogs } from "@/lib/stores/useDogs";
import { useResources } from "@/lib/stores/useResources";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const BreedingPanel = () => {
  const { dogs, breedingDogs, selectBreedingDog, breedDogs } = useDogs();
  const { plk } = useResources();
  const [puppyName, setPuppyName] = useState("Puppy");
  
  // Filter for adult dogs only
  const adultDogs = dogs.filter(dog => dog.isAdult);
  
  // Get selected dogs
  const selectedDog1 = dogs.find(dog => dog.id === breedingDogs[0]);
  const selectedDog2 = dogs.find(dog => dog.id === breedingDogs[1]);
  
  // Check if breeding is possible
  const canBreed = !!selectedDog1 && !!selectedDog2 && selectedDog1.id !== selectedDog2.id && plk >= 5;
  
  // Check for breeding cooldowns
  const now = new Date();
  const dog1OnCooldown = selectedDog1?.breedingCooldown && new Date(selectedDog1.breedingCooldown) > now;
  const dog2OnCooldown = selectedDog2?.breedingCooldown && new Date(selectedDog2.breedingCooldown) > now;
  
  const handleBreed = () => {
    if (!canBreed) return;
    
    if (dog1OnCooldown || dog2OnCooldown) {
      toast.error("One or both dogs are still on breeding cooldown!");
      return;
    }
    
    if (puppyName.trim() === "") {
      setPuppyName("Puppy");
    }
    
    breedDogs();
  };
  
  const handleDogSelection = (dogId: number, slot: 0 | 1) => {
    // If the dog is already selected in the other slot, clear the other slot
    if ((slot === 0 && dogId === breedingDogs[1]) || 
        (slot === 1 && dogId === breedingDogs[0])) {
      selectBreedingDog(slot === 0 ? 1 : 0, null);
    }
    
    // Select or deselect the dog
    if (breedingDogs[slot] === dogId) {
      selectBreedingDog(slot, null);
    } else {
      selectBreedingDog(slot, dogId);
    }
  };
  
  if (adultDogs.length < 2) {
    return (
      <Card className="w-full">
        <CardContent className="py-6 text-center">
          <i className="fas fa-heart-broken text-4xl text-muted-foreground mb-3"></i>
          <h3 className="mb-2">Not Enough Adult Dogs</h3>
          <p className="text-sm text-muted-foreground">
            You need at least 2 adult dogs (Level 5+) to breed. Keep raising your puppies!
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="breeding-panel">
      <Card className="w-full mb-4">
        <CardHeader>
          <CardTitle>Dog Breeding</CardTitle>
          <CardDescription>
            Select two adult dogs to breed. Breeding costs 5 PLK and creates a new puppy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="breeding-container">
            <div className="breeding-parents grid grid-cols-2 gap-4">
              <div className="parent-slot">
                <h4 className="text-center mb-2">Parent 1</h4>
                {selectedDog1 ? (
                  <Card className={`selected-parent ${dog1OnCooldown ? 'on-cooldown' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{selectedDog1.name}</div>
                          <div className="text-xs text-muted-foreground">Level {selectedDog1.level}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => selectBreedingDog(0, null)}>
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                      {dog1OnCooldown && (
                        <div className="text-xs text-red-500 mt-2">
                          <i className="fas fa-clock mr-1"></i> On cooldown
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="empty-parent-slot">
                    <i className="fas fa-plus"></i>
                    <div>Select Dog</div>
                  </div>
                )}
              </div>
              
              <div className="parent-slot">
                <h4 className="text-center mb-2">Parent 2</h4>
                {selectedDog2 ? (
                  <Card className={`selected-parent ${dog2OnCooldown ? 'on-cooldown' : ''}`}>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{selectedDog2.name}</div>
                          <div className="text-xs text-muted-foreground">Level {selectedDog2.level}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => selectBreedingDog(1, null)}>
                          <i className="fas fa-times"></i>
                        </Button>
                      </div>
                      {dog2OnCooldown && (
                        <div className="text-xs text-red-500 mt-2">
                          <i className="fas fa-clock mr-1"></i> On cooldown
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="empty-parent-slot">
                    <i className="fas fa-plus"></i>
                    <div>Select Dog</div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 mb-4 text-center">
              <div className="breeding-heart">
                <i className="fas fa-heart text-3xl text-pink-500"></i>
              </div>
            </div>
            
            <div className="breeding-puppy">
              <h4 className="text-center mb-2">New Puppy</h4>
              <div className="puppy-name-container">
                <Input
                  type="text"
                  placeholder="Puppy name"
                  value={puppyName}
                  onChange={(e) => setPuppyName(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>
            
            <div className="breeding-cost mt-4 text-center">
              <p className="text-sm">
                Breeding Cost: <span className="font-bold">5 PLK</span>
                {plk < 5 && <span className="text-red-500 ml-2">(Not enough PLK)</span>}
              </p>
            </div>
            
            <div className="mt-4 text-center">
              <Button 
                onClick={handleBreed} 
                disabled={!canBreed || dog1OnCooldown || dog2OnCooldown}
                className="w-40"
              >
                <i className="fas fa-baby mr-2"></i> Breed Dogs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="mb-2">Available Adult Dogs</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {adultDogs.map((dog) => {
          const isSelected = breedingDogs.includes(dog.id);
          const isOnCooldown = dog.breedingCooldown && new Date(dog.breedingCooldown) > now;
          
          return (
            <Card 
              key={dog.id}
              className={`breeding-dog-card cursor-pointer ${isSelected ? 'selected' : ''} ${isOnCooldown ? 'on-cooldown' : ''}`}
              onClick={() => !isOnCooldown && handleDogSelection(dog.id, isSelected ? (breedingDogs[0] === dog.id ? 0 : 1) : (breedingDogs[0] === null ? 0 : 1))}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{dog.name}</div>
                    <div className="text-xs text-muted-foreground">Level {dog.level}</div>
                  </div>
                  <div className="stats text-xs">
                    STR: {dog.stats.strength} | AGI: {dog.stats.agility} | DEF: {dog.stats.defense}
                  </div>
                </div>
                {isOnCooldown && (
                  <div className="text-xs text-red-500 mt-2">
                    <i className="fas fa-clock mr-1"></i> On breeding cooldown
                  </div>
                )}
                {isSelected && (
                  <div className="selected-indicator">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <i className="fas fa-info-circle mr-2"></i>
        Dogs need a 24-hour cooldown between breeding. Puppies inherit traits from both parents.
      </div>
    </div>
  );
};

export default BreedingPanel;
