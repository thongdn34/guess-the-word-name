import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Player } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';
import { createRoom } from '@/lib/firestore';

export function usePlayer(roomId: string, username: string, isHost: boolean = false) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !username) return;

    const initializePlayer = async () => {
      try {
        // Check if player already exists in localStorage
        const storageKey = `player_${roomId}_${username}`;
        let playerId = localStorage.getItem(storageKey);
        let playerExists = false;

        // Check for rejoin player ID from localStorage
        const rejoinPlayerId = localStorage.getItem('rejoinPlayerId');
        if (rejoinPlayerId) {
          playerId = rejoinPlayerId;
          localStorage.removeItem('rejoinPlayerId'); // Clean up
        }

        // If we have a stored player ID, check if it still exists in Firestore
        if (playerId) {
          const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
          const playerDoc = await getDoc(playerRef);
          
          if (playerDoc.exists()) {
            const existingPlayer = playerDoc.data() as Player;
            // Check if the username matches (in case user changed username)
            if (existingPlayer.username === username) {
              playerExists = true;
              // Update connection status
              await updateDoc(playerRef, { connected: true });
            } else {
              // Username changed, clear the stored ID and create new player
              localStorage.removeItem(storageKey);
              playerId = null;
            }
          } else {
            // Player doesn't exist anymore, clear the stored ID
            localStorage.removeItem(storageKey);
            playerId = null;
          }
        }

        // If no existing player, create a new one
        if (!playerExists) {
          playerId = uuidv4();
          localStorage.setItem(storageKey, playerId);

          // If host, create room first
          if (isHost) {
            await createRoom(roomId, playerId);
          }

          // Create player document
          const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
          await setDoc(playerRef, {
            id: playerId,
            username,
            score: 0,
            joinedAt: serverTimestamp(),
            isHost,
            connected: true,
          });
        }

        // Set up listener for player updates
        const playerRef = doc(db, 'rooms', roomId, 'players', playerId!);
        const unsubscribe = onSnapshot(playerRef, (doc) => {
          if (doc.exists()) {
            const playerData = { id: doc.id, ...doc.data() } as Player;
            setPlayer(playerData);
            setLoading(false);
          }
        }, (err) => {
          console.error('Error listening to player:', err);
          setError('Failed to load player data');
          setLoading(false);
        });

        return () => {
          unsubscribe();
          // Mark player as disconnected when leaving
          updateDoc(playerRef, { connected: false }).catch(console.error);
          // Clean up localStorage when leaving
          localStorage.removeItem(storageKey);
        };
      } catch (err) {
        console.error('Error initializing player:', err);
        setError('Failed to join room');
        setLoading(false);
      }
    };

    initializePlayer();
  }, [roomId, username, isHost]);

  const updateScore = async (newScore: number) => {
    if (!player) return;
    
    const playerRef = doc(db, 'rooms', roomId, 'players', player.id);
    try {
      await updateDoc(playerRef, { score: newScore });
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  const clearPlayerData = () => {
    const storageKey = `player_${roomId}_${username}`;
    localStorage.removeItem(storageKey);
  };

  const signOut = async () => {
    if (!player) return;

    try {
      // Mark player as disconnected in Firestore
      const playerRef = doc(db, 'rooms', roomId, 'players', player.id);
      await updateDoc(playerRef, { connected: false });
      
      // Clear localStorage
      clearPlayerData();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { player, loading, error, updateScore, clearPlayerData, signOut };
}
