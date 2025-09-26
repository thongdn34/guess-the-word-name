'use client';

import { Player } from '@/types/game';

interface HeaderProps {
  roomId: string;
  player: Player;
}

export default function Header({ roomId, player }: HeaderProps) {
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
          </div>
        </div>
      </div>
    </header>
  );
}
