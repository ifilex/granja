export type ItemCategory = 'crop' | 'animal_product' | 'feed' | 'artisan' | 'material';

export interface GameItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  basePrice: number;
  maxPrice: number;
  minPrice: number;
  unlockLevel: number;
  icon: string; // emoji or icon name
  color: string;
  growthTimeSeconds?: number;
  xpReward?: number;
}

export interface CropPlot {
  id: number;
  cropId: string | null;
  plantedAt: number | null; // timestamp ms
  readyAt: number | null;   // timestamp ms
  isWatered?: boolean;
}

export interface AnimalPen {
  id: string;
  type: 'chicken' | 'cow' | 'pig' | 'sheep';
  name: string;
  capacity: number;
  count: number;
  fedCount: number;
  fedAt: number | null;
  readyAt: number | null;
  feedItemId: string;
  productItemId: string;
  productionTimeSeconds: number;
  productYield: number;
  levelRequired: number;
  cost: number;
}

export interface ProductionQueueSlot {
  itemId: string;
  startedAt: number;
  durationSeconds: number;
  finished: boolean;
}

export interface ProductionBuilding {
  id: string;
  name: string;
  type: 'bakery' | 'dairy' | 'feed_mill' | 'sugar_mill' | 'textile';
  levelRequired: number;
  slotsCount: number;
  maxSlots: number;
  queue: ProductionQueueSlot[];
  unlockedRecipes: string[];
}

export interface Recipe {
  id: string;
  buildingType: ProductionBuilding['type'];
  name: string;
  outputItemId: string;
  outputCount: number;
  ingredients: { itemId: string; count: number }[];
  durationSeconds: number;
  xpReward: number;
  levelRequired: number;
}

export interface TruckOrder {
  id: string;
  clientName: string;
  clientAvatar: string;
  requirements: { itemId: string; count: number }[];
  rewardCoins: number;
  rewardXp: number;
  specialRewardToolId?: string;
  completed?: boolean;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerLevel: number;
  itemId: string;
  quantity: number;
  price: number;
  hasAd: boolean;
  createdAt: number;
  isSold: boolean;
}

export interface RoadsideSlot {
  id: number;
  itemId: string | null;
  quantity: number;
  price: number;
  hasAd: boolean;
  isSold: boolean;
  collected: boolean;
}

export interface ClanMember {
  id: string;
  name: string;
  avatar: string;
  level: number;
  role: 'leader' | 'elder' | 'member';
  donationsMonth: number;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isClan: boolean;
  timestamp: number;
  text: string;
  request?: {
    itemId: string;
    countRequested: number;
    countFulfilled: number;
    status: 'open' | 'fulfilled';
  };
}

export interface Clan {
  id: string;
  name: string;
  badgeIcon: string;
  badgeColor: string;
  description: string;
  minLevel: number;
  members: ClanMember[];
  trophies: number;
  isOpen: boolean;
}

export interface LeaderboardPlayer {
  id: string;
  rank: number;
  name: string;
  avatar: string;
  level: number;
  clanName?: string;
  farmValue: number;
  monthlyScore: number;
  badge: 'gold' | 'silver' | 'bronze' | 'top10' | 'player';
  wiltedTreesCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  currentValue: number;
  targetValue: number;
  rewardDiamonds: number;
  rewardXp: number;
  claimed: boolean;
}

export interface OtherFarm {
  id: string;
  ownerName: string;
  ownerAvatar: string;
  level: number;
  farmName: string;
  wiltedTrees: { id: number; fruitType: string; isRevived: boolean }[];
  marketItems: MarketListing[];
}

export type BotType = 'rusty' | 'water_bot' | 'harvest_bot' | 'biofuel_bot' | 'feeder_bot';

export interface FarmBot {
  id: string;
  name: string;
  type: BotType;
  level: number;
  unlocked: boolean;
  avatar: string;
  color: string;
  description: string;
  speed: number;
  battery: number; // 0 - 100
  efficiency: number;
  gx: number;
  gy: number;
  status: 'idle' | 'walking' | 'working';
  currentTask: string;
  targetPlotId?: number | null;
}

export interface FarmState {
  version: number;
  farmName: string;
  playerName: string;
  playerAvatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  coins: number;
  diamonds: number;
  siloCapacity: number;
  siloUsed: number;
  barnCapacity: number;
  barnUsed: number;
  inventory: Record<string, number>;
  plots: CropPlot[];
  animalPens: AnimalPen[];
  buildings: ProductionBuilding[];
  truckOrders: TruckOrder[];
  roadsideSlots: RoadsideSlot[];
  clanId: string | null;
  dailyRewardStreak: number;
  lastDailyRewardClaim: number;
  lastSpinTimestamp: number;
  stats: {
    cropsHarvested: number;
    ordersCompleted: number;
    marketSales: number;
    treesRevived: number;
    totalCoinsEarned: number;
  };
  achievements: Achievement[];
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  retroPalette?: boolean;
  crtFilter?: boolean;
  gameSpeed?: number;
  lastSavedAt: number;

  // Rusty's Retirement Mechanics (Stardew / Rusty Cozy Farming)
  biofuel: number;
  maxBiofuel: number;
  spareParts: number; // Repuestos mecánicos para robots
  bots: FarmBot[];
  autoWateringEnabled: boolean;
  autoHarvestingEnabled: boolean;
  performanceMode: 'potato' | 'standard' | '3d'; // 'potato' = celulares antiguos (ultra optimizado 60 FPS)
}
