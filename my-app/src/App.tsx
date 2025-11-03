import { useState, useEffect, useCallback } from 'react'
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { getPlayerToken } from "./utils/storage";
import Lobby from "./components/Lobby";
import GameScreen from "./components/GameScreen";
import type { Id } from "../convex/_generated/dataModel";

type Screen = "lobby" | "game";

function App() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const [roomId, setRoomId] = useState<Id<"rooms"> | "">("");

  useEffect(() => {
    // Check for player token, redirect to lobby if missing
    if (!getPlayerToken()) {
      setScreen("lobby");
      return;
    }
  }, []);

  const handleRoomCreated = useCallback((newRoomId: string) => {
    setRoomId(newRoomId as Id<"rooms">);
    // Stay in lobby - no need to navigate to waiting room
  }, []);

  const handleRoomJoined = useCallback((newRoomId: string) => {
    setRoomId((currentRoomId) => {
      // Only update if different to prevent loops
      if (currentRoomId !== newRoomId) {
        return newRoomId as Id<"rooms">;
      }
      return currentRoomId;
    });
    // Stay in lobby - no need to navigate to waiting room
  }, []);

  const handleGameStart = useCallback((gameRoomId?: string) => {
    if (gameRoomId) {
      setRoomId((currentRoomId) => {
        if (currentRoomId !== gameRoomId) {
          return gameRoomId as Id<"rooms">;
        }
        return currentRoomId;
      });
    }
    setScreen((currentScreen) => {
      if (currentScreen !== "game") {
        return "game";
      }
      return currentScreen;
    });
  }, []);

  const handleLeaveGame = useCallback(() => {
    setRoomId("");
    setScreen("lobby");
  }, []);

  // Check if player is already in a room when loading
  const playerToken = getPlayerToken();
  const playerRoom = useQuery(
    api.players.getPlayerRoom,
    playerToken ? { playerToken } : "skip"
  );

  // Set roomId if player is already in a room
  useEffect(() => {
    if (playerRoom) {
      const roomIdStr = playerRoom._id as string;
      if (!roomId || roomId !== roomIdStr) {
        setRoomId(roomIdStr as Id<"rooms">);
        // If game has already started, redirect to game screen
        if (playerRoom.status === "playing" || playerRoom.status === "finished") {
          setScreen("game");
        }
      }
    } else if (!playerRoom && roomId) {
      // Player was kicked or removed from room - reset to lobby
      setRoomId("");
      if (screen !== "lobby") {
        setScreen("lobby");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerRoom?._id, playerRoom?.status]);

  // Monitor room status to auto-advance screens
   
  const room = useQuery(
    api.games.getRoom,
    roomId ? { roomId } : "skip"
  );

  useEffect(() => {
    if (room) {
      if (room.status === "playing" && screen === "lobby") {
        setScreen("game");
      }
      // Check if current player is still in the room
      const playerToken = getPlayerToken();
      if (playerToken && !room.players.find(p => p.playerId === playerToken)) {
        // Player was kicked from the room
        setRoomId("");
        setScreen("lobby");
      }
    } else if (roomId && !room) {
      // Room was deleted or player was removed
      setRoomId("");
      setScreen("lobby");
    }
  }, [room, screen, roomId]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {screen === "lobby" ? (
          <Lobby onRoomCreated={handleRoomCreated} onRoomJoined={handleRoomJoined} onGameStart={handleGameStart} />
        ) : screen === "game" && roomId ? (
          <GameScreen roomId={roomId} onLeaveGame={handleLeaveGame} />
        ) : (
          <div>Loading...</div>
        )}
      </div>
      <footer className="w-full py-4 px-4 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto flex justify-center items-center gap-2">
          <span className="text-sm text-muted-foreground">Powered by</span>
          <div className="bg-slate-900 dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-slate-700 dark:border-slate-600">
            <img 
              src="/convex_dark.svg" 
              alt="Convex" 
              className="h-6 opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App
