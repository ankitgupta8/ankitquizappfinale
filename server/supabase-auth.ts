import { Express, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import { storage } from "./storage";

import { User } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware to verify Supabase JWT token
export async function verifySupabaseToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Sync user with our database
    const dbUser = await storage.syncUserFromSupabase(user);
    req.user = dbUser;

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Token verification failed" });
  }
}

// Optional middleware for routes that can work with or without auth
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && user) {
        const dbUser = await storage.syncUserFromSupabase(user);
        req.user = dbUser;
      }
    }

    next();
  } catch (error) {
    // Continue without auth if there's an error
    next();
  }
}

export function setupSupabaseAuth(app: Express) {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get current user endpoint
  app.get("/api/user", verifySupabaseToken, (req, res) => {
    res.json(req.user);
  });

  // User profile update endpoint
  app.put("/api/user/profile", verifySupabaseToken, async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      // Update user in Supabase Auth metadata
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        req.user!.id,
        { user_metadata: { username } }
      );

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // Update user in our database
      // Note: This would require implementing an update method in storage
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Profile update failed" });
    }
  });
}