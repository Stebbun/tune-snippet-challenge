import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Trophy, Volume2, Search, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import useSpotify from '@/hooks/useSpotify';
import { Progress } from '@/components/ui/progress';

interface GameState {
  currentSong: SpotifyApi.TrackObjectFull | null;
  unlockedSegmentIndex: number;
  attempts: number;
  isPlaying: boolean;
  isGameWon: boolean;
  guess: string;
  searchResults: SpotifyApi.TrackObjectFull[];
  player: Spotify.Player | null;
  deviceId: string | null;
  volume: number;
}

const timeSegments = [0.1, 0.5, 1, 2, 5, 10];

const MusicGuessingGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentSong: null,
    unlockedSegmentIndex: -1,
    attempts: 0,
    isPlaying: false,
    isGameWon: false,
    guess: '',
    searchResults: [],
    player: null,
    deviceId: null,
    volume: 50,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const spotifyApi = useSpotify();
  const { toast } = useToast();
  const token = localStorage.getItem('spotify-token');

  const setupPlayer = useCallback(() => {
    const player = new (window as any).Spotify.Player({
      name: 'Song Guesser',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(token!);
      },
      volume: gameState.volume / 100,
    });

    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      setGameState(prev => ({ ...prev, deviceId: device_id }));
      spotifyApi.transferMyPlayback([device_id]);
    });

    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
    });

    player.addListener('player_state_changed', (state: Spotify.PlaybackState) => {
      if (!state) {
        return;
      }
      setGameState(prev => ({ ...prev, isPlaying: !state.paused }))
    });

    player.connect();
    setGameState(prev => ({ ...prev, player }));
  }, [token, gameState.volume, spotifyApi]);


  useEffect(() => {
    if (token && !gameState.player) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      (window as any).onSpotifyWebPlaybackSDKReady = () => {
        setupPlayer();
      };
    }
  }, [token, gameState.player, setupPlayer]);


  const loadLikedSongs = useCallback(async () => {
    const data = await spotifyApi.getMySavedTracks({ limit: 50 });
    const tracks = data.items.map((item) => item.track);
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    setGameState((prev) => ({ ...prev, searchResults: tracks, currentSong: randomTrack }));
  }, [spotifyApi]);


  useEffect(() => {
    if (token) {
      loadLikedSongs();
    }
  }, [token, loadLikedSongs]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const data = await spotifyApi.searchTracks(searchQuery, { limit: 10 });
    const tracks = data.tracks.items;
    setGameState((prev) => ({ ...prev, searchResults: tracks, currentSong: data.tracks.items[0] }));
  };

  const handlePlay = async (duration: number) => {
    if (!gameState.currentSong || !gameState.deviceId) return;

    await spotifyApi.play({
      device_id: gameState.deviceId,
      uris: [gameState.currentSong.uri],
    });

    setGameState(prev => ({ ...prev, isPlaying: true }));

    setTimeout(async () => {
      await spotifyApi.pause();
      setGameState(prev => ({ ...prev, isPlaying: false }));
    }, duration * 1000);
  };


  const unlockNextSegment = () => {
    const nextIndex = gameState.unlockedSegmentIndex + 1;
    if (nextIndex >= timeSegments.length) return;

    const nextDuration = timeSegments[nextIndex];
    setGameState((prev) => ({
      ...prev,
      unlockedSegmentIndex: nextIndex,
      attempts: prev.attempts + 1,
    }));

    handlePlay(nextDuration);

    toast({
      title: `Unlocked ${nextDuration}s!`,
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
      setGameState(prev => ({ ...prev, guess: '' }));
      toast({
        title: 'Not quite right',
        description: 'Try listening to more of the song!',
        variant: 'destructive',
      });
    }
  };

  const resetGame = () => {
    const randomTrack = gameState.searchResults[Math.floor(Math.random() * gameState.searchResults.length)];
    setGameState({
      ...gameState,
      unlockedSegmentIndex: -1,
      attempts: 0,
      isPlaying: false,
      isGameWon: false,
      guess: '',
      currentSong: randomTrack
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setGameState(prev => ({ ...prev, volume: newVolume }));
    if (gameState.player) {
      gameState.player.setVolume(newVolume / 100);
    }
  }


  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <a href="/login" className="bg-green-500 text-white font-bold py-2 px-4 rounded">
          Login with Spotify
        </a>
      </div>
    );
  }

  const progress = ((gameState.unlockedSegmentIndex + 1) / timeSegments.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🎵 Song Guesser
          </h1>
          <p className="text-muted-foreground">
            Unlock segments of the song and guess the title in the fewest attempts!
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for a song to guess..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/20 border-border"
          />
          <Button type="submit" className="neon-button">
            <Search className="h-5 w-5" />
          </Button>
          <Button onClick={loadLikedSongs} type="button" variant="outline">
            <Heart className="h-5 w-5 mr-2" /> Liked Songs
          </Button>
        </form>


        <Card className="game-card space-y-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {gameState.isGameWon ? gameState.currentSong?.name : "Guess the Song"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                {timeSegments.map((time, i) => <span key={time}>{i <= gameState.unlockedSegmentIndex ? `${time}s` : '🔒'}</span>)}
              </div>
            </div>


            <div className="flex items-center justify-center gap-4">
              <Button onClick={() => handlePlay(timeSegments[gameState.unlockedSegmentIndex] || 0.1)} disabled={gameState.isPlaying || gameState.isGameWon || gameState.unlockedSegmentIndex < 0} size="icon" className="w-16 h-16 rounded-full neon-button">
                {gameState.isPlaying ? <Pause /> : <Play />}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Volume2 />
              <Input type="range" min="0" max="100" value={gameState.volume} onChange={handleVolumeChange} className="w-full" />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Enter your guess..."
                value={gameState.guess}
                onChange={(e) => setGameState(prev => ({ ...prev, guess: e.target.value }))}
                disabled={gameState.isGameWon}
              />
              <Button onClick={submitGuess} disabled={gameState.isGameWon || !gameState.guess} className="neon-button">
                Guess
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button onClick={unlockNextSegment} disabled={gameState.isGameWon || gameState.unlockedSegmentIndex >= timeSegments.length - 1}>
              Unlock Next Segment
            </Button>
            <div className="text-lg">
              Attempts: <span className="font-bold">{gameState.attempts}</span>
            </div>
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="mr-2" /> New Song
            </Button>
          </CardFooter>
        </Card>

        {gameState.isGameWon && (
          <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20 animate-scale-in">
            <Trophy className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="text-2xl font-bold mt-2">You Won!</h2>
            <p>You guessed "{gameState.currentSong?.name}" by {gameState.currentSong?.artists.map(a => a.name).join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicGuessingGame;