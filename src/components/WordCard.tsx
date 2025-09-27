"use client";

import { forwardRef } from "react";

interface WordCardProps {
  word: string;
  isImporter: boolean;
}

const WordCard = forwardRef<HTMLDivElement, WordCardProps>(
  ({ word }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-lg p-8 text-center animate-fade-in"
        style={{
          animation: "fadeIn 0.5s ease-in-out",
        }}
      >
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            Try to get others to guess your word without saying it directly
          </p>
        </div>

        <div className="rounded-2xl p-12 mx-auto max-w-md bg-blue-500 text-white">
          <div className="text-4xl font-bold mb-4">{word}</div>
          <div className="text-lg opacity-90">Guess This Word</div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Listen to the importer&apos;s hints and try to guess the word</p>
        </div>
      </div>
    );
  }
);

WordCard.displayName = "WordCard";

export default WordCard;
