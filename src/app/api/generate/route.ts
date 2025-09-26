import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { roomId, language = 'vi', promptOverride } = await request.json();

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const systemPrompt = `You are an assistant that returns two short Vietnamese phrases/words that are near-synonyms (same meaning or very close). Output must be valid JSON with exactly two keys: "wordA" and "wordB". "wordA" should be the more formal / dictionary variant; "wordB" should be the colloquial / slang or alternate phrasing. Each value must be a short string (1-3 words). No extra commentary.`;

    const userPrompt = promptOverride || 'Generate one pair.';

    const completion = await openai.chat.completions.create({
      // model: 'gpt-3.5-turbo',
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const wordPair = JSON.parse(response);
    
    // Validate the response structure
    if (!wordPair.wordA || !wordPair.wordB) {
      throw new Error('Invalid response format from OpenAI');
    }

    return NextResponse.json(wordPair);
  } catch (error) {
    console.error('Error generating word pair:', error);
    return NextResponse.json(
      { error: 'Failed to generate word pair' },
      { status: 500 }
    );
  }
}
