import { initialDogs, initialResources, initialShopItems, enemyCats } from '../data/initial';
import { 
  Dog, 
  DogActivity, 
  Resource, 
  ShopItem, 
  CombatEncounter,
  CombatParticipant,
  Quest,
  QuestType,
  Group,
  GroupRole,
  ShopItemType,
  CurrencyType, 
  Rarity
} from '../../client/src/lib/types';

// User interface
interface User {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  level: number;
}

// Memory Database Service
class MemoryDB {
  private users: Map<number, User>;
  private resources: Map<number, Resource>;
  private dogs: Map<number, Dog>;
  private combats: Map<number, CombatEncounter>;
  private quests: Map<number, Quest>;
  private groups: Map<number, Group>;
  private shopItems: Map<number, ShopItem>;
  
  private userIdCounter = 1;
  private dogIdCounter = 1;
  private combatIdCounter = 1;
  private questIdCounter = 1;
  private groupIdCounter = 1;
  private shopItemIdCounter = 1;
  
  constructor() {
    this.users = new Map();
    this.resources = new Map();
    this.dogs = new Map();
    this.combats = new Map();
    this.quests = new Map();
    this.groups = new Map();
    this.shopItems = new Map();
    
    // Initialize shop items
    this.initializeShopItems();
  }
  
  // Initialize shop with default items
  private initializeShopItems() {
    initialShopItems.forEach(item => {
      const id = this.shopItemIdCounter++;
      this.shopItems.set(id, {
        ...item,
        id
      });
    });
  }
  
  // USER METHODS
  
  // Create a new user
  createUser(username: string, email: string, passwordHash: string): User {
    const id = this.userIdCounter++;
    const user: User = {
      id,
      username,
      email,
      passwordHash,
      level: 1
    };
    
    this.users.set(id, user);
    
    // Initialize resources for new user
    this.resources.set(id, {
      plk: initialResources.plk,
      lor: initialResources.lor,
      gems: initialResources.gems
    });
    
    // Create initial dogs for new user
    for (const dog of initialDogs) {
      this.createDogForUser(
        id, 
        dog.name, 
        dog.isAdult, 
        undefined, 
        undefined, 
        {
          level: dog.level,
          experience: dog.experience,
          stats: { ...dog.stats }
        }
      );
    }
    
    return user;
  }
  
  // Get user by ID
  getUserById(id: number): User | undefined {
    return this.users.get(id);
  }
  
