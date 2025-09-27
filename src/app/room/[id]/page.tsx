"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { createRoom } from "@/lib/firestore";
import Header from "@/components/Header";
import PlayerList from "@/components/PlayerList";
import WordCard from "@/components/WordCard";
import RoomControls from "@/components/RoomControls";
import RoundLog from "@/components/RoundLog";
import Scoreboard from "@/components/Scoreboard";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [username, setUsername] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const wordCardRef = useRef<HTMLDivElement>(null);
  const [previousRoundId, setPreviousRoundId] = useState<string | null>(null);
  const [showRoundLog, setShowRoundLog] = useState(false);

  const { gameState, loading, error } = useRoom(roomId);
  const { player, signOut: playerSignOut } = usePlayer(
    roomId,
    username,
    isHost
  );

  useEffect(() => {
    // Get username and host status from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedIsHost = localStorage.getItem("isHost") === "true";

    if (!storedUsername) {
      router.push("/");
      return;
    }

    setUsername(storedUsername);
    setIsHost(storedIsHost);
    setIsInitialized(true);
  }, [router]);

  // Initialize room and player when component mounts
  useEffect(() => {
    if (!isInitialized || !username) return;

    const initializeRoom = async () => {
      try {
        if (isHost) {
          // Create room if host
          await createRoom(roomId, "temp-host-id"); // Will be updated when player is created
        }
      } catch (error) {
        console.error("Error initializing room:", error);
      }
    };

    initializeRoom();
  }, [isInitialized, username, isHost, roomId]);

  useEffect(() => {
    if (player && gameState.room) {
      // Update isHost status based on actual room data
      setIsHost(player.isHost);
    }
  }, [player, gameState.room]);

  // Scroll to word card when a new round starts
  useEffect(() => {
    if (
      gameState.currentRound?.id &&
      gameState.currentRound.id !== previousRoundId &&
      gameState.room?.status === "in_round"
    ) {
      // Small delay to ensure the word card is rendered
      setTimeout(() => {
        if (wordCardRef.current) {
          wordCardRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });
        }
      }, 100);
      setPreviousRoundId(gameState.currentRound.id);
    }
  }, [gameState.currentRound?.id, gameState.room?.status, previousRoundId]);

  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState.room || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up player...</p>
        </div>
      </div>
    );
  }

  const isImporter =
    gameState.currentRound?.importerId === player.id &&
    gameState.currentRound?.importerId !== "pending";
  const currentWord = isImporter
    ? gameState.currentRound?.wordA
    : gameState.currentRound?.wordB;

  const handleSignOut = async () => {
    // Sign out the player (updates Firestore and clears localStorage)
    if (playerSignOut) {
      await playerSignOut();
    }

    // Clear other localStorage items
    localStorage.removeItem("username");
    localStorage.removeItem("isHost");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header roomId={roomId} player={player} onSignOut={handleSignOut} />

      {/* Host Controls - RoundLog Toggle */}
      {isHost && (
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Host Controls</h2>
              <button
                onClick={() => setShowRoundLog(!showRoundLog)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showRoundLog
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showRoundLog ? 'Hide' : 'Show'} Round History
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className={`grid grid-cols-1 gap-8 ${isHost && showRoundLog ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          {/* Left Column - Players and Controls */}
          <div className="space-y-6">
            <PlayerList
              players={gameState.players}
              currentPlayer={player}
              roomId={roomId}
              isHost={isHost}
            />

            {isHost && (
              <RoomControls
                room={gameState.room}
                currentRound={gameState.currentRound}
                players={gameState.players}
                roomId={roomId}
              />
            )}
          </div>

          {/* Center Column - Game Area */}
          <div className="space-y-6">
             {gameState.room.status === "in_round" &&
             gameState.currentRound &&
             currentWord ? (
               <WordCard ref={wordCardRef} word={currentWord} isImporter={isImporter} />
             ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  {gameState.room.status === "waiting"
                    ? "Waiting for host to start..."
                    : "Game finished"}
                </h3>
                <p className="text-gray-600">
                  {gameState.room.status === "waiting"
                    ? "The host will start the round when ready"
                    : "Thanks for playing!"}
                </p>
              </div>
            )}

            <Scoreboard players={gameState.players} />
          </div>

            {/* Right Column - Round Log (Host Only, Toggleable) */}
            {isHost && showRoundLog && (
              <div className="animate-fade-in">
                <RoundLog
                  rounds={gameState.rounds}
                  players={gameState.players}
                  isHost={isHost}
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
