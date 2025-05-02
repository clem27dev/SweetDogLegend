import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// USER SCHEMA
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  plk: integer("plk").notNull().default(50),
  lor: integer("lor").notNull().default(100),
  gems: integer("gems").notNull().default(5),
  lastResourceUpdate: timestamp("last_resource_update").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  email: z.string().email(),
}).omit({ 
  id: true, 
  level: true, 
  experience: true, 
  plk: true, 
  lor: true, 
  gems: true,
  lastResourceUpdate: true,
  createdAt: true
});

// DOG SCHEMA
export const dogs = pgTable("dogs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  strength: integer("strength").notNull().default(5),
  agility: integer("agility").notNull().default(5),
  defense: integer("defense").notNull().default(5),
  happiness: integer("happiness").notNull().default(50),
  loyalty: integer("loyalty").notNull().default(50),
  energy: integer("energy").notNull().default(100),
  isAdult: boolean("is_adult").notNull().default(false),
  parent1Id: integer("parent1_id").references(() => dogs.id),
  parent2Id: integer("parent2_id").references(() => dogs.id),
  breedingCooldown: timestamp("breeding_cooldown"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDogSchema = createInsertSchema(dogs).omit({ 
  id: true, 
  createdAt: true 
});

// COMBAT SCHEMA
export const combatEncounters = pgTable("combat_encounters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("ongoing"), // ongoing, victory, defeat
  difficulty: integer("difficulty").notNull().default(1),
  plkReward: integer("plk_reward").notNull(),
  lorReward: integer("lor_reward").notNull(),
  gemsReward: integer("gems_reward").notNull(),
  expReward: integer("exp_reward").notNull(),
  currentTurn: integer("current_turn").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const combatParticipants = pgTable("combat_participants", {
  id: serial("id").primaryKey(),
  encounterId: integer("encounter_id").notNull().references(() => combatEncounters.id, { onDelete: "cascade" }),
  dogId: integer("dog_id").references(() => dogs.id),
  isEnemy: boolean("is_enemy").notNull().default(false),
  name: text("name").notNull(),
  currentHp: integer("current_hp").notNull(),
  maxHp: integer("max_hp").notNull(),
  strength: integer("strength").notNull(),
  agility: integer("agility").notNull(),
  defense: integer("defense").notNull(),
  position: integer("position").notNull(),
  defeated: boolean("defeated").notNull().default(false),
});

// QUEST SCHEMA
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // feed, pet, combat, etc
  target: integer("target").notNull(),
  progress: integer("progress").notNull().default(0),
  plkReward: integer("plk_reward").notNull(),
  lorReward: integer("lor_reward").notNull(),
  gemsReward: integer("gems_reward").notNull(),
  expReward: integer("exp_reward").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// GROUP SCHEMA
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  memberCount: integer("member_count").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, admin, recruiter, member
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey(t.userId, t.groupId),
}));

export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const groupInvites = pgTable("group_invites", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  invitedById: integer("invited_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// SHOP SCHEMA
export const shop = pgTable("shop", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull(), // dog, booster, currency
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  currencyType: text("currency_type").notNull(), // plk, lor, gems
  rarity: text("rarity"), // common, rare, legendary (for dogs)
  boost: json("boost"), // stats boost for boosters
  available: boolean("available").notNull().default(true),
});

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => shop.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: integer("total_price").notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

// EXPORT TYPES
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Dog = typeof dogs.$inferSelect;
export type InsertDog = z.infer<typeof insertDogSchema>;

export type CombatEncounter = typeof combatEncounters.$inferSelect;
export type CombatParticipant = typeof combatParticipants.$inferSelect;

export type Quest = typeof quests.$inferSelect;

export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type GroupMessage = typeof groupMessages.$inferSelect;
export type GroupInvite = typeof groupInvites.$inferSelect;

export type ShopItem = typeof shop.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