  // Get user by username
  getUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }
  
  // Update user level
  updateUserLevel(userId: number, level: number): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    
    user.level = level;
    this.users.set(userId, user);
    return true;
  }
  
  // RESOURCE METHODS
  
  // Get resources for a user
  getResources(userId: number): Resource | undefined {
    return this.resources.get(userId);
  }
  
  // Update resources for a user
  updateResources(userId: number, plk: number, lor: number, gems: number): Resource | undefined {
    const resources = this.resources.get(userId);
    if (!resources) return undefined;
    
    const updated: Resource = {
      plk: Math.max(0, resources.plk + plk),
      lor: Math.max(0, resources.lor + lor),
      gems: Math.max(0, resources.gems + gems)
    };
    
    this.resources.set(userId, updated);
    return updated;
  }
  
  // DOG METHODS
  
  // Create a dog for a user
  createDogForUser(
    userId: number, 
    name: string, 
    isAdult = false, 
    parent1Id?: number, 
    parent2Id?: number,
    customData?: {
      level?: number;
      experience?: number;
      stats?: {
        strength: number;
        agility: number;
        defense: number;
        happiness: number;
        loyalty: number;
        energy: number;
      }
    }
  ): Dog {
    const id = this.dogIdCounter++;
    
    // Start with default stats for an initial dog
    let baseStats = {
      strength: 10,
      agility: 8,
      defense: 7,
      happiness: 50,
      loyalty: 60,
      energy: 100
    };
    
    // If this is a bred dog, enhance stats based on parents
    if (parent1Id && parent2Id) {
      const parent1 = this.getDogById(parent1Id);
      const parent2 = this.getDogById(parent2Id);
      
      if (parent1 && parent2) {
        // Calculate average of parents' stats with a small bonus
        baseStats = {
          strength: Math.floor((parent1.stats.strength + parent2.stats.strength) / 2 * 1.1),
          agility: Math.floor((parent1.stats.agility + parent2.stats.agility) / 2 * 1.1),
          defense: Math.floor((parent1.stats.defense + parent2.stats.defense) / 2 * 1.1),
          happiness: 60, // Start with a bit higher happiness
          loyalty: 70,   // Start with a bit higher loyalty
          energy: 100    // Start with full energy
        };
      }
    }
    
    // Create the dog object
    const dog: Dog = {
      id,
      name,
      level: customData?.level || 1,
      experience: customData?.experience || 0,
      isAdult,
      stats: customData?.stats || baseStats,
      activity: DogActivity.IDLE,
      parent1Id,
      parent2Id
    };
    
    this.dogs.set(id, dog);
    return dog;
  }
  
  // Get all dogs for a user
  getDogsForUser(userId: number): Dog[] {
    const result: Dog[] = [];
    
    for (const dog of this.dogs.values()) {
      // In a real DB, we would have a userId field on dogs
      // For simplicity, we'll just return all dogs for now
      result.push(dog);
    }
    
    return result;
  }
  
  // Get a specific dog by ID
  getDogById(id: number): Dog | undefined {
    return this.dogs.get(id);
  }
  
  // Update a dog
  updateDog(dog: Dog): boolean {
    if (!this.dogs.has(dog.id)) return false;
    
    this.dogs.set(dog.id, dog);
    return true;
  }
  
  // Feed a dog
  feedDog(dogId: number, plkAmount = 2): Dog | undefined {
    const dog = this.dogs.get(dogId);
    if (!dog) return undefined;
    
    // Update dog stats
    const updatedDog: Dog = {
      ...dog,
      stats: {
        ...dog.stats,
        happiness: Math.min(100, dog.stats.happiness + 10),
        energy: Math.min(100, dog.stats.energy + 15)
      },
      activity: DogActivity.FEEDING
    };
    
    this.dogs.set(dogId, updatedDog);
    
    // After a short delay, set the dog back to idle
    setTimeout(() => {
      const currentDog = this.dogs.get(dogId);
      if (currentDog && currentDog.activity === DogActivity.FEEDING) {
        this.dogs.set(dogId, {
          ...currentDog,
          activity: DogActivity.IDLE
        });
      }
    }, 5000); // 5 seconds feeding activity
    
    return updatedDog;
  }
  
  // Pet a dog
  petDog(dogId: number): Dog | undefined {
    const dog = this.dogs.get(dogId);
    if (!dog) return undefined;
    
    // Update dog stats
    const updatedDog: Dog = {
      ...dog,
      stats: {
        ...dog.stats,
        happiness: Math.min(100, dog.stats.happiness + 15),
        loyalty: Math.min(100, dog.stats.loyalty + 5)
      },
      activity: DogActivity.PETTING
    };
    
    this.dogs.set(dogId, updatedDog);
    
    // After a short delay, set the dog back to idle
    setTimeout(() => {
      const currentDog = this.dogs.get(dogId);
      if (currentDog && currentDog.activity === DogActivity.PETTING) {
        this.dogs.set(dogId, {
          ...currentDog,
          activity: DogActivity.IDLE
        });
      }
    }, 3000); // 3 seconds petting activity
    
    return updatedDog;
  }
  
  // Train a dog
  trainDog(dogId: number, stat?: string, lorAmount = 5): Dog | undefined {
    const dog = this.dogs.get(dogId);
    if (!dog) return undefined;
    
    // Determine which stat to improve (random if not specified)
    let statToImprove = stat || ["strength", "agility", "defense"][Math.floor(Math.random() * 3)];
    
    // Create updated stats object
    const updatedStats = { ...dog.stats };
    
    // Apply training improvements
    switch (statToImprove) {
      case "strength":
        updatedStats.strength = Math.min(100, updatedStats.strength + 3);
        break;
      case "agility":
        updatedStats.agility = Math.min(100, updatedStats.agility + 3);
        break;
      case "defense":
        updatedStats.defense = Math.min(100, updatedStats.defense + 3);
        break;
    }
    
    // Training uses energy
    updatedStats.energy = Math.max(0, updatedStats.energy - 20);
    
    // Update dog
    const updatedDog: Dog = {
      ...dog,
      stats: updatedStats,
      experience: Math.min(100, dog.experience + 15), // Training gives XP
      activity: DogActivity.TRAINING
    };
    
    this.dogs.set(dogId, updatedDog);
    
    // Check if the dog should level up
    if (updatedDog.experience >= 100) {
      this.levelUpDog(dogId);
    }
    
    // After a short delay, set the dog back to idle
    setTimeout(() => {
      const currentDog = this.dogs.get(dogId);
      if (currentDog && currentDog.activity === DogActivity.TRAINING) {
        this.dogs.set(dogId, {
          ...currentDog,
          activity: DogActivity.IDLE
        });
      }
    }, 10000); // 10 seconds training activity
    
    return updatedDog;
  }
  
  // Level up a dog
  levelUpDog(dogId: number): Dog | undefined {
    const dog = this.dogs.get(dogId);
    if (!dog) return undefined;
    
    const newLevel = dog.level + 1;
    const isNowAdult = !dog.isAdult && newLevel >= 5;
    
    // Calculate stat improvements based on level
    const statImprovement = Math.max(1, Math.floor(newLevel / 5) + 1);
    
    // Apply extra boost if becoming an adult
    const adultBoost = isNowAdult ? 5 : 0;
    
    const updatedDog: Dog = {
      ...dog,
      level: newLevel,
      experience: 0, // Reset XP
      isAdult: dog.isAdult || isNowAdult,
      stats: {
        ...dog.stats,
        strength: Math.min(100, dog.stats.strength + statImprovement + adultBoost),
        agility: Math.min(100, dog.stats.agility + statImprovement + adultBoost),
        defense: Math.min(100, dog.stats.defense + statImprovement + adultBoost)
      }
    };
    
    this.dogs.set(dogId, updatedDog);
    return updatedDog;
  }
  
  // COMBAT METHODS
  
  // Get active combat for a user
  getActiveCombatForUser(userId: number): CombatEncounter | undefined {
    for (const combat of this.combats.values()) {
      // In a real DB, we would filter by userId
      if (combat.status === 'ongoing') {
        return combat;
      }
    }
    return undefined;
  }
  
  // Get combat by ID
  getCombatById(id: number): CombatEncounter | undefined {
    return this.combats.get(id);
  }
  
  // Start a new combat encounter
  startCombat(userId: number, dogIds: number[], difficulty = 1): CombatEncounter {
    const id = this.combatIdCounter++;
    
    // Create player participants from dogs
    const playerParticipants: CombatParticipant[] = [];
    let position = 0;
    
    for (const dogId of dogIds) {
      const dog = this.getDogById(dogId);
      if (dog) {
        // Set dog to combat activity
        this.dogs.set(dogId, {
          ...dog,
          activity: DogActivity.COMBATING
        });
        
        // Create combat participant from dog
        playerParticipants.push({
          id: position,
          name: dog.name,
          isEnemy: false,
          currentHp: 50 + (dog.level * 5),
          maxHp: 50 + (dog.level * 5),
          strength: dog.stats.strength,
          agility: dog.stats.agility,
          defense: dog.stats.defense,
          position: position++,
          defeated: false,
          dogId
        });
      }
    }
    
    // If no valid dogs were provided, use a default dog
    if (playerParticipants.length === 0) {
      const defaultDog = this.getDogsForUser(userId)[0];
      if (defaultDog) {
        // Set dog to combat activity
        this.dogs.set(defaultDog.id, {
          ...defaultDog,
          activity: DogActivity.COMBATING
        });
        
        playerParticipants.push({
          id: position,
          name: defaultDog.name,
          isEnemy: false,
          currentHp: 50 + (defaultDog.level * 5),
          maxHp: 50 + (defaultDog.level * 5),
          strength: defaultDog.stats.strength,
          agility: defaultDog.stats.agility,
          defense: defaultDog.stats.defense,
          position: position++,
          defeated: false,
          dogId: defaultDog.id
        });
      }
    }
    
    // Create enemy participants based on difficulty
    const enemyParticipants: CombatParticipant[] = [];
    const enemyCount = Math.min(3, difficulty + 1);
    
    for (let i = 0; i < enemyCount; i++) {
      // Select enemy template based on difficulty
      const enemyIndex = Math.min(enemyCats.length - 1, Math.floor(difficulty / 2));
      const enemyTemplate = enemyCats[enemyIndex];
      
      enemyParticipants.push({
        id: position,
        name: `${enemyTemplate.name} ${i + 1}`,
        isEnemy: true,
        currentHp: enemyTemplate.maxHp,
        maxHp: enemyTemplate.maxHp,
        strength: enemyTemplate.strength,
        agility: enemyTemplate.agility,
        defense: enemyTemplate.defense,
        position: position++,
        defeated: false
      });
    }
    
    // Calculate rewards based on difficulty
    const baseReward = 10 * difficulty;
    
    const combat: CombatEncounter = {
      id,
      status: 'ongoing',
      difficulty,
      rewards: {
        plk: baseReward + Math.floor(Math.random() * 10),
        lor: baseReward + Math.floor(Math.random() * 15),
        gems: Math.max(1, Math.floor(difficulty / 3)),
        exp: baseReward * 2
      },
      currentTurn: 1,
      participants: [...playerParticipants, ...enemyParticipants],
      activeParticipantIndex: 0 // Player goes first
    };
    
    this.combats.set(id, combat);
    return combat;
  }
  
  // Update a combat encounter
  updateCombat(combat: CombatEncounter): boolean {
    if (!this.combats.has(combat.id)) return false;
    
    this.combats.set(combat.id, combat);
    return true;
  }
  
  // Clean up after combat (for when it ends)
  cleanupCombat(combatId: number): boolean {
    const combat = this.combats.get(combatId);
    if (!combat) return false;
    
    // Reset all dogs to idle state
    for (const participant of combat.participants) {
      if (!participant.isEnemy && participant.dogId) {
        const dog = this.dogs.get(participant.dogId);
        if (dog && dog.activity === DogActivity.COMBATING) {
          this.dogs.set(participant.dogId, {
            ...dog,
            activity: DogActivity.IDLE
          });
        }
      }
    }
    
    // Remove the combat from memory if it's complete
    if (combat.status !== 'ongoing') {
      this.combats.delete(combatId);
    }
    
    return true;
  }
  
  // SHOP METHODS
  
  // Get all shop items
  getShopItems(): ShopItem[] {
    return Array.from(this.shopItems.values());
  }
  
  // Get a shop item by ID
  getShopItemById(id: number): ShopItem | undefined {
    return this.shopItems.get(id);
  }
  
  // Process a purchase
  processPurchase(
    userId: number, 
    itemId: number
  ): { success: boolean; message: string; item?: ShopItem; updatedResources?: Resource } {
    const user = this.users.get(userId);
    const item = this.shopItems.get(itemId);
    const resources = this.resources.get(userId);
    
    if (!user || !item || !resources) {
      return { success: false, message: "Utilisateur, article ou ressources introuvables." };
    }
    
    if (!item.available) {
      return { success: false, message: "Cet article n'est pas disponible à l'achat." };
    }
    
    // Check if user has enough currency
    let hasEnough = false;
    
    switch (item.currencyType) {
      case CurrencyType.PLK:
        hasEnough = resources.plk >= item.price;
        break;
      case CurrencyType.LOR:
        hasEnough = resources.lor >= item.price;
        break;
      case CurrencyType.GEMS:
        hasEnough = resources.gems >= item.price;
        break;
    }
    
    if (!hasEnough) {
      return { success: false, message: "Ressources insuffisantes pour acheter cet article." };
    }
    
    // Process the purchase based on item type
    switch (item.itemType) {
      case ShopItemType.DOG:
        // Create a new dog
        const newDog = this.createDogForUser(userId, `Chien ${item.name}`);
        
        // Deduct the cost
        let updatedResources: Resource = resources;
        switch (item.currencyType) {
          case CurrencyType.PLK:
            updatedResources = this.updateResources(userId, -item.price, 0, 0)!;
            break;
          case CurrencyType.LOR:
            updatedResources = this.updateResources(userId, 0, -item.price, 0)!;
            break;
          case CurrencyType.GEMS:
            updatedResources = this.updateResources(userId, 0, 0, -item.price)!;
            break;
        }
        
        return { 
          success: true, 
          message: `Vous avez acheté ${item.name} avec succès!`, 
          item, 
          updatedResources 
        };
        
      case ShopItemType.BOOSTER:
        // Apply booster effects to all dogs
        const userDogs = this.getDogsForUser(userId);
        
        for (const dog of userDogs) {
          if (item.boost) {
            const updatedStats = { ...dog.stats };
            
            // Apply boosts
            for (const [stat, value] of Object.entries(item.boost)) {
              if (stat in updatedStats) {
                updatedStats[stat as keyof typeof updatedStats] = 
                  Math.min(100, updatedStats[stat as keyof typeof updatedStats] + value);
              }
            }
            
            // Update the dog
            this.dogs.set(dog.id, {
              ...dog,
              stats: updatedStats
            });
          }
        }
        
        // Deduct the cost
        let updatedBoosterResources: Resource = resources;
        switch (item.currencyType) {
          case CurrencyType.PLK:
            updatedBoosterResources = this.updateResources(userId, -item.price, 0, 0)!;
            break;
          case CurrencyType.LOR:
            updatedBoosterResources = this.updateResources(userId, 0, -item.price, 0)!;
            break;
          case CurrencyType.GEMS:
            updatedBoosterResources = this.updateResources(userId, 0, 0, -item.price)!;
            break;
        }
        
        return { 
          success: true, 
          message: `Vous avez acheté ${item.name} avec succès! Les effets ont été appliqués à tous vos chiens.`, 
          item, 
          updatedResources: updatedBoosterResources 
        };
        
      case ShopItemType.CURRENCY:
        // Add currency to user
        let plkAdd = 0;
        let lorAdd = 0;
        let gemsAdd = 0;
        
        // Simple currency bundles
        if (item.name.includes("PLK")) {
          plkAdd = 50;
        } else if (item.name.includes("LOR")) {
          lorAdd = 100;
        }
        
        // Deduct the cost and add the purchased currency
        let updatedCurrencyResources: Resource = resources;
        switch (item.currencyType) {
          case CurrencyType.PLK:
            updatedCurrencyResources = this.updateResources(userId, -item.price + plkAdd, lorAdd, gemsAdd)!;
            break;
          case CurrencyType.LOR:
            updatedCurrencyResources = this.updateResources(userId, plkAdd, -item.price + lorAdd, gemsAdd)!;
            break;
          case CurrencyType.GEMS:
            updatedCurrencyResources = this.updateResources(userId, plkAdd, lorAdd, -item.price + gemsAdd)!;
            break;
        }
        
        return { 
          success: true, 
          message: `Vous avez acheté ${item.name} avec succès!`, 
          item, 
          updatedResources: updatedCurrencyResources 
        };
        
      default:
        return { success: false, message: "Type d'article non pris en charge." };
    }
  }
}

// Export singleton instance
export const memoryDB = new MemoryDB();