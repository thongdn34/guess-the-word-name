'use client';

import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  currentPlayer: Player;
  importerId?: string;
}

export default function PlayerList({ players, currentPlayer, importerId }: PlayerListProps) {
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
                <span className="font-medium text-gray-900">{player.username}</span>
                {player.isHost && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Host
                  </span>
                )}
                {player.id === importerId && importerId !== 'pending' && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Importer
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{player.score} pts</div>
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
