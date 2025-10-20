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
  if (!isOpen) return null;

  const winner = votingSession.winnerId ? players.find(p => p.id === votingSession.winnerId) : null;
  const isImporter = votingSession.isImporter;
  const isTie = !votingSession.winnerId;

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
          <div className={`p-4 rounded-lg ${
            isTie 
              ? 'bg-yellow-100 border-2 border-yellow-300' 
              : isImporter 
                ? 'bg-red-100 border-2 border-red-300' 
                : 'bg-green-100 border-2 border-green-300'
          }`}>
            <p className={`text-xl font-semibold ${
              isTie 
                ? 'text-yellow-800' 
                : isImporter 
                  ? 'text-red-800' 
                  : 'text-green-800'
            }`}>
              {isTie 
                ? '🤝 Tie! Round continues...' 
                : isImporter 
                  ? '🎯 Correct! The imposter was found!' 
                  : '❌ Wrong! The imposter is still hidden!'
              }
            </p>
            {!isTie && winner && (
              <p className="text-lg mt-2">
                Most votes: <span className="font-bold text-black">{winner.username}</span>
                {!isImporter && (
                  <span className="block text-sm text-gray-600 mt-1">
                    {winner.username} is disabled from voting until next round
                  </span>
                )}
              </p>
            )}
            {isTie && (
              <p className="text-lg mt-2">
                Multiple players tied with the highest votes. Round continues!
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Vote Breakdown:</h3>
          {sortedPlayers.map((player) => {
            const maxVotes = Math.max(...Object.values(voteCounts), 1);
            const votePercentage = (voteCounts[player.id] / maxVotes) * 100;
            
            return (
              <div key={player.id} className={`flex items-center justify-between p-3 rounded-lg ${
                player.disabled ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${player.disabled ? 'text-red-800' : 'text-gray-900'}`}>
                    {player.username}
                  </span>
                  {player.disabled && (
                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                      DISABLED
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: votePercentage + '%' 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {voteCounts[player.id]} vote{voteCounts[player.id] !== 1 ? 's' : ''}
                  </span>
                </div>
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
