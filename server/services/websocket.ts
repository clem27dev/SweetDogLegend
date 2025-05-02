import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

// JWT secret - in production would be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "sweet-dog-secret-key";

// Group message type
interface GroupMessage {
  id: number;
  userId: number;
  username: string;
  content: string;
  sentAt: Date;
}

// WebSocket client with authentication
interface AuthenticatedClient extends WebSocket {
  userId?: number;
  username?: string;
  isAlive?: boolean;
  groups?: Set<number>;
}

// WebSocket server
let wss: WebSocketServer;

// Map of group ID to set of connected clients
const groupClients: Map<number, Set<AuthenticatedClient>> = new Map();

// Setup WebSocket server
export const setupWebSocketServer = (server: HttpServer) => {
  wss = new WebSocketServer({ server });
  
  wss.on("connection", (ws: AuthenticatedClient) => {
    ws.isAlive = true;
    ws.groups = new Set();
    
    // Handle ping-pong for connection liveness
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    
    // Handle messages
    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === "auth") {
          handleAuthentication(ws, data.token);
        }
        
        // Handle joining group
        if (data.type === "join_group" && ws.userId) {
          handleJoinGroup(ws, data.groupId);
        }
        
        // Handle leaving group
        if (data.type === "leave_group" && ws.userId) {
          handleLeaveGroup(ws, data.groupId);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    // Handle disconnection
    ws.on("close", () => {
      if (ws.groups) {
        for (const groupId of ws.groups) {
          const clients = groupClients.get(groupId);
          if (clients) {
            clients.delete(ws);
          }
        }
      }
    });
  });
  
  // Setup ping interval
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  
  wss.on("close", () => {
    clearInterval(interval);
  });
  
  return wss;
};

// Handle authentication
const handleAuthentication = (ws: AuthenticatedClient, token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
    };
    
    ws.userId = decoded.id;
    ws.username = decoded.username;
    
    // Send success message
    ws.send(JSON.stringify({
      type: "auth_response",
      success: true
    }));
  } catch (error) {
    console.error("WebSocket authentication error:", error);
    ws.send(JSON.stringify({
      type: "auth_response",
      success: false,
      message: "Authentication failed"
    }));
  }
};

// Handle joining group
const handleJoinGroup = (ws: AuthenticatedClient, groupId: number) => {
  if (!ws.groups) {
    ws.groups = new Set();
  }
  
  ws.groups.add(groupId);
  
  // Add to group clients
  if (!groupClients.has(groupId)) {
    groupClients.set(groupId, new Set());
  }
  
  groupClients.get(groupId)?.add(ws);
  
  // Send success message
  ws.send(JSON.stringify({
    type: "join_group_response",
    success: true,
    groupId
  }));
};

// Handle leaving group
const handleLeaveGroup = (ws: AuthenticatedClient, groupId: number) => {
  if (ws.groups) {
    ws.groups.delete(groupId);
  }
  
  // Remove from group clients
  const clients = groupClients.get(groupId);
  if (clients) {
    clients.delete(ws);
  }
  
  // Send success message
  ws.send(JSON.stringify({
    type: "leave_group_response",
    success: true,
    groupId
  }));
};

// Emit message to all clients in a group
export const emitGroupMessage = (groupId: number, message: GroupMessage) => {
  const clients = groupClients.get(groupId);
  
  if (!clients) return;
  
  const messageData = JSON.stringify({
    type: "group_message",
    groupId,
    message
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageData);
    }
  });
};
