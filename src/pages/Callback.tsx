import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Callback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error("Spotify Authentication Error:", error);
      navigate('/login');
      return;
    }

    if (code) {
      fetch(`/api/exchange?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            localStorage.setItem('spotify-token', data.access_token);
            navigate('/');
          } else {
            // Handle cases where the token exchange fails
            console.error("Token exchange failed", data);
            navigate('/login');
          }
        })
        .catch(err => {
          console.error("Token exchange fetch error:", err);
          navigate('/login');
        });
    } else {
      // If there's no code and no error, redirect to login
      navigate('/login');
    }

  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Authenticating with Spotify...</p>
    </div>
  );
};

export default Callback;