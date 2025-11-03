import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  rooms: defineTable({
    gameCode: v.string(),
    hostId: v.string(),
    currentRound: v.number(),
    maxRounds: v.number(),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished")
    ),
    createdAt: v.number(),
  }).index("by_gameCode", ["gameCode"]),
  players: defineTable({
    playerId: v.string(),
    name: v.string(),
    roomId: v.union(v.id("rooms"), v.null()),
    score: v.number(),
    createdAt: v.number(),
  })
    .index("by_playerId", ["playerId"])
    .index("by_roomId", ["roomId"]),
  scenarios: defineTable({
    text: v.string(),
    description: v.string(),
  }),
  submissions: defineTable({
    roomId: v.id("rooms"),
    playerId: v.string(),
    round: v.number(),
    prompt: v.string(),
    outcome: v.union(v.string(), v.null()),
    isWinner: v.union(v.boolean(), v.null()),
    submittedAt: v.number(),
  })
    .index("by_roomId_round", ["roomId", "round"])
    .index("by_roomId_playerId_round", ["roomId", "playerId", "round"]),
  gameState: defineTable({
    roomId: v.id("rooms"),
    currentRound: v.number(),
    currentScenario: v.union(v.id("scenarios"), v.null()),
    status: v.union(
      v.literal("prompt"),
      v.literal("judging"),
      v.literal("results")
    ),
    allJudged: v.boolean(),
  }).index("by_roomId", ["roomId"]),
});
