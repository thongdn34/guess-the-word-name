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

      // Find players with the highest vote count
      const maxVotes = Math.max(...Object.values(voteCounts));
      const playersWithMaxVotes = Object.keys(voteCounts).filter(
        playerId => voteCounts[playerId] === maxVotes
      );

      // Check if there's a tie (2 or more players with same highest votes)
      const isTie = playersWithMaxVotes.length >= 2;
      
      // If there's a tie, continue the round (don't disable anyone)
      if (isTie) {
        await updateDoc(doc(db, 'rooms', roomId, 'votingSessions', votingSession.id), {
          status: 'completed',
          endedAt: serverTimestamp(),
          winnerId: null, // No clear winner due to tie
          isImporter: false,
        });
        
        return { winnerId: null, isImporter: false, voteCounts, isTie: true };
      }

      // Single player with most votes
      const winnerId = playersWithMaxVotes[0];
      const isImporter = winnerId === currentRound.importerId;

      // Update voting session with results
      await updateDoc(doc(db, 'rooms', roomId, 'votingSessions', votingSession.id), {
        status: 'completed',
        endedAt: serverTimestamp(),
        winnerId,
        isImporter,
      });

      // If the imposter was found, end the round
      if (isImporter) {
        await runTransaction(db, async (transaction) => {
          // Update round to mark it as ended
          const roundRef = doc(db, 'rooms', roomId, 'rounds', currentRound.id);
          transaction.update(roundRef, {
            endedAt: serverTimestamp(),
            winnerIds: [winnerId], // The imposter wins
            winnerMarkedBy: 'voting_system',
          });

          // Update room status
          const roomRef = doc(db, 'rooms', roomId);
          transaction.update(roomRef, {
            status: 'waiting',
            currentRoundId: null,
          });
        });
      } else {
        // Imposter not found - disable the player with most votes
        await runTransaction(db, async (transaction) => {
          // Disable the player who got the most votes
          const playerRef = doc(db, 'rooms', roomId, 'players', winnerId);
          transaction.update(playerRef, {
            disabled: true,
          });
        });
      }

      return { winnerId, isImporter, voteCounts, isTie: false };
    } catch (error) {
      console.error('Error ending voting session:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const continueRoundAfterTie = async (roomId: string) => {
    setIsProcessing(true);
    try {
      // Reset room status to allow new voting
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'in_round',
      });
    } catch (error) {
      console.error('Error continuing round after tie:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const startNewRound = async (roomId: string, players: Player[]) => {
    setIsProcessing(true);
    try {
      // Re-enable all players for the new round
      await runTransaction(db, async (transaction) => {
        // Reset room status to allow new round
        const roomRef = doc(db, 'rooms', roomId);
        transaction.update(roomRef, {
          status: 'waiting',
          currentRoundId: null,
        });

        // Re-enable all players
        players.forEach(player => {
          const playerRef = doc(db, 'rooms', roomId, 'players', player.id);
          transaction.update(playerRef, {
            disabled: false,
          });
        });
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
    continueRoundAfterTie,
    isProcessing,
  };
}
