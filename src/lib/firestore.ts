import { doc, setDoc, updateDoc, serverTimestamp, runTransaction, deleteDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
// Types are used in function signatures but not in the implementation

export async function createRoom(roomId: string, hostId: string, roomName?: string): Promise<void> {
  const roomDoc: Record<string, unknown> = {
    id: roomId,
    hostId,
    createdAt: serverTimestamp(),
    status: 'waiting',
  };
  
  // Only include name if it's provided
  if (roomName) {
    roomDoc.name = roomName;
  }
  
  await setDoc(doc(db, 'rooms', roomId), roomDoc);
}

export async function addPlayerToRoom(
  roomId: string, 
  playerId: string, 
  username: string, 
  isHost: boolean = false
): Promise<void> {
  await setDoc(doc(db, 'rooms', roomId, 'players', playerId), {
    id: playerId,
    username,
    score: 0,
    joinedAt: serverTimestamp(),
    isHost,
    connected: true,
  });
}

export async function updatePlayerConnection(
  roomId: string, 
  playerId: string, 
  connected: boolean
): Promise<void> {
  const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
  await updateDoc(playerRef, { connected });
}

export async function transferHost(roomId: string, newHostId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  
  await runTransaction(db, async (transaction) => {
    // Update room host
    transaction.update(roomRef, { hostId: newHostId });
    
    // Update player roles
    const oldHostRef = doc(db, 'rooms', roomId, 'players', newHostId);
    transaction.update(oldHostRef, { isHost: true });
  });
}

export async function updateRoomStatus(roomId: string, status: 'waiting' | 'in_round' | 'finished'): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, { status });
}

export async function removePlayer(roomId: string, playerId: string, hostId: string): Promise<void> {
  const playerRef = doc(db, 'rooms', roomId, 'players', playerId);
  const roomRef = doc(db, 'rooms', roomId);
  
  await runTransaction(db, async (transaction) => {
    // Get player data to check if they're the host
    const playerDoc = await transaction.get(playerRef);
    
    if (!playerDoc.exists()) {
      throw new Error('Player not found');
    }
    
    const playerData = playerDoc.data();
    
    // If removing the host, transfer host to another connected player
    if (playerData.isHost) {
      // Find another connected player to transfer host to
      const playersRef = collection(db, 'rooms', roomId, 'players');
      const connectedPlayersQuery = query(playersRef, where('connected', '==', true));
      const connectedPlayersSnapshot = await getDocs(connectedPlayersQuery);
      
      const otherConnectedPlayers = connectedPlayersSnapshot.docs.filter(doc => doc.id !== playerId);
      
      if (otherConnectedPlayers.length > 0) {
        const newHostId = otherConnectedPlayers[0].id;
        transaction.update(roomRef, { hostId: newHostId });
        transaction.update(doc(db, 'rooms', roomId, 'players', newHostId), { isHost: true });
      } else {
        // No other connected players, delete the room
        transaction.delete(roomRef);
      }
    }
    
    // Remove the player
    transaction.delete(playerRef);
  });
}
