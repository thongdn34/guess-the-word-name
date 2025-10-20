'use client';

import { Player, VotingSession } from '@/types/game';

interface VoteResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewRound: () => void;
  players: Player[];
  votingSession: VotingSession;
  isHost: boolean;
}

export default function VoteResultsModal({ 
  isOpen, 
  onClose, 
  onStartNewRound,
  players, 
  votingSession,
  isHost 
}: VoteResultsModalProps) {
  if (!isOpen || !votingSession.winnerId) return null;

  const winner = players.find(p => p.id === votingSession.winnerId);
  const isImporter = votingSession.isImporter;

  // Count votes for each player
  const voteCounts = players.reduce((acc, player) => {
    const votes = votingSession.votes.filter(vote => vote.votedForId === player.id).length;
    return { ...acc, [player.id]: votes };
  }, {} as Record<string, number>);

  const sortedPlayers = [...players].sort((a, b) => voteCounts[b.id] - voteCounts[a.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Voting Results
          </h2>
          <div className={`p-4 rounded-lg ${isImporter ? 'bg-red-100 border-2 border-red-300' : 'bg-green-100 border-2 border-green-300'}`}>
            <p className={`text-xl font-semibold ${isImporter ? 'text-red-800' : 'text-green-800'}`}>
              {isImporter ? '🎯 Correct! The importer was found!' : '❌ Wrong! The importer is still hidden!'}
            </p>
            <p className="text-lg mt-2">
              Most votes: <span className="font-bold text-black">{winner?.username}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Vote Breakdown:</h3>
          {sortedPlayers.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{player.username}</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(voteCounts[player.id] / Math.max(...Object.values(voteCounts), 1)) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-8">
                  {voteCounts[player.id]} vote{voteCounts[player.id] !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
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
              onClick={onStartNewRound}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start New Round
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
