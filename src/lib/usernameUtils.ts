import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function checkUsernameExists(username: string, roomId?: string): Promise<boolean> {
  try {
    // If roomId is provided, check only in that room
    if (roomId) {
      const playersRef = collection(db, 'rooms', roomId, 'players');
      const q = query(playersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      
      // Check if any connected player has this username
      const connectedPlayer = querySnapshot.docs.find(doc => doc.data().connected === true);
      return !!connectedPlayer;
    }
    
    // If no roomId, check across all rooms (for create room)
    // This is a simplified check - in a real app you might want to check globally
    return false;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

export function generateUsernameSuggestions(baseUsername: string): string[] {
  const suggestions: string[] = [];
  const base = baseUsername.toLowerCase().trim();
  
  // Add numbers
  for (let i = 1; i <= 5; i++) {
    suggestions.push(`${base}${i}`);
  }
  
  // Add common suffixes
  const suffixes = ['_new', '_player', '_gamer', '_user', '_guest'];
  suffixes.forEach(suffix => {
    suggestions.push(`${base}${suffix}`);
  });
  
  // Add random numbers
  for (let i = 0; i < 3; i++) {
    const randomNum = Math.floor(Math.random() * 1000);
    suggestions.push(`${base}${randomNum}`);
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}

export async function checkDisconnectedPlayer(username: string, roomId: string): Promise<{ canRejoin: boolean; playerId?: string }> {
  try {
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const q = query(playersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    const disconnectedPlayer = querySnapshot.docs.find(doc => 
      doc.data().username === username && doc.data().connected === false
    );
    
    if (disconnectedPlayer) {
      return { canRejoin: true, playerId: disconnectedPlayer.id };
    }
    
    return { canRejoin: false };
  } catch (error) {
    console.error('Error checking disconnected player:', error);
    return { canRejoin: false };
  }
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Username must be at least 2 characters' };
  }
  
  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters' };
  }
  
  // Check for valid characters (letters, numbers, underscores, hyphens)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
}
