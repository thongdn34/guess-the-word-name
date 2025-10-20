'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VotingSession } from '@/types/game';

interface EndVoteButtonProps {
  currentVotingSession: VotingSession | null;
  roomId: string;
  isHost: boolean;
  onEndVoting?: () => void;
}

export default function EndVoteButton({ 
  currentVotingSession, 
  roomId, 
  isHost, 
  onEndVoting 
}: EndVoteButtonProps) {
  const [isEnding, setIsEnding] = useState(false);

  const endVoting = async () => {
    if (!currentVotingSession || !isHost) return;
    
    setIsEnding(true);
    try {
      // Update voting session to completed
      await updateDoc(doc(db, 'rooms', roomId, 'votingSessions', currentVotingSession.id), {
        status: 'completed',
        endedAt: serverTimestamp(),
      });
      
      if (onEndVoting) {
        onEndVoting();
      }
      
    } catch (error) {
      console.error('Error ending voting:', error);
      alert('Failed to end voting. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  const canEndVoting = currentVotingSession && 
    currentVotingSession.status === 'active' && 
    currentVotingSession.votes.length > 0;
    
  if (!isHost || !canEndVoting) {
    return null;
  }

  return (
    <button
      onClick={endVoting}
      disabled={isEnding}
      className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isEnding ? 'Ending Vote...' : 'End Vote Now'}
    </button>
  );
}
