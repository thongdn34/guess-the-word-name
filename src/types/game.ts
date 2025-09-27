export interface Room {
  id: string;
  name?: string;
  hostId: string;
  createdAt: Date;
  status: 'waiting' | 'in_round' | 'finished';
  currentRoundId?: string;
}

export interface Player {
  id: string;
  username: string;
  score: number;
  joinedAt: Date;
  isHost: boolean;
  connected: boolean;
}

export interface Round {
  id: string;
  roundNumber: number;
  importerId: string;
  wordA: string;
  wordB: string;
  generatedBy: 'openai' | 'manual';
  startedAt?: Date;
  endedAt?: Date;
  winnerId?: string; // Keep for backward compatibility
  winnerIds?: string[]; // New field for multiple winners
  winnerMarkedBy?: string;
  createdAt: Date;
}

export interface WordPair {
  wordA: string;
  wordB: string;
}

export interface GameState {
  room: Room | null;
  players: Player[];
  currentRound: Round | null;
  rounds: Round[];
  isHost: boolean;
  currentPlayer: Player | null;
}
