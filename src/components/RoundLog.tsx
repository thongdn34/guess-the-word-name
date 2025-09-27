'use client';

import { useState } from 'react';
import { Round, Player } from '@/types/game';

interface RoundLogProps {
  rounds: Round[];
  players: Player[];
  isHost: boolean;
}

export default function RoundLog({ rounds, players, isHost }: RoundLogProps) {
  const [showImporter, setShowImporter] = useState(false);
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.username || 'Unknown';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Round History</h3>
        {isHost && (
          <button
            onClick={() => setShowImporter(!showImporter)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              showImporter
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showImporter ? 'Hide' : 'Show'} Importer
          </button>
        )}
      </div>
      
      {rounds.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No rounds yet</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {rounds.map((round) => (
            <div key={round.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Round {round.roundNumber}</span>
                <span className="text-sm text-gray-500">
                  {formatDate(round.createdAt)}
                </span>
              </div>
              
              <div className="space-y-2">
                {showImporter && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Importer:</span>
                    <span className="font-medium">{getPlayerName(round.importerId)}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm font-medium">{round.wordA}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm font-medium">{round.wordB}</span>
                  </div>
                </div>
                
                {round.winnerId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Winner:</span>
                    <span className="font-medium text-green-600">
                      {getPlayerName(round.winnerId)} (+50 pts)
                    </span>
                  </div>
                )}
                
                {round.endedAt && !round.winnerId && (
                  <div className="text-sm text-gray-500">
                    Round ended without winner
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
