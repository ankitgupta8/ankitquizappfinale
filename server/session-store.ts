import { Store } from "express-session";
import { db } from "./db";
import { sessions } from "@shared/schema";
import { eq } from "drizzle-orm";

export class SQLiteStore extends Store {
  constructor() {
    super();
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    db.select()
      .from(sessions)
      .where(eq(sessions.id, sid))
      .then(([session]) => {
        if (!session) {
          return callback(null);
        }
        
        // Only check expiration if expiresAt is not null (for infinite sessions)
        if (session.expiresAt !== null && session.expiresAt < Date.now()) {
          this.destroy(sid, () => {});
          return callback(null);
        }

        try {
          const data = JSON.parse(session.data);
          callback(null, data);
        } catch (err) {
          callback(err);
        }
      })
      .catch(callback);
  }

  set(sid: string, session: any, callback?: (err?: any) => void): void {
    // If maxAge is undefined, set expiresAt to null for infinite session
    const expiresAt = session.cookie.maxAge ? Date.now() + session.cookie.maxAge : null;
    
    db.insert(sessions)
      .values({
        id: sid,
        userId: session.passport?.user || 0,
        expiresAt,
        data: JSON.stringify(session)
      })
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          expiresAt,
          data: JSON.stringify(session)
        }
      })
      .then(() => callback?.())
      .catch(callback);
  }

  destroy(sid: string, callback?: (err?: any) => void): void {
    db.delete(sessions)
      .where(eq(sessions.id, sid))
      .then(() => callback?.())
      .catch(callback);
  }

  // Optional: Implement touch to update session expiry
  touch(sid: string, session: any, callback?: () => void): void {
    // Only update expiresAt if maxAge is defined
    const expiresAt = session.cookie.maxAge ? Date.now() + session.cookie.maxAge : null;
    
    if (expiresAt !== null) {
      db.update(sessions)
        .set({ expiresAt })
        .where(eq(sessions.id, sid))
        .then(() => callback?.())
        .catch(() => callback?.());
    } else {
      callback?.();
    }
  }

  // Optional: Clean up expired sessions (only non-infinite ones)
  async clear(callback?: (err?: any) => void): Promise<void> {
    try {
      await db.delete(sessions)
        .where(
          eq(sessions.expiresAt, Date.now())
        );
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
} 