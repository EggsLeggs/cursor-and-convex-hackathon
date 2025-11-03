import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

// Lazy initialization to avoid errors during module analysis
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Set it using `npx convex env set OPENAI_API_KEY <your-key>`"
    );
  }
  return new OpenAI({
    apiKey,
  });
}

export const judgePrompt = action({
  args: {
    scenario: v.string(),
    prompt: v.string(),
    allPrompts: v.optional(
      v.array(
        v.object({
          playerName: v.string(),
          prompt: v.string(),
        })
      )
    ),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = `You are judging a creative game where players attempt to complete scenarios using AI prompts.

Evaluate whether the player's prompt would successfully complete the given scenario. Consider creativity, feasibility, and effectiveness.

Your response should:
1. Describe what would actually happen based on the prompt
2. Evaluate if this outcome successfully completes the scenario
3. End with exactly: <WINNER: True> or <WINNER: False>`;

    let userPrompt = `Scenario: ${args.scenario}

Player's attempt: ${args.prompt}`;

    // If there are multiple prompts, provide context for sabotage
    if (args.allPrompts && args.allPrompts.length > 1) {
      userPrompt += `\n\nOther players' attempts (for context):\n`;
      args.allPrompts.forEach((p) => {
        if (p.prompt !== args.prompt) {
          userPrompt += `${p.playerName}: ${p.prompt}\n`;
        }
      });
      userPrompt += `\nNote: Players can mention each other in prompts to sabotage. Evaluate the logical sequence of events.`;
    }

    try {
      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || "";

      // Extract outcome (everything before the WINNER tag)
      const winnerMatch = response.match(/<WINNER:\s*(True|False)\s*>/i);
      const isWinner = winnerMatch
        ? winnerMatch[1].toLowerCase() === "true"
        : false;
      const outcome = response
        .replace(/<WINNER:\s*(True|False)\s*>/i, "")
        .trim();

      return {
        outcome,
        isWinner,
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        outcome: "Error evaluating prompt. Please try again.",
        isWinner: false,
      };
    }
  },
});
