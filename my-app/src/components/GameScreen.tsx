import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getPlayerToken } from "../utils/storage";
import { LogOut, HelpCircle } from "lucide-react";

interface GameScreenProps {
  roomId: string;
  onLeaveGame?: () => void;
}

export default function GameScreen({ roomId, onLeaveGame }: GameScreenProps) {
  const [prompt, setPrompt] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [judgingInProgress, setJudgingInProgress] = useState(false);

  const playerToken = getPlayerToken();
  const room = useQuery(api.games.getRoom, { roomId: roomId as any });
  const gameState = useQuery(api.games.getGameState, { roomId: roomId as any });
  const scoreboard = useQuery(api.games.getScoreboard, { roomId: roomId as any });
  const submitPrompt = useMutation(api.games.submitPrompt);
  const judgeRound = useAction(api.games.judgeRound);
  const nextRound = useMutation(api.games.nextRound);
  const leaveRoom = useMutation(api.games.leaveRoom);

  // Check if player has submitted
  useEffect(() => {
    if (gameState && playerToken) {
      const submission = gameState.submissions.find(
        (s) => s.playerId === playerToken
      );
      setHasSubmitted(!!submission);
      if (submission) {
        setPrompt(submission.prompt);
      }
    }
  }, [gameState, playerToken]);

  const handleJudgeRound = useCallback(async () => {
    try {
      setJudgingInProgress(true);
      await judgeRound({ roomId: roomId as any });
    } catch (err: any) {
      alert(err.message || "Failed to judge round");
      setJudgingInProgress(false);
    }
  }, [judgeRound, roomId]);

  // Monitor game state changes
  useEffect(() => {
    if (gameState) {
      if (gameState.status === "judging") {
        setJudgingInProgress(true);
        setShowResults(false);
      } else if (gameState.status === "results") {
        setJudgingInProgress(false);
        setShowResults(true);
        // Auto-trigger judging if not already done
        if (!gameState.allJudged && gameState.submissions.length > 0) {
          handleJudgeRound();
        }
      } else if (gameState.status === "prompt") {
        setShowResults(false);
        setJudgingInProgress(false);
        setHasSubmitted(false);
        setPrompt("");
      }
    }
  }, [gameState?.status, handleJudgeRound]);

  // Auto-trigger judging when all players submit
  useEffect(() => {
    if (
      gameState &&
      gameState.status === "prompt" &&
      room &&
      gameState.submissions.length === room.players.length &&
      room.players.length > 0 &&
      playerToken === room.hostId &&
      !judgingInProgress
    ) {
      // All players have submitted, automatically start judging
      handleJudgeRound();
    }
  }, [gameState, room, playerToken, judgingInProgress, handleJudgeRound]);

  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }

    try {
      await submitPrompt({
        roomId: roomId as any,
        playerToken: playerToken!,
        prompt: prompt.trim(),
      });
      setHasSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Failed to submit prompt");
    }
  };

  const handleNextRound = async () => {
    try {
      const result = await nextRound({ roomId: roomId as any });
      if (result.finished) {
        // Game ended - could show final screen
        alert("Game finished! Check the scoreboard.");
      }
      setShowResults(false);
    } catch (err: any) {
      alert(err.message || "Failed to start next round");
    }
  };

  const handleLeaveGame = async () => {
    if (!playerToken) return;
    
    if (!confirm("Are you sure you want to leave the game? Your progress will be lost.")) {
      return;
    }

    try {
      await leaveRoom({
        roomId: roomId as any,
        playerToken: playerToken,
      });
      if (onLeaveGame) {
        onLeaveGame();
      }
    } catch (err: any) {
      alert(err.message || "Failed to leave game");
    }
  };

  // If player is no longer in the room, redirect to lobby
  // This must be before the early return to follow Rules of Hooks
  const currentPlayer = room?.players.find((p) => p.playerId === playerToken);
  useEffect(() => {
    if (room && playerToken && room.players.length > 0 && !currentPlayer && onLeaveGame) {
      // Player was removed from the room, redirect to lobby
      onLeaveGame();
    }
  }, [room, playerToken, currentPlayer, onLeaveGame]);

  const renderOutcome = (text: string) => {
    const numberedMatches = Array.from(
      text.matchAll(/(?:^|\n)\s*(\d+)\.\s*([\s\S]*?)(?=(?:\n\s*\d+\.\s)|$)/g)
    );
    if (numberedMatches.length >= 2) {
      return (
        <ol className="list-decimal ml-6 my-2 text-foreground">
          {numberedMatches.map((m, i) => (
            <li key={i} className="mb-1">{m[2].trim()}</li>
          ))}
        </ol>
      );
    }
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      return (
        <ul className="list-disc ml-6 my-2 text-foreground">
          {lines.map((l, i) => (
            <li key={i} className="mb-1">{l}</li>
          ))}
        </ul>
      );
    }
    return <p className="my-2 text-foreground">{text}</p>;
  };

  if (!gameState || !room) {
    return <div>Loading game...</div>;
  }
  const isHost = playerToken === room.hostId;

  // Check if all players submitted
  const allSubmitted =
    gameState.status === "prompt" &&
    gameState.submissions.length === room.players.length &&
    room.players.length > 0;

  if (room.status === "finished") {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Game Finished!</h1>
          <button
            onClick={handleLeaveGame}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              backgroundColor: "transparent",
              color: "var(--destructive, #ef4444)",
              border: "1px solid var(--destructive, #ef4444)",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--destructive, #ef4444)";
              e.currentTarget.style.color = "var(--destructive-foreground, #ffffff)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--destructive, #ef4444)";
            }}
          >
            <LogOut className="h-4 w-4" />
            Leave Game
          </button>
        </div>
        <h2 className="text-foreground mb-4">Final Scoreboard</h2>
        <div className="mb-8 space-y-2">
          {scoreboard?.map((player, idx) => (
            <div
              key={player.playerId}
              className={`p-4 rounded border flex justify-between items-center ${
                idx === 0 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-center">
                <span className="text-2xl mr-4 text-foreground">
                  #{idx + 1}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {player.name}
                </span>
                {idx === 0 && (
                  <span className="ml-4 text-sm text-primary font-bold">
                    🏆 WINNER
                  </span>
                )}
              </div>
              <span className="text-xl font-bold text-foreground">
                {player.score} / {room.maxRounds}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Round {gameState.currentRound} of {room.maxRounds}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {currentPlayer && (
            <div>
              <strong>Your Score: {currentPlayer.score}</strong>
            </div>
          )}
          <button
            onClick={handleLeaveGame}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem",
              backgroundColor: "transparent",
              color: "var(--destructive, #ef4444)",
              border: "1px solid var(--destructive, #ef4444)",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--destructive, #ef4444)";
              e.currentTarget.style.color = "var(--destructive-foreground, #ffffff)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--destructive, #ef4444)";
            }}
          >
            <LogOut className="h-4 w-4" />
            Leave Game
          </button>
        </div>
      </div>

      {gameState.scenario && (
        <div className="bg-muted p-8 rounded-lg mb-8">
          <h2 className="mt-0 text-foreground font-semibold mb-4">Scenario</h2>
          <p className="text-lg leading-relaxed text-foreground">
            {gameState.scenario.description}
          </p>
        </div>
      )}

      {gameState.status === "prompt" && (
        <div style={{ marginBottom: "2rem" }}>
          <div className="flex items-center gap-2 mb-2">
            <label className="font-bold text-lg text-foreground">
              Your Prompt
            </label>
            <div className="relative group">
              <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                <div className="bg-popover text-popover-foreground text-sm rounded-lg p-3 shadow-lg border border-border min-w-[200px] max-w-[300px]">
                  <p className="font-semibold mb-1">Sabotage Tips:</p>
                  <p>Mention other players with @Name to sabotage their prompts!</p>
                  <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-popover"></div>
                </div>
              </div>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={hasSubmitted}
            placeholder="Enter your prompt to complete the scenario..."
            className="w-full min-h-[120px] p-4 text-base rounded border border-input bg-background text-foreground placeholder:text-muted-foreground font-inherit resize-y disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: "120px",
            }}
          />
          <button
            onClick={handleSubmitPrompt}
            disabled={hasSubmitted || !prompt.trim()}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "1rem",
              fontSize: "1.1rem",
              fontWeight: "bold",
              backgroundColor: hasSubmitted ? "#4caf50" : "#646cff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: hasSubmitted ? "not-allowed" : "pointer",
            }}
          >
            {hasSubmitted ? "✓ Submitted" : "Submit Prompt"}
          </button>
          {hasSubmitted && (
            <p style={{ marginTop: "0.5rem", color: "var(--waiting-text-secondary, #666)" }}>
              Waiting for other players to submit...
            </p>
          )}
          {isHost && gameState.status === "prompt" && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleJudgeRound}
                disabled={judgingInProgress || gameState.submissions.length === 0}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
              >
                {judgingInProgress 
                  ? "Judging..." 
                  : gameState.submissions.length === 0
                    ? "Wait for submissions"
                    : allSubmitted
                      ? "Start Judging (All submitted)"
                      : `End Round Early (${gameState.submissions.length}/${room.players.length} submitted)`
                }
              </button>
            </div>
          )}
        </div>
      )}

      {(gameState.status === "judging" || judgingInProgress) && (
        <div className="p-8 bg-muted rounded-lg text-center">
          <h2 className="text-foreground mb-2">Judging in progress...</h2>
          <p className="text-muted-foreground">AI is evaluating all submissions. This may take a moment.</p>
        </div>
      )}

      {showResults && gameState.status === "results" && (
        <div className="mb-8">
          <h2 className="text-foreground mb-4">Round Results</h2>
          <div className="flex flex-col gap-4">
            {gameState.submissions
              .sort((a, b) => {
                // Sort by winner first, then by submission time
                if (a.isWinner && !b.isWinner) return -1;
                if (!a.isWinner && b.isWinner) return 1;
                return a.submittedAt - b.submittedAt;
              })
              .map((submission) => (
                <div
                  key={submission._id}
                  className={`p-6 rounded-lg border-2 ${
                    submission.isWinner 
                      ? "bg-green-500/10 dark:bg-green-900/30 border-green-500 dark:border-green-700" 
                      : "bg-red-500/10 dark:bg-red-900/30 border-red-500 dark:border-red-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="m-0 text-foreground font-semibold">
                      {submission.playerName}
                      {submission.playerId === playerToken && " (You)"}
                    </h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={submission.isWinner ? "/robot_pass.png" : "/robot_fail.png"}
                        alt={submission.isWinner ? "Pass" : "Fail"}
                        className="w-12 h-12 object-contain"
                      />
                      <span
                        className={`px-4 py-2 rounded font-bold text-lg ${
                          submission.isWinner 
                            ? "bg-green-600 dark:bg-green-500 text-white" 
                            : "bg-red-600 dark:bg-red-500 text-white"
                        }`}
                      >
                        {submission.isWinner ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <strong className="text-foreground">Prompt:</strong>
                    <p className="my-2 italic text-foreground">
                      "{submission.prompt}"
                    </p>
                  </div>
                  {submission.outcome && (
                    <div>
                      <strong className="text-foreground">Outcome:</strong>
                      {renderOutcome(submission.outcome)}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="my-8">
            <h2 className="text-foreground mb-4">Current Scoreboard</h2>
            <div className="flex flex-col gap-2">
              {scoreboard?.map((player, idx) => (
                <div
                  key={player.playerId}
                  className={`p-4 rounded border flex justify-between items-center ${
                    idx === 0 
                      ? "bg-primary/10 border-primary/30" 
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-4 text-foreground">
                      #{idx + 1}
                    </span>
                    <span className="text-foreground">{player.name}</span>
                    {player.playerId === playerToken && (
                      <span className="ml-2 text-muted-foreground">
                        (You)
                      </span>
                    )}
                  </div>
                  <span className="text-xl font-bold text-foreground">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isHost && (
            <button
              onClick={handleNextRound}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.1rem",
                fontWeight: "bold",
                backgroundColor: "#646cff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {gameState.currentRound >= room.maxRounds
                ? "End Game"
                : "Next Round"}
            </button>
          )}

          {!isHost && (
            <div className="p-4 bg-muted rounded text-center text-muted-foreground">
              Waiting for host to start next round...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

