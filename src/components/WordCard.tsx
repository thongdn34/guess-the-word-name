"use client";

import { forwardRef, useEffect, useState } from "react";

interface WordCardProps {
  word: string;
  isImporter: boolean;
}

const WordCard = forwardRef<HTMLDivElement, WordCardProps>(
  ({ word }, ref) => {
    const [isBlurred, setIsBlurred] = useState(false);

    // Automatically blur the word 5 seconds after it changes/appears
    useEffect(() => {
      setIsBlurred(false);
      const timeoutId = setTimeout(() => setIsBlurred(true), 5000);
      return () => clearTimeout(timeoutId);
    }, [word]);

    const toggleBlur = () => setIsBlurred((prev) => !prev);

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

        <div
          className="rounded-2xl p-12 mx-auto max-w-md bg-blue-500 text-white select-none cursor-pointer"
          onClick={toggleBlur}
          role="button"
          aria-pressed={!isBlurred}
          title={isBlurred ? "Tap to reveal" : "Tap to blur"}
        >
          <div
            className={`text-4xl font-bold mb-4 transition filter ${
              isBlurred ? "blur" : "blur-0"
            }`}
          >
            {word}
          </div>
          <div className="text-lg opacity-90">
            {isBlurred ? "Tap to reveal" : "Tap to blur"}
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Listen to the imposter&apos;s hints and try to guess the word</p>
        </div>
      </div>
    );
  }
);

WordCard.displayName = "WordCard";

export default WordCard;
