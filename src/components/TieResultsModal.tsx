'use client';

import { Player, VotingSession } from '@/types/game';

interface TieResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueRound: () => void;
  players: Player[];
  votingSession: VotingSession;
  isHost: boolean;
}

export default function TieResultsModal({ 
  isOpen, 
  onClose, 
  onContinueRound,
  players, 
  votingSession,
  isHost 
}: TieResultsModalProps) {
  if (!isOpen) return null;

  // Count votes for each player
  const voteCounts = players.reduce((acc, player) => {
    const votes = votingSession.votes.filter(vote => vote.votedForId === player.id).length;
    return { ...acc, [player.id]: votes };
  }, {} as Record<string, number>);

  const sortedPlayers = [...players].sort((a, b) => voteCounts[b.id] - voteCounts[a.id]);
  const maxVotes = Math.max(...Object.values(voteCounts));
  const tiedPlayers = players.filter(player => voteCounts[player.id] === maxVotes);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
        <div className="text-center mb-6">
          <div className="text-yellow-500 text-6xl mb-4">🤝</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tie Vote!
          </h2>
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4">
            <p className="text-xl font-semibold text-yellow-800">
              Multiple players tied with {maxVotes} vote{maxVotes !== 1 ? 's' : ''}!
            </p>
            <p className="text-lg mt-2 text-yellow-700">
              The round continues - no one is disabled.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tied Players:</h3>
          {tiedPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="font-medium text-yellow-800">{player.username}</span>
              <span className="text-sm font-medium text-yellow-600">
                {voteCounts[player.id]} vote{voteCounts[player.id] !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">All Vote Results:</h3>
          {sortedPlayers.map((player) => {
            const isTied = voteCounts[player.id] === maxVotes;
            return (
              <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${
                isTied ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${isTied ? 'text-yellow-800' : 'text-gray-900'}`}>
                    {player.username}
                  </span>
                  {isTied && (
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                      TIED
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {voteCounts[player.id]} vote{voteCounts[player.id] !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
          
          {isHost && (
            <button
              onClick={onContinueRound}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue Round
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
