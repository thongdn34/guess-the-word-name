'use client';

interface WordCardProps {
  word: string;
  isImporter: boolean;
  importerName: string;
}

export default function WordCard({ word, isImporter, importerName }: WordCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {isImporter ? 'You are the Importer' : 'You are a Guesser'}
        </h3>
        <p className="text-sm text-gray-500">
          {isImporter 
            ? 'Try to get others to guess your word without saying it directly'
            : `The importer (${importerName}) is trying to get you to guess their word`
          }
        </p>
      </div>
      
      <div className={`rounded-2xl p-12 mx-auto max-w-md ${
        isImporter 
          ? 'bg-red-500 text-white' 
          : 'bg-blue-500 text-white'
      }`}>
        <div className="text-4xl font-bold mb-4">
          {word}
        </div>
        <div className="text-lg opacity-90">
          {isImporter ? 'Your Word' : 'Guess This Word'}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>
          {isImporter 
            ? 'Give hints to help others guess your word'
            : 'Listen to the importer\'s hints and try to guess the word'
          }
        </p>
      </div>
    </div>
  );
}
