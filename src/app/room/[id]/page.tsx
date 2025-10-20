"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { usePlayer } from "@/hooks/usePlayer";
import { useVoting } from "@/hooks/useVoting";
import { createRoom } from "@/lib/firestore";
import Header from "@/components/Header";
import PlayerList from "@/components/PlayerList";
import WordCard from "@/components/WordCard";
import RoomControls from "@/components/RoomControls";
import RoundLog from "@/components/RoundLog";
import Scoreboard from "@/components/Scoreboard";
import VoteModal from "@/components/VoteModal";
import VoteResultsModal from "@/components/VoteResultsModal";

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
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showVoteResults, setShowVoteResults] = useState(false);

  const { gameState, loading, error } = useRoom(roomId);
  const { player, signOut: playerSignOut } = usePlayer(
    roomId,
    username,
    isHost
  );
  const { endVotingSession, startNewRound } = useVoting();

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

  const handleEndVoting = useCallback(async () => {
    if (!gameState.currentVotingSession || !gameState.currentRound || !gameState.players) return;
    
    try {
      await endVotingSession(
        roomId,
        gameState.currentVotingSession,
        gameState.players,
        gameState.currentRound
      );
      
      setShowVoteModal(false);
      setShowVoteResults(true);
    } catch (error) {
      console.error('Error ending voting:', error);
      alert('Failed to end voting. Please try again.');
    }
  }, [gameState.currentVotingSession, gameState.currentRound, gameState.players, endVotingSession, roomId]);

  // Handle voting session changes
  useEffect(() => {
    if (gameState.currentVotingSession) {
      const { currentVotingSession, players } = gameState;
      
      // Auto-end voting when all players have voted
      if (currentVotingSession.status === 'active' && 
          currentVotingSession.votes.length >= players.length) {
        handleEndVoting();
      }
    } else {
      setShowVoteModal(false);
      setShowVoteResults(false);
    }
  }, [gameState, showVoteModal, handleEndVoting]);

  // Close vote modal if player becomes disabled
  useEffect(() => {
    if (player?.disabled && showVoteModal) {
      setShowVoteModal(false);
    }
  }, [player?.disabled, showVoteModal]);

  const handleStartNewRound = async () => {
    try {
      await startNewRound(roomId, gameState.players);
      setShowVoteResults(false);
    } catch (error) {
      console.error('Error starting new round:', error);
      alert('Failed to start new round. Please try again.');
    }
  };

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
      <Header roomId={roomId} player={player} onSignOut={handleSignOut} onLeave={handleSignOut} />

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

            {/* Vote Toggle Button */}
            {gameState.currentVotingSession && gameState.currentVotingSession.status === 'active' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Voting</h3>
                {(() => {
                  const hasVoted = gameState.currentVotingSession?.votes.some(vote => vote.voterId === player.id) || false;
                  const isDisabled = player.disabled;
                  
                  if (isDisabled) {
                    return (
                      <>
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-lg font-medium bg-gray-300 text-gray-500 cursor-not-allowed"
                        >
                          Voting Disabled
                        </button>
                        <p className="text-sm text-red-600 mt-2 text-center">
                          You are disabled from voting until the next round starts
                        </p>
                      </>
                    );
                  }
                  
                  return (
                    <>
                      <button
                        onClick={() => {
                          if (!player.disabled) {
                            setShowVoteModal(!showVoteModal);
                          }
                        }}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                          showVoteModal
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {showVoteModal ? 'Close Vote Modal' : 'Open Vote Modal'}
                        {hasVoted && !showVoteModal && (
                          <span className="ml-2 text-green-200">✓</span>
                        )}
                      </button>
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        {showVoteModal 
                          ? 'Click to close the voting interface' 
                          : hasVoted 
                            ? 'You have voted. Click to view voting interface'
                            : 'Click to open the voting interface'
                        }
                      </p>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Disabled Player Notice */}
            {player.disabled && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-3">🚫</div>
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    You Are Disabled
                  </h3>
                  <p className="text-red-600 mb-4">
                    You cannot participate in voting or other game actions until the next round starts.
                  </p>
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> You received the most votes in the previous voting session.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isHost && (
              <RoomControls
                room={gameState.room}
                currentRound={gameState.currentRound}
                players={gameState.players}
                roomId={roomId}
                currentVotingSession={gameState.currentVotingSession}
                onEndVoting={handleEndVoting}
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

      {/* Voting Modals */}
      {gameState.currentVotingSession && player && (
        <>
          <VoteModal
            isOpen={showVoteModal}
            onClose={() => setShowVoteModal(false)}
            players={gameState.players}
            currentPlayer={player}
            votingSession={gameState.currentVotingSession}
            roomId={roomId}
          />
          
          <VoteResultsModal
            isOpen={showVoteResults}
            onClose={() => setShowVoteResults(false)}
            onStartNewRound={handleStartNewRound}
            players={gameState.players}
            votingSession={gameState.currentVotingSession}
            isHost={isHost}
          />
        </>
      )}
    </div>
  );
}
