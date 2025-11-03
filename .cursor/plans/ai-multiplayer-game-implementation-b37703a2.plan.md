<!-- b37703a2-36f5-4060-8402-4ad35ffec07b 546b0f9b-84b4-4125-9abe-1129c10d3909 -->
# AI Multiplayer Game Implementation Plan

## Overview

Create a multiplayer game where players join rooms via game codes, receive scenarios, submit AI prompts that are evaluated by OpenAI. Players can sabotage each other by mentioning others in prompts. Best of 6 rounds wins.

## Database Schema (convex/schema.ts)

### Tables:

- **rooms**: gameCode (string), hostId (string), currentRound (number), maxRounds (number), status ("waiting" | "playing" | "finished"), createdAt (number)
- **players**: playerId (string, indexed), name (string), roomId (Id<"rooms">), score (number), createdAt (number)
- **scenarios**: text (string), description (string)
- **submissions**: roomId (Id<"rooms">), playerId (string), round (number), prompt (string), outcome (string | null), isWinner (boolean | null), submittedAt (number)
- **gameState**: roomId (Id<"rooms">, unique), currentRound (number), currentScenario (Id<"scenarios"> | null), status ("prompt" | "judging" | "results"), allJudged (boolean)

## Convex Functions

### convex/games.ts

- **createRoom** (mutation): Generate unique game code, create room, add host as player
- **joinRoom** (mutation): Validate game code, add player to room, return player token
- **getRoom** (query): Get room data with players list
- **getGameState** (query): Get current game state for a room
- **submitPrompt** (mutation): Store player's prompt submission for current round
- **judgeRound** (action): Process all submissions for a round, call OpenAI for each, update results
- **getScoreboard** (query): Get players sorted by score for a room
- **nextRound** (mutation): Advance to next round, select new scenario
- **startGame** (mutation): Initialize first round with random scenario

### convex/players.ts

- **getOrCreatePlayer** (mutation): Get player by token or create new one with generated token
- **getPlayerByToken** (query): Retrieve player data by localStorage token
- **setPlayerName** (mutation): Update player name

### convex/scenarios.ts

- **seedScenarios** (mutation): Add initial scenarios to database
- **getRandomScenario** (query): Get random scenario for new round

### convex/openai.ts (if separate file)

- **judgePrompt** (action): Call OpenAI API with scenario + prompt, return outcome and winner status

## Frontend Components

### src/App.tsx

- Main router component checking localStorage for playerToken
- Redirect to lobby if no token
- Route to Lobby, WaitingRoom, or GameScreen based on game state

### src/components/Lobby.tsx

- Create room button (generates game code)
- Join room form (game code input)
- Player name input

### src/components/WaitingRoom.tsx

- Display game code for sharing
- List of players in room
- Start game button (host only)
- Real-time player list updates

### src/components/GameScreen.tsx

- Display current scenario
- Show current round number (1-6)
- Prompt input field with submit button
- Real-time status updates
- Display results as they come in (player prompt → outcome → win/loss)
- Show scoreboard after round completion
- Handle game end (6 rounds complete)

### src/utils/storage.ts

- **getPlayerToken()**: Retrieve token from localStorage
- **setPlayerToken(token)**: Save token to localStorage
- **clearPlayerToken()**: Remove token (triggers redirect to lobby)
- **hasPlayerToken()**: Check if token exists

## OpenAI Integration

### Judging Logic:

1. For each submission, send to OpenAI: scenario description + player prompt + instruction to evaluate success
2. Prompt format: "Scenario: [scenario]. Player's attempt: [prompt]. Evaluate if this attempt successfully completes the scenario. Generate the outcome and end with <WINNER: True> or <WINNER: False>"
3. Parse response to extract outcome text and winner status
4. Store in submissions table
5. Process all submissions sequentially in judgeRound action

## Key Implementation Details

### Room Codes

- Generate 6-character alphanumeric codes
- Ensure uniqueness in createRoom

### Player Tokens

- Generate UUIDs for player tokens
- Store in localStorage on first join/create
- Use token to identify player across sessions
- If token missing on load → redirect to lobby

### Round Flow

1. Start game → select scenario → status = "prompt"
2. Players submit prompts → stored in submissions
3. When all submitted → trigger judgeRound action
4. JudgeRound processes each submission with OpenAI sequentially
5. Update submissions with outcomes and isWinner
6. Set gameState.status = "results"
7. Display results to all players
8. After display → nextRound or endGame (if round 6)

### Sabotage Handling

- Players can mention other players in prompts (e.g., "@PlayerName does something")
- OpenAI evaluates in context of all submissions
- Processing order: read all prompts first, then judge in logical order (sabotages considered)

## Environment Variables

- Add `VITE_CONVEX_URL` (already set up)
- Need OpenAI API key in Convex dashboard (CONVEX_OPENAI_API_KEY)

## Dependencies to Add

- OpenAI SDK for Convex (install in convex directory)