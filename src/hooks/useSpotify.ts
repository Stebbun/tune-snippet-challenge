import { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const useSpotify = () => {
  const [spotifyApi, setSpotifyApi] = useState(new SpotifyWebApi());

  useEffect(() => {
    const token = localStorage.getItem('spotify-token');
    if (token) {
      spotifyApi.setAccessToken(token);
    }
  }, []);

  return spotifyApi;
};

export default useSpotify;