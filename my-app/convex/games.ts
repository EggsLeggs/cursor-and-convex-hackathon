import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

function generateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createRoom = mutation({
  args: {
    hostToken: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure player exists
    let player = await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.hostToken))
      .first();

    if (!player) {
      // Create player if doesn't exist
      await ctx.db.insert("players", {
        playerId: args.hostToken,
        name: args.playerName,
        roomId: null,
        score: 0,
        createdAt: Date.now(),
      });
      player = await ctx.db
        .query("players")
        .withIndex("by_playerId", (q) => q.eq("playerId", args.hostToken))
        .first();
    } else if (player.name !== args.playerName) {
      await ctx.db.patch(player._id, { name: args.playerName });
    }

    // Generate unique game code
    let gameCode: string;
    let exists = true;
    while (exists) {
      gameCode = generateGameCode();
      const existing = await ctx.db
        .query("rooms")
        .withIndex("by_gameCode", (q) => q.eq("gameCode", gameCode))
        .first();
      if (!existing) {
        exists = false;
      }
    }

    // Create room
    const roomId = await ctx.db.insert("rooms", {
      gameCode: gameCode!,
      hostId: args.hostToken,
      currentRound: 0,
      maxRounds: 6,
      status: "waiting",
      createdAt: Date.now(),
    });

    // Update player's roomId
    await ctx.db.patch(player!._id, { roomId });

    return { roomId, gameCode: gameCode! };
  },
});

export const joinRoom = mutation({
  args: {
    gameCode: v.string(),
    playerToken: v.string(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find room
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_gameCode", (q) => q.eq("gameCode", args.gameCode))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "waiting") {
      throw new Error("Game has already started");
    }

    // Check current player count in the room
    const currentPlayers = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", room._id))
      .collect();

    // Check if player is already in this room
    const existingPlayer = currentPlayers.find(
      (p) => p.playerId === args.playerToken
    );

    // If player is not in the room and room is full, reject
    if (!existingPlayer && currentPlayers.length >= 6) {
      throw new Error("Room is full (maximum 6 players)");
    }

    // Ensure player exists
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerToken))
      .first();

    if (!player) {
      await ctx.db.insert("players", {
        playerId: args.playerToken,
        name: args.playerName,
        roomId: room._id,
        score: 0,
        createdAt: Date.now(),
      });
    } else {
      // Check if player is already in another room
      if (player.roomId !== room._id) {
        await ctx.db.patch(player._id, {
          roomId: room._id,
          name: args.playerName,
          score: 0, // Reset score when joining new room
        });
      } else if (player.name !== args.playerName) {
        await ctx.db.patch(player._id, { name: args.playerName });
      }
    }

    return { roomId: room._id };
  },
});

export const kickPlayer = mutation({
  args: {
    roomId: v.id("rooms"),
    hostToken: v.string(),
    playerIdToKick: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify host permissions
    if (room.hostId !== args.hostToken) {
      throw new Error("Only the host can kick players");
    }

    if (room.status !== "waiting") {
      throw new Error("Cannot kick players after game has started");
    }

    // Cannot kick the host
    if (room.hostId === args.playerIdToKick) {
      throw new Error("Cannot kick the host");
    }

    // Find and remove the player
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerIdToKick))
      .first();

    if (player && player.roomId === args.roomId) {
      await ctx.db.patch(player._id, {
        roomId: null,
        score: 0,
      });
    }
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    playerToken: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Find and remove the player
    const player = await ctx.db
      .query("players")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerToken))
      .first();

    if (player && player.roomId === args.roomId) {
      await ctx.db.patch(player._id, {
        roomId: null,
        score: 0,
      });
    }

    // If the host leaves, we could optionally delete the room or transfer host
    // For now, just remove the player
    // Note: Players can leave at any time, even during active games
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      return null;
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    return {
      ...room,
      players: players.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        score: p.score,
      })),
    };
  },
});

export const getGameState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!gameState) {
      return null;
    }

    const scenario = gameState.currentScenario
      ? await ctx.db.get(gameState.currentScenario)
      : null;

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_roomId_round", (q) =>
        q.eq("roomId", args.roomId).eq("round", gameState.currentRound)
      )
      .collect();

    // Get player names for submissions
    const playerMap = new Map();
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    players.forEach((p) => {
      playerMap.set(p.playerId, p.name);
    });

    return {
      ...gameState,
      scenario: scenario
        ? {
            _id: scenario._id,
            text: scenario.text,
            description: scenario.description,
          }
        : null,
      submissions: submissions.map((s) => ({
        ...s,
        playerName: playerMap.get(s.playerId) || "Unknown",
      })),
    };
  },
});

