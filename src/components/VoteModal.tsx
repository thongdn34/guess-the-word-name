'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Player, VotingSession } from '@/types/game';

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayer: Player;
  votingSession: VotingSession;
  roomId: string;
}

export default function VoteModal({ 
  isOpen, 
  onClose, 
  players, 
  currentPlayer, 
  votingSession, 
  roomId 
}: VoteModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Check if current player has already voted
  useEffect(() => {
    if (votingSession && currentPlayer) {
      const playerVote = votingSession.votes.find(vote => vote.voterId === currentPlayer.id);
      setHasVoted(!!playerVote);
      if (playerVote) {
        setSelectedPlayerId(playerVote.votedForId);
      }
    }
  }, [votingSession, currentPlayer]);

  const handleVote = async () => {
    if (!selectedPlayerId || hasVoted || isVoting) return;

    setIsVoting(true);
    try {
      // Add vote to the voting session
      await addDoc(collection(db, 'rooms', roomId, 'votingSessions', votingSession.id, 'votes'), {
        voterId: currentPlayer.id,
        votedForId: selectedPlayerId,
        createdAt: serverTimestamp(),
      });

      setHasVoted(true);
      
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Prevent disabled players from accessing the modal
  if (currentPlayer.disabled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You are disabled from voting until the next round starts.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Vote for the Importer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close voting modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600">
            Who do you think is the imposter? Choose carefully!
          </p>
        </div>

        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
          {players
            .filter(player => player.id !== currentPlayer.id && !player.disabled) // Can't vote for yourself or disabled players
            .map((player) => (
              <label
                key={player.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedPlayerId === player.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="vote"
                  value={player.id}
                  checked={selectedPlayerId === player.id}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  disabled={hasVoted}
                  className="text-red-600 focus:ring-red-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{player.username}</span>
                  <span className="text-sm text-gray-500 ml-2">({player.score} pts)</span>
                </div>
              </label>
            ))}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleVote}
            disabled={!selectedPlayerId || hasVoted || isVoting}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isVoting ? 'Voting...' : hasVoted ? 'Vote Cast!' : 'Cast Vote'}
          </button>
          
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
          >
            {hasVoted ? 'Close' : 'Close'}
          </button>
        </div>

        {hasVoted && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm text-center">
              ✓ You have voted for {players.find(p => p.id === selectedPlayerId)?.username}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
