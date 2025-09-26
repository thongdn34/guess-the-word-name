import { doc, setDoc, updateDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
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
