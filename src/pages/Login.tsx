import React from 'react';
import { Button } from '@/components/ui/button';

const Login = () => {
  const handleLogin = () => {
    const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirect_uri = import.meta.env.VITE_REDIRECT_URI;

    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-library-read',
      'user-library-modify',
      'user-read-playback-state',
      'user-modify-playback-state',
    ];

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("response_type", "code"); // Changed from "token"
    authUrl.searchParams.append("client_id", client_id);
    authUrl.searchParams.append("scope", scopes.join(' '));
    authUrl.searchParams.append("redirect_uri", redirect_uri);
    authUrl.searchParams.append("show_dialog", "true");

    window.location.href = authUrl.toString();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        🎵 Song Guesser
      </h1>
      <p className="text-muted-foreground">Please log in with Spotify to continue.</p>
      <Button onClick={handleLogin} className="neon-button">
        Login with Spotify
      </Button>
    </div>
  );
};

export default Login;