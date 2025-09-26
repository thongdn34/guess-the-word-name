'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsCreating(true);
    const newRoomId = uuidv4().substring(0, 8).toUpperCase();
    
    // Store username in localStorage for the room page
    localStorage.setItem('username', username);
    localStorage.setItem('isHost', 'true');
    
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !roomId.trim()) return;

    setIsJoining(true);
    
    // Store username in localStorage for the room page
    localStorage.setItem('username', username);
    localStorage.setItem('isHost', 'false');
    
    router.push(`/room/${roomId.toUpperCase()}`);
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
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username"
              required
              maxLength={20}
            />
          </div>
          
          <button
            type="submit"
            disabled={isCreating || !username.trim()}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter room ID"
              required
              maxLength={8}
            />
          </div>
          
          <button
            type="submit"
            disabled={isJoining || !username.trim() || !roomId.trim()}
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