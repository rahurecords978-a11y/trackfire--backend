const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const multer = require('multer');
const upload = multer();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { trackTitle, artistName } = req.body;
    const audioBuffer = req.file.buffer;
    const base64Audio = audioBuffer.toString('base64');
    const fmt = req.file.mimetype.includes('wav') ? 'wav' : 'mp3';

    // Step 1: GPT-4o analyzes the audio
    const gptRes = await openai.chat.completions.create({
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
            text: `Listen to this song carefully. Return ONLY a JSON object with:
- genre: string
- subgenre: string
- mood: array of 3-5 mood words
- energy: "low"|"medium"|"high"|"explosive"
- tempo: "slow"|"mid"|"uptempo"|"fast"
- themes: array of 3-5 lyrical/emotional themes
- instruments: string of key instruments
- vibe: 2-3 sentence feel description
- targetAudience: who this is for
- uniqueHook: one sentence on what makes this track stand out
No markdown, no backticks, pure JSON only.`
          }
        ]
      }]
    });

    const analysis = JSON.parse(gptRes.choices[0].message.content.replace(/```json|```/g,'').trim());

    // Step 2: Claude writes the marketing copy
    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are a music marketing expert for independent artists.

Artist: ${artistName || 'Independent Artist'}
Track: ${trackTitle || 'Untitled'}
Genre: ${analysis.genre} / ${analysis.subgenre || ''}
Mood: ${(analysis.mood||[]).join(', ')}
Energy: ${analysis.energy}
Themes: ${(analysis.themes||[]).join(', ')}
Vibe: ${analysis.vibe}
Target Audience: ${analysis.targetAudience}
Unique Hook: ${analysis.uniqueHook}

Return ONLY a JSON object with these exact keys:
- Instagram: engaging caption with hashtags (150-200 chars + hashtags)
- TikTok: punchy hook + caption under 150 chars + hashtags
- YouTube: SEO-friendly description 100-150 words with call to action
- Twitter/X: sharp tweet under 280 chars, max 2 hashtags
- Facebook: conversational community post 100-150 words
- Press Release: professional third-person paragraph 100-150 words

Authentic indie music culture voice. No corporate speak. Pure JSON only, no markdown.`
      }]
    });

    const campaign = JSON.parse(claudeRes.content[0].text.replace(/```json|```/g,'').trim());

    res.json({ success: true, analysis, campaign });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TrackFire running on port ${PORT}`));
