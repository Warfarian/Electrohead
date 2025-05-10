import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

// Generate a random string for state and code verifier
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(
    { length }, 
    () => possible.charAt(Math.floor(Math.random() * possible.length))
  ).join('');
};

// Generate code challenge from verifier using SHA-256
async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert digest to base64url
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Initialize Spotify API with stored token
export function initializeApi() {
  const token = localStorage.getItem('spotify_access_token');
  if (token) {
    spotifyApi.setAccessToken(token);
    return true;
  }
  return false;
}

// Get the authorize URL
export const getAuthUrl = async () => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) {
    console.error('Missing VITE_SPOTIFY_CLIENT_ID environment variable');
    return null;
  }

  // Use exact redirect URI that matches Spotify Dashboard
  const redirectUri = 'http://127.0.0.1:5173/';
  const state = generateRandomString(16);
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'streaming',
    'app-remote-control'
  ].join(' ');

  // Store PKCE and state values
  localStorage.setItem('spotify_auth_state', state);
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    show_dialog: true
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Exchange code for token
async function getToken(code) {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  const redirectUri = 'http://127.0.0.1:5173/';
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Token exchange failed:', errorData);
    throw new Error(`HTTP status ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in
  };
}

// Refresh the access token
async function refreshAccessToken(refreshToken) {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`HTTP status ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in
  };
}

// Handle the redirect from Spotify
export const handleRedirect = async () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const storedState = localStorage.getItem('spotify_auth_state');
  const error = params.get('error');

  if (error) {
    console.error('Auth error:', error);
    return null;
  }

  if (!code || state !== storedState) {
    return null;
  }

  try {
    // Exchange the code for tokens
    const { accessToken, refreshToken, expiresIn } = await getToken(code);
    
    // Clear PKCE and state values
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');
    
    // Store tokens
    localStorage.setItem('spotify_access_token', accessToken);
    localStorage.setItem('spotify_refresh_token', refreshToken);
    localStorage.setItem('spotify_token_expiry', Date.now() + expiresIn * 1000);
    
    // Set the token on the API object
    spotifyApi.setAccessToken(accessToken);
    
    return accessToken;
  } catch (error) {
    console.error('Token exchange failed:', error);
    return null;
  }
};

// Check and refresh token if needed
async function ensureValidToken() {
  const accessToken = localStorage.getItem('spotify_access_token');
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  const expiry = localStorage.getItem('spotify_token_expiry');

  if (!accessToken || !refreshToken) {
    return false;
  }

  // If token is expired or will expire in the next minute
  if (Date.now() >= Number(expiry) - 60000) {
    try {
      const { accessToken: newAccessToken, expiresIn } = await refreshAccessToken(refreshToken);
      localStorage.setItem('spotify_access_token', newAccessToken);
      localStorage.setItem('spotify_token_expiry', Date.now() + expiresIn * 1000);
      spotifyApi.setAccessToken(newAccessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  return true;
}

// Get available devices
export const getDevices = async () => {
  try {
    if (!await ensureValidToken()) {
      throw new Error('Not authenticated');
    }
    const response = await spotifyApi.getMyDevices();
    return response.devices;
  } catch (error) {
    console.error('Error getting devices:', error);
    return [];
  }
};

// Play track on active device
export const playTrack = async (trackUri) => {
  try {
    if (!await ensureValidToken()) {
      throw new Error('Not authenticated');
    }

    // Get available devices
    const devices = await getDevices();
    const activeDevice = devices.find(device => device.is_active);
    
    if (!activeDevice) {
      throw new Error('No active Spotify device found. Please open Spotify on your device first.');
    }

    await spotifyApi.play({
      device_id: activeDevice.id,
      uris: [trackUri]
    });
  } catch (error) {
    console.error('Error playing track:', error);
    throw error;
  }
};

export const searchTracks = async (query) => {
  try {
    if (!await ensureValidToken()) {
      throw new Error('Not authenticated');
    }
    const response = await spotifyApi.searchTracks(query);
    return response.tracks.items;
  } catch (error) {
    console.error('Error searching tracks:', error);
    return [];
  }
};

// Clear all Spotify-related data from localStorage
export const logout = () => {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiry');
  localStorage.removeItem('spotify_auth_state');
  localStorage.removeItem('spotify_code_verifier');
  spotifyApi.setAccessToken(null);
};

export default spotifyApi;