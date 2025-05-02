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
  
  // Auth routes - not protected
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/verify", authController.verifyToken);
  app.post('/api/auth/logout', (req, res) => res.status(200).json({ success: true }));
  
  // Protected routes - all other routes
  app.use("/api/resources", authMiddleware);
  app.use("/api/dogs", authMiddleware);
  app.use("/api/combat", authMiddleware);
  app.use("/api/quests", authMiddleware);
  app.use("/api/groups", authMiddleware);
  app.use("/api/shop", authMiddleware);
  
  // Resource routes
  app.get("/api/resources", authController.getResources);
  app.put("/api/resources", authController.updateResources);
  app.post("/api/resources/passive", authController.updatePassiveResources);
  app.post("/api/resources/experience", authController.addExperience);
  
  // Dog routes
  app.get("/api/dogs", dogController.getDogs);
  app.get("/api/dogs/:id", dogController.getDogById);
  app.post("/api/dogs", dogController.createDog);
  app.post("/api/dogs/:id/feed", dogController.feedDog);
  app.post("/api/dogs/:id/pet", dogController.petDog);
  app.post("/api/dogs/:id/train", dogController.trainDog);
  app.post("/api/dogs/breed", dogController.breedDogs);
  
  // Combat routes
  app.get("/api/combat/active", combatController.getActiveCombat);
  app.get("/api/combat/:id", combatController.getCombatById);
  app.post("/api/combat/start", combatController.startCombat);
  app.post("/api/combat/:id/action", combatController.executeAction);
  app.post("/api/combat/:id/enemy-action", combatController.executeEnemyAction);
  app.post("/api/combat/:id/rewards", combatController.distributeCombatRewards);
  
  // Quest routes
  app.get("/api/quests", questController.getQuests);
  app.post("/api/quests/progress", questController.updateQuestProgress);
  app.post("/api/quests/:id/complete", questController.completeQuest);
  app.post("/api/quests/generate", questController.generateNewQuests);
  
  // Group routes
  app.get("/api/groups", groupController.getUserGroups);
  app.get("/api/groups/:id", groupController.getGroupById);
  app.post("/api/groups", groupController.createGroup);
  app.post("/api/groups/:id/join", groupController.joinGroup);
  app.post("/api/groups/:id/leave", groupController.leaveGroup);
  app.post("/api/groups/:id/message", groupController.sendMessage);
  app.post("/api/groups/:id/invite", groupController.inviteMember);
  app.get("/api/groups/invites", groupController.getInvites);
  app.post("/api/groups/invites/:groupId/accept", groupController.acceptInvite);
  app.post("/api/groups/invites/:groupId/reject", groupController.rejectInvite);
  app.put("/api/groups/:id/member/:userId/role", groupController.changeRole);
  app.delete("/api/groups/:id/member/:userId", groupController.kickMember);
  app.delete("/api/groups/:id", groupController.disbandGroup);
  
  // Shop routes
  app.get("/api/shop", shopController.getShopItems);
  app.post("/api/shop/purchase", shopController.purchaseItem);
  
  return httpServer;
}