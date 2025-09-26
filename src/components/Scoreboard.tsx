'use client';

import { Player } from '@/types/game';

interface ScoreboardProps {
  players: Player[];
}

export default function Scoreboard({ players }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Scoreboard</h3>
      
      <div className="space-y-3">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              index === 0 && player.score > 0
                ? 'bg-yellow-50 border-2 border-yellow-200'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 && player.score > 0
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-300 text-gray-700'
              }`}>
                {index + 1}
              </div>
              <span className="font-medium text-gray-900">{player.username}</span>
              {index === 0 && player.score > 0 && (
                <span className="text-yellow-600 text-sm font-medium">👑</span>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{player.score}</div>
              <div className="text-xs text-gray-500">points</div>
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
