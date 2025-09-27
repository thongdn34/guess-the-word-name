'use client';

import { useRouter } from 'next/navigation';
import { Player } from '@/types/game';

interface HeaderProps {
  roomId: string;
  player: Player;
  onSignOut?: () => void;
}

export default function Header({ roomId, player, onSignOut }: HeaderProps) {
  const router = useRouter();

  const handleSignOut = () => {
    // Clear localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('isHost');
    
    // Call custom sign out handler if provided
    if (onSignOut) {
      onSignOut();
    }
    
    // Redirect to home page
    router.push('/');
  };
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Guess the Word</h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Room: {roomId}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Playing as</p>
              <p className="font-medium text-gray-900">
                {player.username}
                {player.isHost && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Host
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
