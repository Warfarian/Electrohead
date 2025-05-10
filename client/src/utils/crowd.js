const API_BASE_URL = 'http://localhost:3000';

export async function getCrowdReaction(currentTrack, previousTrack = null) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/crowd/react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentTrack: {
          name: currentTrack.name,
          artist: currentTrack.artists[0].name,
          uri: currentTrack.uri
        },
        previousTrack: previousTrack ? {
          name: previousTrack.name,
          artist: previousTrack.artists[0].name,
          uri: previousTrack.uri
        } : null
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get crowd reaction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting crowd reaction:', error);
    return {
      reaction: 'Technical difficulties',
      score: 5,
      message: 'The crowd seems distracted by technical issues...'
    };
  }
}