export const submitPrompt = mutation({
  args: {
    roomId: v.id("rooms"),
    playerToken: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!gameState || gameState.status !== "prompt") {
      throw new Error("Not in prompt submission phase");
    }

    // Check if already submitted
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_roomId_playerId_round", (q) =>
        q
          .eq("roomId", args.roomId)
          .eq("playerId", args.playerToken)
          .eq("round", gameState.currentRound)
      )
      .first();

    if (existing) {
      // Update existing submission
      await ctx.db.patch(existing._id, {
        prompt: args.prompt,
        submittedAt: Date.now(),
      });
    } else {
      // Create new submission
      await ctx.db.insert("submissions", {
        roomId: args.roomId,
        playerId: args.playerToken,
        round: gameState.currentRound,
        prompt: args.prompt,
        outcome: null,
        isWinner: null,
        submittedAt: Date.now(),
      });
    }
  },
});

export const startGame = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "waiting") {
      throw new Error("Game already started");
    }

    // Get random scenario (auto-seed if needed)
    let scenarios = await ctx.db.query("scenarios").collect();
    if (scenarios.length === 0) {
      // Auto-seed scenarios
      const defaultScenarios = [
        {
          text: "Herd the geese into the paddock",
          description:
            "You need to get all the geese from the field into the fenced paddock area.",
        },
        {
          text: "Cross the raging river without getting wet",
          description:
            "Find a way to cross the fast-flowing river without getting any part of you wet.",
        },
        {
          text: "Convince the grumpy cat to move from the keyboard",
          description:
            "The cat is blocking the keyboard and won't move. You need to get it to leave.",
        },
        {
          text: "Retrieve the balloon from the tall tree",
          description:
            "A child's balloon is stuck in the top branches of a very tall tree. Get it down safely.",
        },
        {
          text: "Make the robots dance in sync",
          description:
            "Program or instruct multiple robots to perform a synchronized dance routine.",
        },
        {
          text: "Build a tower that reaches the clouds",
          description:
            "Construct a tower tall enough to touch the clouds using whatever materials you can find.",
        },
        {
          text: "Get the diamond through the laser security grid",
          description:
            "Navigate a valuable diamond through a complex laser security system without triggering alarms.",
        },
        {
          text: "Calm the thunderstorm over the city",
          description:
            "Stop the violent thunderstorm that's been raging over the city for hours.",
        },
        {
          text: "Extract the splinter from the sleeping dragon's paw",
          description:
            "Remove a painful splinter from a dragon's paw without waking it up.",
        },
        {
          text: "Cook a perfect soufflé in zero gravity",
          description:
            "Prepare and bake a flawless soufflé while floating in a zero-gravity environment.",
        },
      ];

      for (const scenario of defaultScenarios) {
        await ctx.db.insert("scenarios", scenario);
      }

      // Reload scenarios after seeding
      scenarios = await ctx.db.query("scenarios").collect();
    }
    const randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    // Update room status
    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentRound: 1,
    });

    // Create game state
    await ctx.db.insert("gameState", {
      roomId: args.roomId,
      currentRound: 1,
      currentScenario: randomScenario._id,
      status: "prompt",
      allJudged: false,
    });
  },
});

export const setGameStateStatus = mutation({
  args: {
    gameStateId: v.id("gameState"),
    status: v.union(
      v.literal("prompt"),
      v.literal("judging"),
      v.literal("results")
    ),
    allJudged: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const update: any = { status: args.status };
    if (args.allJudged !== undefined) {
      update.allJudged = args.allJudged;
    }
    await ctx.db.patch(args.gameStateId, update);
  },
});

export const getRoundData = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!gameState) {
      return null;
    }

    const scenario = gameState.currentScenario
      ? await ctx.db.get(gameState.currentScenario)
      : null;

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_roomId_round", (q) =>
        q.eq("roomId", args.roomId).eq("round", gameState.currentRound)
      )
      .collect();

    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    const playerMap = new Map();
    players.forEach((p) => {
      playerMap.set(p.playerId, p.name);
    });

    return {
      gameState,
      scenario,
      submissions,
      playerMap: Object.fromEntries(playerMap),
    };
  },
});

