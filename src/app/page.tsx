'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { checkUsernameExists, generateUsernameSuggestions, validateUsername, checkDisconnectedPlayer } from '@/lib/usernameUtils';

export default function Home() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const router = useRouter();

  // Check username availability when typing
  useEffect(() => {
    const checkUsername = async () => {
      if (!username.trim()) {
        setUsernameError('');
        setUsernameSuggestions([]);
        return;
      }

      const validation = validateUsername(username);
      if (!validation.isValid) {
        setUsernameError(validation.error || '');
        setUsernameSuggestions([]);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const exists = await checkUsernameExists(username.trim());
        if (exists) {
          setUsernameError('Username is already taken');
          setUsernameSuggestions(generateUsernameSuggestions(username.trim()));
        } else {
          setUsernameError('');
          setUsernameSuggestions([]);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameError('Error checking username availability');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsername, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || usernameError) return;

    setIsCreating(true);
    const newRoomId = uuidv4().substring(0, 8).toUpperCase();
    
    // Store username in localStorage for the room page
    localStorage.setItem('username', username.trim());
    localStorage.setItem('isHost', 'true');
    
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim() || usernameError) return;

    setIsJoining(true);
    
    try {
      // First check if there's a disconnected player with this username
      const disconnectedCheck = await checkDisconnectedPlayer(username.trim(), roomId.toUpperCase());
      
      if (disconnectedCheck.canRejoin) {
        // Store the existing player ID for rejoining
        localStorage.setItem('username', username.trim());
        localStorage.setItem('isHost', 'false');
        localStorage.setItem('rejoinPlayerId', disconnectedCheck.playerId || '');
        router.push(`/room/${roomId.toUpperCase()}`);
        return;
      }
      
      // If no disconnected player, check if username is taken by connected player
      const exists = await checkUsernameExists(username.trim(), roomId.toUpperCase());
      if (exists) {
        setUsernameError('Username is already taken in this room');
        setIsJoining(false);
        return;
      }
      
      // Store username in localStorage for the room page
      localStorage.setItem('username', username.trim());
      localStorage.setItem('isHost', 'false');
      
      router.push(`/room/${roomId.toUpperCase()}`);
    } catch (error) {
      console.error('Error checking username in room:', error);
      setUsernameError('Error checking username availability');
      setIsJoining(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUsername(suggestion);
    setUsernameSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guess the Word</h1>
          <p className="text-gray-600">Vietnamese word guessing game</p>
        </div>

        <form onSubmit={handleCreateRoom} className="mb-6">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                  usernameError 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300'
                }`}
                placeholder="Enter your username"
                required
                maxLength={20}
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            
            {usernameError && (
              <p className="mt-1 text-sm text-red-600">{usernameError}</p>
            )}
            
            {usernameSuggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                <div className="flex flex-wrap gap-2">
                  {usernameSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isCreating || !username.trim() || !!usernameError || isCheckingUsername}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <form onSubmit={handleJoinRoom}>
          <div className="mb-4">
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter room ID"
              required
              maxLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={isJoining || !username.trim() || !roomId.trim() || !!usernameError || isCheckingUsername}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Max 6 players per room</p>
        </div>
      </div>
    </div>
  );
}