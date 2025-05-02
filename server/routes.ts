import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocketServer } from "./services/websocket";
import { authMiddleware } from "./middleware/auth";

// Import controllers
import * as authController from "./controllers/authController";
import * as dogController from "./controllers/dogController";
import * as combatController from "./controllers/combatController";
import * as questController from "./controllers/questController";
import * as groupController from "./controllers/groupController";
import * as shopController from "./controllers/shopController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for Express and WebSocket
  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time chat
  setupWebSocketServer(httpServer);
  
  // Auth routes
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/verify", authMiddleware, authController.verifyToken);
  
  // Resource routes
  app.get("/api/resources", authMiddleware, authController.getResources);
  app.put("/api/resources", authMiddleware, authController.updateResources);
  app.post("/api/resources/passive", authMiddleware, authController.updatePassiveResources);
  app.post("/api/resources/experience", authMiddleware, authController.addExperience);
  
  // Dog routes
  app.get("/api/dogs", authMiddleware, dogController.getDogs);
  app.get("/api/dogs/:id", authMiddleware, dogController.getDogById);
  app.post("/api/dogs", authMiddleware, dogController.createDog);
  app.post("/api/dogs/:id/feed", authMiddleware, dogController.feedDog);
  app.post("/api/dogs/:id/pet", authMiddleware, dogController.petDog);
  app.post("/api/dogs/:id/train", authMiddleware, dogController.trainDog);
  app.post("/api/dogs/breed", authMiddleware, dogController.breedDogs);
  
  // Combat routes
  app.get("/api/combat/active", authMiddleware, combatController.getActiveCombat);
  app.get("/api/combat/:id", authMiddleware, combatController.getCombatById);
  app.post("/api/combat/start", authMiddleware, combatController.startCombat);
  app.post("/api/combat/:id/action", authMiddleware, combatController.executeAction);
  app.post("/api/combat/:id/enemy-action", authMiddleware, combatController.executeEnemyAction);
  app.post("/api/combat/:id/rewards", authMiddleware, combatController.distributeCombatRewards);
  
  // Quest routes
  app.get("/api/quests", authMiddleware, questController.getQuests);
  app.post("/api/quests/progress", authMiddleware, questController.updateQuestProgress);
  app.post("/api/quests/:id/complete", authMiddleware, questController.completeQuest);
  app.post("/api/quests/generate", authMiddleware, questController.generateNewQuests);
  
  // Group routes
  app.get("/api/groups", authMiddleware, groupController.getUserGroups);
  app.get("/api/groups/:id", authMiddleware, groupController.getGroupById);
  app.post("/api/groups", authMiddleware, groupController.createGroup);
  app.post("/api/groups/:id/join", authMiddleware, groupController.joinGroup);
  app.post("/api/groups/:id/leave", authMiddleware, groupController.leaveGroup);
  app.post("/api/groups/:id/message", authMiddleware, groupController.sendMessage);
  app.post("/api/groups/:id/invite", authMiddleware, groupController.inviteMember);
  app.get("/api/groups/invites", authMiddleware, groupController.getInvites);
  app.post("/api/groups/invites/:groupId/accept", authMiddleware, groupController.acceptInvite);
  app.post("/api/groups/invites/:groupId/reject", authMiddleware, groupController.rejectInvite);
  app.put("/api/groups/:id/member/:userId/role", authMiddleware, groupController.changeRole);
  app.delete("/api/groups/:id/member/:userId", authMiddleware, groupController.kickMember);
  app.delete("/api/groups/:id", authMiddleware, groupController.disbandGroup);
  
  // Shop routes
  app.get("/api/shop", authMiddleware, shopController.getShopItems);
  app.post("/api/shop/purchase", authMiddleware, shopController.purchaseItem);
  
  return httpServer;
}