export const judgeRound = action({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    // Get round data via query
    const roundData = await ctx.runQuery(api.games.getRoundData, {
      roomId: args.roomId,
    });

    if (
      !roundData ||
      !roundData.gameState ||
      roundData.gameState.status !== "prompt"
    ) {
      throw new Error("Not ready to judge");
    }

    if (!roundData.scenario) {
      throw new Error("No scenario found");
    }

    if (roundData.submissions.length === 0) {
      throw new Error("No submissions to judge");
    }

    // Update status to judging
    await ctx.runMutation(api.games.setGameStateStatus, {
      gameStateId: roundData.gameState._id,
      status: "judging",
    });

    // Prepare all prompts for context (for sabotage evaluation)
    const allPrompts = roundData.submissions.map((s) => ({
      playerName: roundData.playerMap[s.playerId] || "Unknown",
      prompt: s.prompt,
    }));

    // Judge each submission sequentially
    for (const submission of roundData.submissions) {
      const judgeResult = await ctx.runAction(api.openai.judgePrompt, {
        scenario: roundData.scenario.description,
        prompt: submission.prompt,
        allPrompts,
      });

      // Update submission with results
      await ctx.runMutation(api.games.updateSubmission, {
        submissionId: submission._id,
        outcome: judgeResult.outcome,
        isWinner: judgeResult.isWinner,
        playerId: submission.playerId,
        roomId: args.roomId,
      });
    }

    // Update game state to results
    await ctx.runMutation(api.games.setGameStateStatus, {
      gameStateId: roundData.gameState._id,
      status: "results",
      allJudged: true,
    });
  },
});

export const nextRound = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    const nextRoundNum = gameState.currentRound + 1;

    if (nextRoundNum > room.maxRounds) {
      // Game finished
      await ctx.db.patch(args.roomId, { status: "finished" });
      return { finished: true };
    }

    // Get random scenario (different from current, auto-seed if needed)
    let scenarios = await ctx.db.query("scenarios").collect();
    if (scenarios.length === 0) {
      // Auto-seed scenarios
      const defaultScenarios = [
        {
          text: "Herd the geese into the paddock",
          description:
            "You need to get all the geese from the field into the fenced paddock area.",
        },
        {
          text: "Cross the raging river without getting wet",
          description:
            "Find a way to cross the fast-flowing river without getting any part of you wet.",
        },
        {
          text: "Convince the grumpy cat to move from the keyboard",
          description:
            "The cat is blocking the keyboard and won't move. You need to get it to leave.",
        },
        {
          text: "Retrieve the balloon from the tall tree",
          description:
            "A child's balloon is stuck in the top branches of a very tall tree. Get it down safely.",
        },
        {
          text: "Make the robots dance in sync",
          description:
            "Program or instruct multiple robots to perform a synchronized dance routine.",
        },
        {
          text: "Build a tower that reaches the clouds",
          description:
            "Construct a tower tall enough to touch the clouds using whatever materials you can find.",
        },
        {
          text: "Get the diamond through the laser security grid",
          description:
            "Navigate a valuable diamond through a complex laser security system without triggering alarms.",
        },
        {
          text: "Calm the thunderstorm over the city",
          description:
            "Stop the violent thunderstorm that's been raging over the city for hours.",
        },
        {
          text: "Extract the splinter from the sleeping dragon's paw",
          description:
            "Remove a painful splinter from a dragon's paw without waking it up.",
        },
        {
          text: "Cook a perfect soufflé in zero gravity",
          description:
            "Prepare and bake a flawless soufflé while floating in a zero-gravity environment.",
        },
      ];

      for (const scenario of defaultScenarios) {
        await ctx.db.insert("scenarios", scenario);
      }

      // Reload scenarios after seeding
      scenarios = await ctx.db.query("scenarios").collect();
    }
    let randomScenario =
      scenarios[Math.floor(Math.random() * scenarios.length)];

    // Ensure different scenario if possible
    if (scenarios.length > 1 && gameState.currentScenario) {
      while (randomScenario._id === gameState.currentScenario) {
        randomScenario =
          scenarios[Math.floor(Math.random() * scenarios.length)];
      }
    }

    // Update room and game state
    await ctx.db.patch(args.roomId, { currentRound: nextRoundNum });
    await ctx.db.patch(gameState._id, {
      currentRound: nextRoundNum,
      currentScenario: randomScenario._id,
      status: "prompt",
      allJudged: false,
    });

    return { finished: false, round: nextRoundNum };
  },
});

export const updateSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    outcome: v.string(),
    isWinner: v.boolean(),
    playerId: v.string(),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.submissionId, {
      outcome: args.outcome,
      isWinner: args.isWinner,
    });

    // Update player score
    if (args.isWinner) {
      const player = await ctx.db
        .query("players")
        .withIndex("by_playerId", (q) => q.eq("playerId", args.playerId))
        .first();

      if (player && player.roomId === args.roomId) {
        await ctx.db.patch(player._id, {
          score: player.score + 1,
        });
      }
    }
  },
});

export const getScoreboard = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_roomId", (q) => q.eq("roomId", args.roomId))
      .collect();

    return players
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.playerId,
        name: p.name,
        score: p.score,
      }));
  },
});
