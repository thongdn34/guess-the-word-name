'use client';

import { useState } from 'react';
import { Player } from '@/types/game';
import { removePlayer } from '@/lib/firestore';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  roomId: string;
  isHost: boolean;
}

export default function PlayerList({ players, currentPlayer, roomId, isHost }: PlayerListProps) {
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);

  const handleRemovePlayer = async (playerId: string, playerUsername: string) => {
    if (!isHost) return;
    
    const confirmed = window.confirm(`Are you sure you want to remove ${playerUsername} from the room?`);
    if (!confirmed) return;

    setRemovingPlayer(playerId);
    try {
      await removePlayer(roomId, playerId, currentPlayer.id);
    } catch (error) {
      console.error('Error removing player:', error);
      alert('Failed to remove player. Please try again.');
    } finally {
      setRemovingPlayer(null);
    }
  };
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Players ({players.length}/6)</h3>
      
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              player.id === currentPlayer.id
                ? 'bg-blue-50 border-2 border-blue-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  player.connected ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`font-medium ${player.disabled ? 'text-red-600' : 'text-gray-900'}`}>
                  {player.username}
                </span>
                {player.isHost && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Host
                  </span>
                )}
                {player.disabled && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Disabled
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{player.score} pts</div>
              </div>
              
              {/* Remove button for host (can't remove self) */}
              {isHost && player.id !== currentPlayer.id && (
                <button
                  onClick={() => handleRemovePlayer(player.id, player.username)}
                  disabled={removingPlayer === player.id}
                  className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removingPlayer === player.id ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {players.length === 0 && (
        <p className="text-gray-500 text-center py-4">No players yet</p>
      )}
    </div>
  );
}
