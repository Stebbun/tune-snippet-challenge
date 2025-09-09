import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Trophy, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameState {
  currentSong: string;
  unlockedDuration: number;
  attempts: number;
  isPlaying: boolean;
  isGameWon: boolean;
  guess: string;
}

const timeSegments = [0.1, 0.5, 1, 2, 5, 10];

const MusicGuessingGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentSong: "Unknown Song", // This would be set when loading a song
    unlockedDuration: 0,
    attempts: 0,
    isPlaying: false,
    isGameWon: false,
    guess: '',
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // For demo purposes - in a real app, you'd load actual audio files
  const demoAudioUrl = "https://www.soundjay.com/misc/sounds/magic_chime_02.mp3";

  const unlockSegment = (duration: number) => {
    if (duration <= gameState.unlockedDuration) {
      // Already unlocked, just play
      playAudio(duration);
      return;
    }

    setGameState(prev => ({
      ...prev,
      unlockedDuration: duration,
      attempts: prev.attempts + 1,
    }));

    playAudio(duration);
    
    toast({
      title: `Unlocked ${duration}s!`,
      description: `Attempt #${gameState.attempts + 1}`,
    });
  };

  const playAudio = (duration: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play();
    
    setGameState(prev => ({ ...prev, isPlaying: true }));

    // Stop after the unlocked duration
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }
    }, duration * 1000);
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setGameState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  const submitGuess = () => {
    if (!gameState.guess.trim()) return;

    // For demo - in real app, compare with actual song title
    const isCorrect = gameState.guess.toLowerCase().includes('magic') || 
                     gameState.guess.toLowerCase().includes('chime');

    if (isCorrect) {
      setGameState(prev => ({ ...prev, isGameWon: true }));
      toast({
        title: "🎉 Correct!",
        description: `You guessed it in ${gameState.attempts} attempts!`,
      });
    } else {
      toast({
        title: "Not quite right",
        description: "Try listening to more of the song!",
        variant: "destructive",
      });
    }
  };

  const resetGame = () => {
    setGameState({
      currentSong: "Unknown Song",
      unlockedDuration: 0,
      attempts: 0,
      isPlaying: false,
      isGameWon: false,
      guess: '',
    });
    stopAudio();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Song Guesser
          </h1>
          <p className="text-muted-foreground">
            Unlock segments of the song and guess the title in the fewest attempts!
          </p>
        </div>

        {/* Main Game Card */}
        <Card className="game-card space-y-6">
          {/* Audio Element (hidden) */}
          <audio ref={audioRef} preload="auto">
            <source src={demoAudioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>

          {/* Game Stats */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              <span className="font-semibold">Attempts: {gameState.attempts}</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                Unlocked: {gameState.unlockedDuration}s
              </span>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="flex items-end justify-center gap-1 h-16 bg-muted/20 rounded-lg p-4">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`waveform-bar ${
                  i < (gameState.unlockedDuration / 10) * 32 ? 'opacity-100' : 'opacity-30'
                }`}
                style={{
                  height: `${Math.random() * 40 + 10}px`,
                  width: '4px',
                }}
              />
            ))}
          </div>

          {/* Unlock Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {timeSegments.map((duration) => (
              <Button
                key={duration}
                onClick={() => unlockSegment(duration)}
                disabled={gameState.isGameWon}
                className={`unlock-button ${
                  duration <= gameState.unlockedDuration ? 'bg-gradient-to-r from-primary to-accent' : ''
                }`}
              >
                {duration < 1 ? `${duration * 1000}ms` : `${duration}s`}
              </Button>
            ))}
          </div>

          {/* Playback Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => gameState.isPlaying ? stopAudio() : playAudio(gameState.unlockedDuration)}
              disabled={gameState.unlockedDuration === 0 || gameState.isGameWon}
              className="neon-button"
            >
              {gameState.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              {gameState.isPlaying ? 'Stop' : 'Play'}
            </Button>
          </div>

          {/* Guess Input */}
          {!gameState.isGameWon && (
            <div className="space-y-3">
              <Input
                placeholder="Enter your guess for the song title..."
                value={gameState.guess}
                onChange={(e) => setGameState(prev => ({ ...prev, guess: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                className="bg-muted/20 border-border"
              />
              <Button
                onClick={submitGuess}
                disabled={!gameState.guess.trim()}
                className="w-full neon-button"
              >
                Submit Guess
              </Button>
            </div>
          )}

          {/* Win State */}
          {gameState.isGameWon && (
            <div className="text-center space-y-4 animate-scale-in">
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-accent">Congratulations!</h2>
              <p className="text-muted-foreground">
                You guessed the song in {gameState.attempts} attempts!
              </p>
            </div>
          )}

          {/* Reset Button */}
          <Button
            onClick={resetGame}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Game
          </Button>
        </Card>

        {/* Instructions */}
        <Card className="game-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            How to Play
          </h3>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Click time buttons to unlock more of the song (0.1s → 10s)</p>
            <p>• Each unlock counts as an attempt</p>
            <p>• Try to guess the song title in the fewest attempts possible</p>
            <p>• Use the play button to replay unlocked portions</p>
          </div>
        </Card>

        {/* Demo Note */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Demo mode - Replace with your own audio files for the full experience</p>
        </div>
      </div>
    </div>
  );
};

export default MusicGuessingGame;