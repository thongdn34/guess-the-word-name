import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VotingSession, Player, Round } from '@/types/game';

export function useVoting() {
  const [isProcessing, setIsProcessing] = useState(false);

  const endVotingSession = async (
    roomId: string, 
    votingSession: VotingSession, 
    players: Player[], 
    currentRound: Round
  ) => {
    setIsProcessing(true);
    try {
      // Count votes for each player
      const voteCounts = players.reduce((acc, player) => {
        const votes = votingSession.votes.filter(vote => vote.votedForId === player.id).length;
        return { ...acc, [player.id]: votes };
      }, {} as Record<string, number>);

      // Find player with most votes
      const winnerId = Object.keys(voteCounts).reduce((a, b) => 
        voteCounts[a] > voteCounts[b] ? a : b
      );

      // Check if winner is the importer
      const isImporter = winnerId === currentRound.importerId;

      // Update voting session with results
      await updateDoc(doc(db, 'rooms', roomId, 'votingSessions', votingSession.id), {
        status: 'completed',
        endedAt: serverTimestamp(),
        winnerId,
        isImporter,
      });

      // If the importer was found, end the round
      if (isImporter) {
        await runTransaction(db, async (transaction) => {
          // Update round to mark it as ended
          const roundRef = doc(db, 'rooms', roomId, 'rounds', currentRound.id);
          transaction.update(roundRef, {
            endedAt: serverTimestamp(),
            winnerIds: [winnerId], // The importer wins
            winnerMarkedBy: 'voting_system',
          });

          // Update room status
          const roomRef = doc(db, 'rooms', roomId);
          transaction.update(roomRef, {
            status: 'waiting',
            currentRoundId: null,
          });
        });
      }

      return { winnerId, isImporter, voteCounts };
    } catch (error) {
      console.error('Error ending voting session:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewRound = async (roomId: string) => {
    setIsProcessing(true);
    try {
      // Reset room status to allow new round
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'waiting',
        currentRoundId: null,
      });
    } catch (error) {
      console.error('Error starting new round:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    endVotingSession,
    startNewRound,
    isProcessing,
  };
}
