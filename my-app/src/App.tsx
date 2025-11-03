import { useState, useEffect } from 'react'
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

  const handleRoomCreated = (newRoomId: string) => {
    setRoomId(newRoomId as Id<"rooms">);
    // Stay in lobby - no need to navigate to waiting room
  };

  const handleRoomJoined = (newRoomId: string) => {
    setRoomId(newRoomId as Id<"rooms">);
    // Stay in lobby - no need to navigate to waiting room
  };

  const handleGameStart = (gameRoomId?: string) => {
    if (gameRoomId) {
      setRoomId(gameRoomId as Id<"rooms">);
    }
    setScreen("game");
  };

  const handleLeaveGame = () => {
    setRoomId("");
    setScreen("lobby");
  };

  // Check if player is already in a room when loading
  const playerToken = getPlayerToken();
  const playerRoom = useQuery(
    api.players.getPlayerRoom,
    playerToken ? { playerToken } : "skip"
  );

  // Set roomId if player is already in a room
  useEffect(() => {
    if (playerRoom && !roomId) {
      setRoomId(playerRoom._id);
      // If game has already started, redirect to game screen
      if (playerRoom.status === "playing" || playerRoom.status === "finished") {
        setScreen("game");
      }
    }
  }, [playerRoom, roomId]);

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
    }
  }, [room, screen]);

  if (screen === "lobby") {
    return <Lobby onRoomCreated={handleRoomCreated} onRoomJoined={handleRoomJoined} onGameStart={handleGameStart} />;
  }

  if (screen === "game" && roomId) {
    return <GameScreen roomId={roomId} onLeaveGame={handleLeaveGame} />;
  }

  return <div>Loading...</div>;
}

export default App
