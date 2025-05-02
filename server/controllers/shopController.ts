import { Request, Response } from "express";
import { db } from "../db";
import { shop, purchases, users, dogs } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// Get all shop items
export const getShopItems = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const items = await db.query.shop.findMany({
      where: eq(shop.available, true)
    });
    
    res.json(items);
  } catch (error) {
    console.error("Get shop items error:", error);
    res.status(500).json({ message: "Failed to get shop items", error });
  }
};

// Purchase item
export const purchaseItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { itemId, quantity = 1 } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required" });
    }
    
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }
    
    // Get item
    const item = await db.query.shop.findFirst({
      where: and(
        eq(shop.id, itemId),
        eq(shop.available, true)
      )
    });
    
    if (!item) {
      return res.status(404).json({ message: "Item not found or unavailable" });
    }
    
    // Get user resources
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        plk: true,
        lor: true,
        gems: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate total price
    const totalPrice = item.price * quantity;
    
    // Check if user has enough resources
    if (item.currencyType === "plk" && user.plk < totalPrice) {
      return res.status(400).json({ message: "Not enough PLK" });
    }
    
    if (item.currencyType === "lor" && user.lor < totalPrice) {
      return res.status(400).json({ message: "Not enough Lor" });
    }
    
    if (item.currencyType === "gems" && user.gems < totalPrice) {
      return res.status(400).json({ message: "Not enough Gems" });
    }
    
    // Process purchase
    await db.transaction(async (tx) => {
      // Create purchase record
      await tx.insert(purchases).values({
        userId,
        itemId,
        quantity,
        totalPrice,
        purchasedAt: new Date()
      });
      
      // Update user resources
      if (item.currencyType === "plk") {
        await tx.update(users)
          .set({ plk: user.plk - totalPrice })
          .where(eq(users.id, userId));
      } else if (item.currencyType === "lor") {
        await tx.update(users)
          .set({ lor: user.lor - totalPrice })
          .where(eq(users.id, userId));
      } else if (item.currencyType === "gems") {
        await tx.update(users)
          .set({ gems: user.gems - totalPrice })
          .where(eq(users.id, userId));
      }
      
      // Process item effects
      if (item.itemType === "dog") {
        // Create new dog from shop template
        const boost = item.boost as Record<string, number> || {};
        
        await tx.insert(dogs).values({
          userId,
          name: item.name,
          level: 1,
          experience: 0,
          strength: boost.strength || 8,
          agility: boost.agility || 8,
          defense: boost.defense || 8,
          happiness: 70,
          loyalty: 70,
          energy: 100,
          isAdult: false
        });
      } else if (item.itemType === "booster") {
        // Process booster effects (handled client-side)
      } else if (item.itemType === "currency") {
        // Add currency to user
        const currencyAmount = parseFloat(item.description.match(/\d+/)?.[0] || "0");
        
        if (item.name.toLowerCase().includes("plk")) {
          await tx.update(users)
            .set({ plk: user.plk + currencyAmount * quantity })
            .where(eq(users.id, userId));
        } else if (item.name.toLowerCase().includes("lor")) {
          await tx.update(users)
            .set({ lor: user.lor + currencyAmount * quantity })
            .where(eq(users.id, userId));
        } else if (item.name.toLowerCase().includes("gem")) {
          await tx.update(users)
            .set({ gems: user.gems + currencyAmount * quantity })
            .where(eq(users.id, userId));
        }
      }
    });
    
    res.json({ 
      message: "Purchase successful",
      item: item.name,
      quantity,
      totalPrice 
    });
  } catch (error) {
    console.error("Purchase item error:", error);
    res.status(500).json({ message: "Failed to purchase item", error });
  }
};
