import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Player, Round, GameState } from '@/types/game';

export function useRoom(roomId: string) {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    players: [],
    currentRound: null,
    rounds: [],
    isHost: false,
    currentPlayer: null,
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
          const currentRound = roundsSnapshot.docs[0].data() as Round;
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

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
      unsubscribeRounds();
      unsubscribeAllRounds();
    };
  }, [roomId]);

  return { gameState, loading, error };
}
