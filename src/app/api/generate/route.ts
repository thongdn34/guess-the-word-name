import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cache for word pairs to avoid reading file on every request
let wordPairs: Array<{wordA: string, wordB: string}> = [];

function loadWordPairs() {
  if (wordPairs.length === 0) {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'word-pairs.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      // Skip header line and filter out empty lines
      wordPairs = lines.slice(1)
        .filter(line => line.trim() !== '') // Remove empty lines
        .map(line => {
          const [wordA, wordB] = line.split(',');
          // Check if both words exist and are not empty
          if (wordA && wordB && wordA.trim() && wordB.trim()) {
            return { wordA: wordA.trim(), wordB: wordB.trim() };
          }
          return null;
        })
        .filter(pair => pair !== null); // Remove null entries
    } catch (error) {
      console.error('Error loading word pairs:', error);
      // Fallback word pairs if file can't be read
      wordPairs = [
        { wordA: 'thể dục', wordB: 'tập gym' },
        { wordA: 'học tập', wordB: 'ôn bài' },
        { wordA: 'ăn uống', wordB: 'thưởng thức' }
      ];
    }
  }
  return wordPairs;
}

export async function POST(request: NextRequest) {
  try {
    const { roomId } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Load word pairs from CSV
    const pairs = loadWordPairs();
    
    if (pairs.length === 0) {
      console.error('No word pairs loaded from CSV file');
      throw new Error('No word pairs available');
    }

    console.log(`Loaded ${pairs.length} word pairs from CSV`);

    // Select a random word pair
    const randomIndex = Math.floor(Math.random() * pairs.length);
    const wordPair = pairs[randomIndex];
    
    console.log(`Selected word pair ${randomIndex + 1}/${pairs.length}:`, wordPair);

    return NextResponse.json(wordPair);
  } catch (error) {
    console.error('Error generating word pair:', error);
    return NextResponse.json(
      { error: 'Failed to generate word pair' },
      { status: 500 }
    );
  }
}