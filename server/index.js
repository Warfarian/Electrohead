const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Nebius client
const client = new OpenAI({
  baseURL: 'https://api.studio.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate AI prompt
function generatePrompt(currentTrack, previousTrack) {
  if (!previousTrack) {
    return `You are a crowd at a DJ set. The DJ just started playing "${currentTrack.name}" by ${currentTrack.artist}". How do you react? Consider the energy level and danceability of the track. Return a JSON object with exactly these fields: reaction (a short 2-4 word phrase), score (number 0-10), message (a short 1-2 sentence reaction). Example: {"reaction": "Crowd goes wild!", "score": 9, "message": "The energy is perfect, everyone's dancing!"} Do not include any other text or formatting.`;
  }

  return `You are a crowd at a DJ set. The DJ just transitioned from "${previousTrack.name}" by ${previousTrack.artist}" to "${currentTrack.name}" by ${currentTrack.artist}". How do you react? Consider the flow, energy transition, and genre compatibility. Return a JSON object with exactly these fields: reaction (a short 2-4 word phrase), score (number 0-10), message (a short 1-2 sentence reaction). Example: {"reaction": "Smooth transition!", "score": 8, "message": "Perfect flow from one track to the next, keeping the vibe going."} Do not include any other text or formatting.`;
}

// Endpoint to get crowd reaction
app.post('/api/crowd/react', async (req, res) => {
  try {
    const { currentTrack, previousTrack } = req.body;

    if (!currentTrack || !currentTrack.name || !currentTrack.artist) {
      return res.status(400).json({ error: 'Current track information required' });
    }

    const completion = await client.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3",
      max_tokens: 512,
      temperature: 0.3,
      top_p: 0.95,
      messages: [
        {
          role: "system",
          content: "You are an AI simulating a crowd at a dance club. Your responses should be fun and dynamic, focusing on the music's energy, flow, and how well tracks work together. Always respond with a raw JSON object containing exactly three fields: reaction (a short 2-4 word phrase), score (number 0-10), message (a short 1-2 sentence reaction). Example: {\"reaction\": \"Energy is perfect!\", \"score\": 8.5, \"message\": \"The crowd is loving this beat!\"} Never include any other text or formatting."
        },
        {
          role: "user",
          content: generatePrompt(currentTrack, previousTrack)
        }
      ]
    });

    // Parse the AI response
    let aiResponse;
    try {
      // Clean the response of any potential formatting
      const cleanedResponse = completion.choices[0].message.content
        .replace(/```[a-z]*\s*/g, '') // Remove any code block start
        .replace(/```\s*/g, '') // Remove code block end
        .replace(/^[^{]*({.*})[^}]*$/, '$1') // Extract just the JSON object
        .trim();
      
      console.log('Raw response:', completion.choices[0].message.content);
      console.log('Cleaned response:', cleanedResponse);
      
      aiResponse = JSON.parse(cleanedResponse);
      
      // Validate response format
      if (!aiResponse.reaction || !aiResponse.message || typeof aiResponse.score !== 'number') {
        throw new Error('Invalid response format');
      }

      // Ensure score is within bounds
      aiResponse.score = Math.max(0, Math.min(10, aiResponse.score));
      
      // Ensure reaction and message aren't too long
      aiResponse.reaction = aiResponse.reaction.slice(0, 30);
      aiResponse.message = aiResponse.message.slice(0, 100);
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      aiResponse = {
        reaction: "Mixed feelings",
        score: 5,
        message: "The crowd's reaction is hard to read..."
      };
    }

    res.json(aiResponse);
  } catch (error) {
    console.error('AI request failed:', error);
    res.status(500).json({ 
      error: 'Failed to get crowd reaction',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});