// Game-specific types
export interface Resource {
  plk: number;
  lor: number;
  gems: number;
}

export enum DogActivity {
  IDLE = "idle",
  FEEDING = "feeding",
  PETTING = "petting",
  TRAINING = "training",
  BREEDING = "breeding",
  COMBATING = "combating"
}

export interface DogStats {
  strength: number;
  agility: number;
  defense: number;
  happiness: number;
  loyalty: number;
  energy: number;
}

export interface Dog {
  id: number;
  name: string;
  level: number;
  experience: number;
  isAdult: boolean;
  stats: DogStats;
  activity: DogActivity;
  parent1Id?: number;
  parent2Id?: number;
  breedingCooldown?: Date;
}

export enum CombatAction {
  ATTACK = "attack",
  DEFEND = "defend",
  PASS = "pass"
}

export interface CombatParticipant {
  id: number;
  name: string;
  isEnemy: boolean;
  currentHp: number;
  maxHp: number;
  strength: number;
  agility: number;
  defense: number;
  position: number;
  defeated: boolean;
  dogId?: number;
}

export interface CombatEncounter {
  id: number;
  status: "ongoing" | "victory" | "defeat";
  difficulty: number;
  rewards: {
    plk: number;
    lor: number;
    gems: number;
    exp: number;
  };
  currentTurn: number;
  participants: CombatParticipant[];
  activeParticipantIndex: number;
}

export enum QuestType {
  FEED_DOG = "feed_dog",
  PET_DOG = "pet_dog",
  TRAIN_DOG = "train_dog",
  WIN_COMBAT = "win_combat",
  JOIN_GROUP = "join_group",
  SEND_MESSAGE = "send_message"
}

export interface Quest {
  id: number;
  type: QuestType;
  target: number;
  progress: number;
  rewards: {
    plk: number;
    lor: number;
    gems: number;
    exp: number;
  };
  completed: boolean;
}

export enum GroupRole {
  OWNER = "owner",
  ADMIN = "admin",
  RECRUITER = "recruiter",
  MEMBER = "member"
}

export interface GroupMember {
  userId: number;
  username: string;
  role: GroupRole;
  joinedAt: Date;
}

export interface GroupMessage {
  id: number;
  userId: number;
  username: string;
  content: string;
  sentAt: Date;
}

export interface Group {
  id: number;
  name: string;
  ownerId: number;
  description?: string;
  memberCount: number;
  members: GroupMember[];
  messages: GroupMessage[];
}

export enum ShopItemType {
  DOG = "dog",
  BOOSTER = "booster",
  CURRENCY = "currency"
}

export enum CurrencyType {
  PLK = "plk",
  LOR = "lor",
  GEMS = "gems"
}

export enum Rarity {
  COMMON = "common",
  RARE = "rare",
  LEGENDARY = "legendary"
}

export interface ShopItem {
  id: number;
  itemType: ShopItemType;
  name: string;
  description: string;
  price: number;
  currencyType: CurrencyType;
  rarity?: Rarity;
  boost?: Record<string, number>;
  available: boolean;
}
