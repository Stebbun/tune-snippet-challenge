import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Trophy, Volume2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SpotifyPlayer from 'react-spotify-web-playback';
import useSpotify from '@/hooks/useSpotify';

interface GameState {
  currentSong: SpotifyApi.TrackObjectFull | null;
  unlockedDuration: number;
  attempts: number;
  isPlaying: boolean;
  isGameWon: boolean;
  guess: string;
  searchResults: SpotifyApi.TrackObjectFull[];
  play: boolean;
  uris: string[];
}

const timeSegments = [0.1, 0.5, 1, 2, 5, 10];

const MusicGuessingGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentSong: null,
    unlockedDuration: 0,
    attempts: 0,
    isPlaying: false,
    isGameWon: false,
    guess: '',
    searchResults: [],
    play: false,
    uris: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const spotifyApi = useSpotify();
  const { toast } = useToast();
  const token = localStorage.getItem('spotify-token');

  useEffect(() => {
    if (token) {
      loadLikedSongs();
    }
  }, [token]);

  const loadLikedSongs = async () => {
    const data = await spotifyApi.getMySavedTracks({ limit: 50 });
    const tracks = data.items.map((item) => item.track);
    const uris = tracks.map((track) => track.uri);
    setGameState((prev) => ({ ...prev, searchResults: tracks, currentSong: tracks[0], uris }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const data = await spotifyApi.searchTracks(searchQuery, { limit: 10 });
    const tracks = data.tracks.items;
    const uris = tracks.map((track) => track.uri);
    setGameState((prev) => ({ ...prev, searchResults: tracks, currentSong: data.tracks.items[0], uris }));
  };

  const handlePlay = (duration: number) => {
    setGameState((prev) => ({ ...prev, play: true, isPlaying: true }));
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, play: false, isPlaying: false }));
    }, duration * 1000);
  };

  const unlockNextSegment = () => {
    const nextSegment = timeSegments.find((segment) => segment > gameState.unlockedDuration);
    if (!nextSegment) return;

    setGameState((prev) => ({
      ...prev,
      unlockedDuration: nextSegment,
      attempts: prev.attempts + 1,
    }));

    handlePlay(nextSegment);

    toast({
      title: `Unlocked ${nextSegment}s!`,
      description: `Attempt #${gameState.attempts + 1}`,
    });
  };

  const submitGuess = () => {
    if (!gameState.guess.trim() || !gameState.currentSong) return;

    const isCorrect = gameState.guess.toLowerCase() === gameState.currentSong.name.toLowerCase();

    if (isCorrect) {
      setGameState((prev) => ({ ...prev, isGameWon: true }));
      toast({
        title: '🎉 Correct!',
        description: `You guessed it in ${gameState.attempts} attempts!`,
      });
    } else {
      toast({
        title: 'Not quite right',
        description: 'Try listening to more of the song!',
        variant: 'destructive',
      });
    }
  };

  const resetGame = () => {
    setGameState({
      ...gameState,
      unlockedDuration: 0,
      attempts: 0,
      isPlaying: false,
      isGameWon: false,
      guess: '',
      play: false,
    });
    loadLikedSongs();
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <a href="/login" className="bg-green-500 text-white font-bold py-2 px-4 rounded">
          Login with Spotify
        </a>
      </div>
    );
  }

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

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for a song..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/20 border-border"
          />
          <Button type="submit" className="neon-button">
            <Search className="h-5 w-5" />
          </Button>
          <Button onClick={loadLikedSongs} type="button" variant="outline">
            Liked Songs
          </Button>
        </form>

        {/* Spotify Player */}
        <SpotifyPlayer
          token={token}
          uris={gameState.uris}
          play={gameState.play}
          callback={(state) => {
            if (!state.isPlaying) setGameState((prev) => ({ ...prev, play: false, isPlaying: false }));
          }}
        />

        {/* Main Game Card */}
        <Card className="game-card space-y-6">
          {/* Game Stats and other UI elements from the original component */}
        </Card>
      </div>
    </div>
  );
};

export default MusicGuessingGame;