'use client';

import { useState } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Room, Player, Round } from '@/types/game';
import StartVoteButton from './StartVoteButton';

import { VotingSession } from '@/types/game';

interface RoomControlsProps {
  room: Room;
  currentRound: Round | null;
  players: Player[];
  roomId: string;
  currentVotingSession: VotingSession | null;
  onEndVoting?: () => void;
}

export default function RoomControls({ room, currentRound, players, roomId, currentVotingSession, onEndVoting }: RoomControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isMarkingWinner, setIsMarkingWinner] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);

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
    
    // Check if currentRound has a valid ID
    if (!currentRound.id) {
      console.error('Current round has no ID:', currentRound);
      alert('Round data is not ready. Please try again.');
      return;
    }
    
    setIsStarting(true);
    try {
      // Select random importer
      const randomIndex = Math.floor(Math.random() * players.length);
      const importerId = players[randomIndex].id;
      
      console.log('Starting round with ID:', currentRound.id, 'Importer:', importerId);
      
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

  const markWinners = async () => {
    if (selectedWinners.length === 0 || !currentRound) return;
    
    setIsMarkingWinner(true);
    try {
      await runTransaction(db, async (transaction) => {
        // First, read all player documents to get current scores
        const playerRefs = selectedWinners.map(winnerId => 
          doc(db, 'rooms', roomId, 'players', winnerId)
        );
        const playerDocs = await Promise.all(
          playerRefs.map(ref => transaction.get(ref))
        );
        
        // Check if all players exist
        for (let i = 0; i < playerDocs.length; i++) {
          if (!playerDocs[i].exists()) {
            throw new Error(`Player ${selectedWinners[i]} not found`);
          }
        }
        
        // Get current scores
        const currentScores = playerDocs.map(doc => doc.data()?.score || 0);
        
        // Then perform all writes
        // Update round with winners
        const roundRef = doc(db, 'rooms', roomId, 'rounds', currentRound.id);
        transaction.update(roundRef, {
          winnerIds: selectedWinners,
          winnerMarkedBy: room.hostId,
          endedAt: serverTimestamp(),
        });
        
        // Update all player scores
        playerRefs.forEach((playerRef, index) => {
          transaction.update(playerRef, { 
            score: currentScores[index] + 50 
          });
        });
      });
      
      // Reset room status
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'waiting',
        currentRoundId: null,
      });
      
      setSelectedWinners([]);
      
    } catch (error) {
      console.error('Error marking winners:', error);
      alert('Failed to mark winners. Please try again.');
    } finally {
      setIsMarkingWinner(false);
    }
  };

  const canStart = currentRound && currentRound.id && currentRound.importerId === 'pending' && players.length >= 2;
  const canMarkWinner = currentRound && currentRound.startedAt && !currentRound.winnerIds && !currentRound.winnerId;

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
        
        {/* Start Vote Button */}
        <StartVoteButton
          currentRound={currentRound}
          players={players}
          roomId={roomId}
          isHost={true}
          currentVotingSession={currentVotingSession}
          onEndVoting={onEndVoting}
        />

        {/* Mark Winner Section */}
        {canMarkWinner && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Winners (Multiple Selection)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {players.map((player) => (
                <label key={player.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWinners.includes(player.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWinners([...selectedWinners, player.id]);
                      } else {
                        setSelectedWinners(selectedWinners.filter(id => id !== player.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{player.username}</span>
                </label>
              ))}
            </div>
            <button
              onClick={markWinners}
              disabled={selectedWinners.length === 0 || isMarkingWinner}
              className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isMarkingWinner ? 'Marking...' : `Mark ${selectedWinners.length} Winner${selectedWinners.length !== 1 ? 's' : ''} (+50 pts each)`}
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
