import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const seedScenarios = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if scenarios already exist
    const existing = await ctx.db.query("scenarios").first();
    if (existing) {
      return { message: "Scenarios already seeded" };
    }

    const scenarios = [
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

    for (const scenario of scenarios) {
      await ctx.db.insert("scenarios", scenario);
    }

    return { message: `Seeded ${scenarios.length} scenarios` };
  },
});

export const getRandomScenario = query({
  args: {},
  handler: async (ctx) => {
    const scenarios = await ctx.db.query("scenarios").collect();
    if (scenarios.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex];
  },
});
