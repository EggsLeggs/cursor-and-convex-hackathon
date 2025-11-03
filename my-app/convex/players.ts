import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreatePlayer = mutation({
  args: {
    playerToken: v.union(v.string(), v.null()),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.playerToken) {
      const existing = await ctx.db
        .query("players")
        .withIndex("by_playerId", (q) => q.eq("playerId", args.playerToken!))
        .first();

      if (existing) {
        // Update name if provided
        if (args.name !== existing.name) {
          await ctx.db.patch(existing._id, { name: args.name });
        }
        return args.playerToken;
      }
    }

    // Generate new player token (UUID-like)
    const newToken = crypto.randomUUID();
    await ctx.db.insert("players", {
      playerId: newToken,
      name: args.name,
      roomId: null,
      score: 0,
      createdAt: Date.now(),
    });

    return newToken;
  },
});

export const getPlayerByToken = query({
  args: { playerToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerToken))
      .first();
  },
});

export const setPlayerName = mutation({
  args: {
    playerToken: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerToken))
      .first();

    if (player) {
      await ctx.db.patch(player._id, { name: args.name });
    }
  },
});
