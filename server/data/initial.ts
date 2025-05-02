import { Dog, DogActivity, ShopItem, ShopItemType, CurrencyType, Rarity } from "../../client/src/lib/types";

// Initial dogs for new players
export const initialDogs: Omit<Dog, "id">[] = [
  {
    name: "Luc",
    level: 2,
    experience: 20,
    isAdult: false,
    stats: {
      strength: 12,
      agility: 9,
      defense: 8,
      happiness: 60,
      loyalty: 70,
      energy: 100
    },
    activity: DogActivity.IDLE
  },
  {
    name: "Lynda",
    level: 2,
    experience: 25,
    isAdult: false,
    stats: {
      strength: 8,
      agility: 14,
      defense: 7,
      happiness: 65,
      loyalty: 75,
      energy: 100
    },
    activity: DogActivity.IDLE
  }
];

// Starting resources for new players
export const initialResources = {
  plk: 50,    // Starting PLK (food resource)
  lor: 100,   // Starting LOR (building resource)
  gems: 5     // Starting Gemmes (premium resource)
};

// Initial shop items
export const initialShopItems: Omit<ShopItem, "id">[] = [
  {
    itemType: ShopItemType.DOG,
    name: "Chiot Basique",
    description: "Un jeune chiot plein d'énergie et de loyauté qui deviendra un excellent protecteur pour la Princesse Ayana.",
    price: 30,
    currencyType: CurrencyType.PLK,
    rarity: Rarity.COMMON,
    available: true
  },
  {
    itemType: ShopItemType.DOG,
    name: "Berger Allemand",
    description: "Un chien intelligent et courageux, excellent pour les combats et la protection.",
    price: 75,
    currencyType: CurrencyType.LOR,
    rarity: Rarity.RARE,
    available: true
  },
  {
    itemType: ShopItemType.DOG,
    name: "Husky Royal",
    description: "Une race noble et puissante, avec une force et une agilité exceptionnelles.",
    price: 20,
    currencyType: CurrencyType.GEMS,
    rarity: Rarity.LEGENDARY,
    available: true
  },
  {
    itemType: ShopItemType.BOOSTER,
    name: "Nourriture Premium",
    description: "Améliore la santé et le bonheur de vos chiens pendant 24 heures.",
    price: 25,
    currencyType: CurrencyType.PLK,
    boost: {
      happiness: 15,
      energy: 20
    },
    available: true
  },
  {
    itemType: ShopItemType.BOOSTER,
    name: "Kit d'Entraînement",
    description: "Augmente temporairement les gains d'expérience et l'efficacité de l'entraînement.",
    price: 50,
    currencyType: CurrencyType.LOR,
    boost: {
      strength: 10,
      agility: 10,
      defense: 10
    },
    available: true
  },
  {
    itemType: ShopItemType.BOOSTER,
    name: "Amulette Royale",
    description: "Un artefact magique qui confère des capacités spéciales à votre chien.",
    price: 15,
    currencyType: CurrencyType.GEMS,
    rarity: Rarity.LEGENDARY,
    boost: {
      strength: 25,
      agility: 25,
      defense: 25,
      loyalty: 50
    },
    available: true
  },
  {
    itemType: ShopItemType.CURRENCY,
    name: "Petit Sac de PLK",
    description: "Un sac contenant 50 PLK pour nourrir et élever vos chiens.",
    price: 5,
    currencyType: CurrencyType.GEMS,
    available: true
  },
  {
    itemType: ShopItemType.CURRENCY,
    name: "Caisse de LOR",
    description: "Une caisse contenant 100 LOR pour construire et améliorer vos installations.",
    price: 10,
    currencyType: CurrencyType.GEMS,
    available: true
  }
];

// Enemy cat templates for combat
export const enemyCats = [
  {
    name: "Chat Errant",
    level: 1,
    strength: 8,
    agility: 12,
    defense: 5,
    maxHp: 30,
    isEvil: true
  },
  {
    name: "Chat Viking",
    level: 3,
    strength: 15,
    agility: 10,
    defense: 12,
    maxHp: 45,
    isEvil: true
  },
  {
    name: "Rico le Maléfique",
    level: 10,
    strength: 25,
    agility: 20,
    defense: 18,
    maxHp: 100,
    isEvil: true
  }
];