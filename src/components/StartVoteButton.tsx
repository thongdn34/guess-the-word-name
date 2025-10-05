'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Round, Player, VotingSession } from '@/types/game';

interface StartVoteButtonProps {
  currentRound: Round | null;
  players: Player[];
  roomId: string;
  isHost: boolean;
  currentVotingSession: VotingSession | null;
  onEndVoting?: () => void;
}

export default function StartVoteButton({ 
  currentRound, 
  players, 
  roomId, 
  isHost, 
  currentVotingSession, 
  onEndVoting 
}: StartVoteButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const startVoting = async () => {
    if (!currentRound || !isHost) return;
    
    setIsStarting(true);
    try {
      // Create a new voting session
      await addDoc(collection(db, 'rooms', roomId, 'votingSessions'), {
        roundId: currentRound.id,
        status: 'active',
        votes: [],
        startedAt: serverTimestamp(),
      });
      
    } catch (error) {
      console.error('Error starting voting:', error);
      alert('Failed to start voting. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

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

  const canStartVoting = currentRound && 
    currentRound.startedAt && 
    !currentRound.winnerIds && 
    !currentRound.winnerId && 
    players.length >= 2 &&
    !currentVotingSession;

  const canEndVoting = currentVotingSession && 
    currentVotingSession.status === 'active' && 
    currentVotingSession.votes.length > 0;
    
  if (!isHost) {
    return null;
  }

  if (canStartVoting) {
    return (
      <button
        onClick={startVoting}
        disabled={isStarting}
        className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isStarting ? 'Starting Vote...' : 'Start Vote to Find Importer'}
      </button>
    );
  }

  if (canEndVoting) {
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

  return null;
}
