import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Player, Round, GameState, VotingSession, Vote } from '@/types/game';

export function useRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    players: [],
    currentRound: null,
    rounds: [],
    isHost: false,
    currentPlayer: null,
    currentVotingSession: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const unsubscribeRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      (roomDoc) => {
        if (roomDoc.exists()) {
          const roomData = { id: roomDoc.id, ...roomDoc.data() } as Room;
          setGameState(prev => ({ ...prev, room: roomData }));
        } else {
          setError('Room not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to room:', err);
        setError('Failed to load room');
        setLoading(false);
      }
    );

    const unsubscribePlayers = onSnapshot(
      collection(db, 'rooms', roomId, 'players'),
      (playersSnapshot) => {
        const players = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Player));
        setGameState(prev => ({ ...prev, players }));
      },
      (err) => {
        console.error('Error listening to players:', err);
      }
    );

    const unsubscribeRounds = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'rounds'),
        orderBy('roundNumber', 'desc'),
        limit(1)
      ),
      (roundsSnapshot) => {
        if (!roundsSnapshot.empty) {
          const currentRound = {
            id: roundsSnapshot.docs[0].id,
            ...roundsSnapshot.docs[0].data()
          } as Round;
          setGameState(prev => ({ ...prev, currentRound }));
        }
      },
      (err) => {
        console.error('Error listening to rounds:', err);
      }
    );

    const unsubscribeAllRounds = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'rounds'),
        orderBy('roundNumber', 'desc')
      ),
      (roundsSnapshot) => {
        const rounds = roundsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Round));
        setGameState(prev => ({ ...prev, rounds }));
      },
      (err) => {
        console.error('Error listening to all rounds:', err);
      }
    );

    // Listen to active voting sessions
    let unsubscribeVotes: (() => void) | null = null;
    
    const unsubscribeVotingSessions = onSnapshot(
      query(
        collection(db, 'rooms', roomId, 'votingSessions'),
        orderBy('startedAt', 'desc'),
        limit(1)
      ),
      (votingSnapshot) => {
        if (!votingSnapshot.empty) {
          const votingSessionDoc = votingSnapshot.docs[0];
          const votingSessionData = {
            id: votingSessionDoc.id,
            ...votingSessionDoc.data()
          } as VotingSession;

          // Set voting session without votes initially
          setGameState(prev => ({ 
            ...prev, 
            currentVotingSession: {
              ...votingSessionData,
              votes: []
            }
          }));

          // Set up votes listener for this voting session
          if (unsubscribeVotes) {
            unsubscribeVotes();
          }
          
          unsubscribeVotes = onSnapshot(
            collection(db, 'rooms', roomId, 'votingSessions', votingSessionDoc.id, 'votes'),
            (votesSnapshot) => {
              const votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              } as Vote));

              setGameState(prev => {
                if (prev.currentVotingSession && prev.currentVotingSession.id === votingSessionDoc.id) {
                  return {
                    ...prev,
                    currentVotingSession: {
                      ...prev.currentVotingSession,
                      votes
                    }
                  };
                }
                return prev;
              });
            },
            (err) => {
              console.error('Error listening to votes:', err);
            }
          );
        } else {
          setGameState(prev => ({ ...prev, currentVotingSession: null }));
          if (unsubscribeVotes) {
            unsubscribeVotes();
            unsubscribeVotes = null;
          }
        }
      },
      (err) => {
        console.error('Error listening to voting sessions:', err);
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeRounds();
      unsubscribeAllRounds();
      unsubscribeVotingSessions();
      if (unsubscribeVotes) {
        unsubscribeVotes();
      }
    };
  }, [roomId]);

  return { gameState, loading, error };
}
