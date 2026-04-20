const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const multer = require('multer');
const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { trackTitle, artistName } = req.body;
    const base64Audio = req.file.buffer.toString('base64');
    const fmt = req.file.mimetype.includes('wav') ? 'wav' : 'mp3';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'input_audio',
            input_audio: { data: base64Audio, format: fmt }
          },
          {
            type: 'text',
            text: `You are a music marketing expert. Listen to this song and return ONLY a JSON object with these exact keys:
- genre, subgenre, mood (array), energy, tempo, themes (array), instruments, vibe, targetAudience, uniqueHook
- Instagram: caption with hashtags
- TikTok: punchy hook + hashtags
- YouTube: SEO description 100-150 words
- Twitter/X: tweet under 280 chars
- Facebook: community post 100-150 words
- Press Release: third-person paragraph 100-150 words

Artist: ${artistName || 'Independent Artist'}
Track: ${trackTitle || 'Untitled'}

Pure JSON only, no markdown.`
          }
        ]
      }]
    });

    const raw = response.choices[0].message.content.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);
    
    res.json({ 
      success: true, 
      analysis: {
        genre: result.genre,
        subgenre: result.subgenre,
        mood: result.mood,
        energy: result.energy,
        tempo: result.tempo,
        themes: result.themes,
        instruments: result.instruments,
        vibe: result.vibe,
        targetAudience: result.targetAudience,
        uniqueHook: result.uniqueHook
      },
      campaign: {
        Instagram: result.Instagram,
        TikTok: result.TikTok,
        YouTube: result.YouTube,
        'Twitter/X': result['Twitter/X'],
        Facebook: result.Facebook,
        'Press Release': result['Press Release']
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TrackFire running on port ${PORT}`));
