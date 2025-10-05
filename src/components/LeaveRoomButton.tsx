'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Player } from '@/types/game';

interface LeaveRoomButtonProps {
  roomId: string;
  player: Player;
  onLeave?: () => void;
}

export default function LeaveRoomButton({ roomId, player, onLeave }: LeaveRoomButtonProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const router = useRouter();

  const handleLeaveRoom = async () => {
    if (!confirm('Are you sure you want to leave the room?')) {
      return;
    }

    setIsLeaving(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Get all players in the room
        const playersCollection = collection(db, 'rooms', roomId, 'players');
        const playersSnapshot = await getDocs(playersCollection);
        const players = playersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Player));

        // Remove the current player
        const playerRef = doc(db, 'rooms', roomId, 'players', player.id);
        transaction.delete(playerRef);

        // If the leaving player is the host, transfer host to another player
        if (player.isHost && players.length > 1) {
          const remainingPlayers = players.filter(p => p.id !== player.id);
          if (remainingPlayers.length > 0) {
            // Transfer host to the first remaining player
            const newHostRef = doc(db, 'rooms', roomId, 'players', remainingPlayers[0].id);
            transaction.update(newHostRef, { isHost: true });
            
            // Update room hostId
            const roomRef = doc(db, 'rooms', roomId);
            transaction.update(roomRef, { hostId: remainingPlayers[0].id });
          }
        }

        // If no players left, mark room as finished
        if (players.length <= 1) {
          const roomRef = doc(db, 'rooms', roomId);
          transaction.update(roomRef, { 
            status: 'finished',
            currentRoundId: null 
          });
        }
      });
      
      // Clear localStorage (but keep username for convenience)
      localStorage.removeItem('isHost');
      localStorage.removeItem('rejoinPlayerId');
      
      // Call custom leave handler if provided
      if (onLeave) {
        onLeave();
      }
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      alert('Failed to leave room. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <button
      onClick={handleLeaveRoom}
      disabled={isLeaving}
      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLeaving ? 'Leaving...' : 'Leave Room'}
    </button>
  );
}
