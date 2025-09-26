'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { usePlayer } from '@/hooks/usePlayer';
import { createRoom } from '@/lib/firestore';
import Header from '@/components/Header';
import PlayerList from '@/components/PlayerList';
import WordCard from '@/components/WordCard';
import RoomControls from '@/components/RoomControls';
import RoundLog from '@/components/RoundLog';
import Scoreboard from '@/components/Scoreboard';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [username, setUsername] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { gameState, loading, error } = useRoom(roomId);
  const { player } = usePlayer(roomId, username, isHost);

  useEffect(() => {
    // Get username and host status from localStorage
    const storedUsername = localStorage.getItem('username');
    const storedIsHost = localStorage.getItem('isHost') === 'true';
    
    if (!storedUsername) {
      router.push('/');
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
          await createRoom(roomId, 'temp-host-id'); // Will be updated when player is created
        }
      } catch (error) {
        console.error('Error initializing room:', error);
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
            onClick={() => router.push('/')}
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

  const isImporter = gameState.currentRound?.importerId === player.id && gameState.currentRound?.importerId !== 'pending';
  const currentWord = isImporter ? gameState.currentRound?.wordA : gameState.currentRound?.wordB;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header roomId={roomId} player={player} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Players and Controls */}
          <div className="space-y-6">
            <PlayerList 
              players={gameState.players} 
              currentPlayer={player}
              importerId={gameState.currentRound?.importerId}
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
            {gameState.room.status === 'in_round' && gameState.currentRound && currentWord ? (
              <WordCard
                word={currentWord}
                isImporter={isImporter}
                importerName={gameState.players.find(p => p.id === gameState.currentRound?.importerId)?.username || 'Unknown'}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  {gameState.room.status === 'waiting' ? 'Waiting for host to start...' : 'Game finished'}
                </h3>
                <p className="text-gray-600">
                  {gameState.room.status === 'waiting' 
                    ? 'The host will start the round when ready'
                    : 'Thanks for playing!'
                  }
                </p>
              </div>
            )}
            
            <Scoreboard players={gameState.players} />
          </div>

          {/* Right Column - Round Log */}
          <div>
            <RoundLog rounds={gameState.rounds} players={gameState.players} />
          </div>
        </div>
      </div>
    </div>
  );
}
