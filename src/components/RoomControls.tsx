'use client';

import { useState } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Player, Round } from '@/types/game';

interface RoomControlsProps {
  room: Room;
  currentRound: Round | null;
  players: Player[];
  roomId: string;
}

export default function RoomControls({ room, currentRound, players, roomId }: RoomControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMarkingWinner, setIsMarkingWinner] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string>('');

  const generateWords = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, language: 'vi' }),
      });
      
      if (!response.ok) throw new Error('Failed to generate words');
      
      const { wordA, wordB } = await response.json();
      
      // Create a new round with generated words
      const roundRef = await addDoc(collection(db, 'rooms', roomId, 'rounds'), {
        roundNumber: (currentRound?.roundNumber || 0) + 1,
        importerId: 'pending', // Will be set when starting
        wordA,
        wordB,
        generatedBy: 'openai',
        createdAt: serverTimestamp(),
      });
      
      // Update room with new round
      await updateDoc(doc(db, 'rooms', roomId), {
        currentRoundId: roundRef.id,
      });
      
    } catch (error) {
      console.error('Error generating words:', error);
      alert('Failed to generate words. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startRound = async () => {
    if (!currentRound || players.length < 2) return;
    
    setIsStarting(true);
    try {
      // Select random importer
      const randomIndex = Math.floor(Math.random() * players.length);
      const importerId = players[randomIndex].id;
      
      // Update round with importer and start time
      await updateDoc(doc(db, 'rooms', roomId, 'rounds', currentRound.id), {
        importerId,
        startedAt: serverTimestamp(),
      });
      
      // Update room status
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'in_round',
      });
      
    } catch (error) {
      console.error('Error starting round:', error);
      alert('Failed to start round. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const markWinner = async () => {
    if (!selectedWinner || !currentRound) return;
    
    setIsMarkingWinner(true);
    try {
      await runTransaction(db, async (transaction) => {
        // Update round with winner
        const roundRef = doc(db, 'rooms', roomId, 'rounds', currentRound.id);
        transaction.update(roundRef, {
          winnerId: selectedWinner,
          winnerMarkedBy: room.hostId,
          endedAt: serverTimestamp(),
        });
        
        // Update player score
        const playerRef = doc(db, 'rooms', roomId, 'players', selectedWinner);
        const playerDoc = await transaction.get(playerRef);
        if (playerDoc.exists()) {
          const currentScore = playerDoc.data().score || 0;
          transaction.update(playerRef, { score: currentScore + 50 });
        }
      });
      
      // Reset room status
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'waiting',
        currentRoundId: null,
      });
      
      setSelectedWinner('');
      
    } catch (error) {
      console.error('Error marking winner:', error);
      alert('Failed to mark winner. Please try again.');
    } finally {
      setIsMarkingWinner(false);
    }
  };

  const canStart = currentRound && currentRound.importerId === 'pending' && players.length >= 2;
  const canMarkWinner = currentRound && currentRound.startedAt && !currentRound.winnerId;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Room Controls</h3>
      
      <div className="space-y-4">
        {/* Generate Words Button */}
        <button
          onClick={generateWords}
          disabled={isGenerating}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate New Words'}
        </button>
        
        {/* Start Round Button */}
        <button
          onClick={startRound}
          disabled={!canStart || isStarting}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? 'Starting...' : 'Start Round'}
        </button>
        
        {/* Mark Winner Section */}
        {canMarkWinner && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Winner
            </label>
            <select
              value={selectedWinner}
              onChange={(e) => setSelectedWinner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a player...</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.username}
                </option>
              ))}
            </select>
            <button
              onClick={markWinner}
              disabled={!selectedWinner || isMarkingWinner}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMarkingWinner ? 'Marking...' : 'Mark Winner (+50 pts)'}
            </button>
          </div>
        )}
        
        {room.status === 'in_round' && !canMarkWinner && (
          <div className="text-center text-gray-600 py-4">
            <p>Round in progress...</p>
            <p className="text-sm">Wait for the round to complete to mark a winner</p>
          </div>
        )}
      </div>
    </div>
  );
}
