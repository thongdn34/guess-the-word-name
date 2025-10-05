'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Player } from '@/types/game';

interface RoomWithPlayers extends Room {
  players: Player[];
  playerCount: number;
}

interface RoomListProps {
  onJoinRoom: (roomId: string) => void;
}

export default function RoomList({ onJoinRoom }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to all rooms
    const unsubscribeRooms = onSnapshot(
      query(
        collection(db, 'rooms'),
        orderBy('createdAt', 'desc')
      ),
      async (roomsSnapshot) => {
        const roomsData: RoomWithPlayers[] = [];
        
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = {
            id: roomDoc.id,
            ...roomDoc.data()
          } as Room;

          // Get players for this room
          const playersCollection = collection(db, 'rooms', roomDoc.id, 'players');
          const playersSnapshot = await getDocs(playersCollection);
          const players = playersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Player));

          // Only show rooms that are not finished and have players
          if (roomData.status !== 'finished' && players.length > 0) {
            roomsData.push({
              ...roomData,
              players,
              playerCount: players.length
            });
          }
        }

        setRooms(roomsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to rooms:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRooms();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-green-100 text-green-800';
      case 'in_round':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting for players';
      case 'in_round':
        return 'Game in progress';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">No rooms available. Create a new room to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-medium text-gray-900">Room {room.id}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                    {getStatusText(room.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{room.playerCount} player{room.playerCount !== 1 ? 's' : ''}</span>
                  <span>Created {new Date(room.createdAt.seconds * 1000).toLocaleTimeString()}</span>
                </div>
                {room.players.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Players:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.players.slice(0, 4).map((player) => (
                        <span
                          key={player.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {player.username}
                          {player.isHost && ' (Host)'}
                        </span>
                      ))}
                      {room.players.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{room.players.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => onJoinRoom(room.id)}
                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
