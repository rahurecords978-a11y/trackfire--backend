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
    const { trackTitle, artistName, lyrics } = req.body;
    const base64Audio = req.file.buffer.toString('base64');
    const fmt = req.file.mimetype.includes('wav') ? 'wav' : 'mp3';

    const lyricsSection = lyrics
      ? `\nLYRICS PROVIDED:\n${lyrics}\n\nUse the lyrics to understand the emotional story, themes, and narrative — this should DEEPLY inform the title, descriptions, and all content.`
      : '';

    const prompt = `You are a visionary music marketing strategist with the soul of a poet and the instincts of a viral content creator. You understand that the best music marketing doesn't describe the song — it makes people feel like the song found THEM at exactly the right moment.

Listen to this track carefully. Then return ONLY a valid JSON object with these exact keys.${lyricsSection}

Artist: ${artistName || 'Independent Artist'}
Track: ${trackTitle || 'Untitled'}

JSON STRUCTURE — return ONLY this, no markdown, no backticks:
{
  "genre": "primary genre",
  "subgenre": "subgenre",
  "mood": ["mood1", "mood2"],
  "energy": "energy level",
  "tempo": "tempo description",
  "themes": ["theme1", "theme2"],
  "instruments": "key instruments heard",
  "vibe": "one sentence vibe description",
  "targetAudience": "who this speaks to emotionally, not demographically",
  "uniqueHook": "the one emotional truth this song captures that makes it unforgettable",
  "suggestedTitle": "A scroll-stopping title that makes people feel like this song found them. NOT descriptive. EMOTIONAL. Think like a tarot card reading or a message from the universe. Examples: 'This Is For Everyone Who Loved Someone They Had To Let Go' or 'If This Song Found You Tonight, You Needed It'",
  "Instagram": "4-6 lines with rhythm and line breaks. Mysterious, cinematic, emotionally magnetic. Speak to the feeling not the song. End with a call to feel something. Include 20-25 hashtags on a new line. Make people stop scrolling.",
  "TikTok": "2-3 lines MAX. Open with 'if this found you' or 'this is for' energy. Ultra casual but hits deep. 15-20 trending hashtags.",
  "YouTube": "150-200 word description. Open with the emotional story of the song — who it's for, what moment it captures. Then describe the sound. Then artist/label info. SEO-optimized but reads like a human wrote it with feeling.",
  "Twitter/X": "Under 240 chars total. One sentence that hits like a gut punch. 2-3 hashtags only.",
  "Facebook": "Conversational, warm, community feel. Tell the story behind the feeling. 100-150 words. 5-8 hashtags.",
  "Press Release": "Third-person, 150 words. Cinematic opening sentence. Describe the sonic world, the emotional core, the artist vision. End with release info.",
  "thumbnailPrompt": "A detailed AI image generation prompt for a YouTube thumbnail. Cinematic, atmospheric, no text in image. Pull the ACTUAL scene from the lyrics — specific characters, locations, moments described in the song. Specific lighting, mood, colors. Style: photorealistic cinematic.",
  "bannerPrompt": "A detailed AI image prompt for a YouTube channel banner or social media header. Wide format. Dark, atmospheric, artistic. Represents the artist's world not just this song.",
  "staticPostPrompt": "A detailed AI image prompt for a square Instagram/social media post. Striking visual, strong mood, could work as album art. Specific and evocative.",
  "scenes": [
    {
      "lyric": "the key lyric line or moment this scene represents",
      "scene": "timestamp or song section (e.g. Intro, Verse 1, Chorus, Bridge)",
      "imagePrompt": "A highly specific, cinematic AI image generation prompt for this exact lyric moment. Pull DIRECTLY from the story — real characters, real locations, real emotions described in the lyrics. Include: exact scene description, character details, setting, lighting, camera angle, mood, color palette. Make it specific enough to generate in Gemini, Canva AI or Midjourney. No text in image.",
      "animationPrompt": "A short 1-2 sentence description of how this image should move/animate for a 5-10 second video clip. Describe camera movement, character movement, atmospheric effects (e.g. 'slow dolly push toward the figure, soft bokeh lights drifting in background')."
    }
  ]
}

CRITICAL RULES:
- suggestedTitle must make someone stop and think "wait, is this about me?"
- Instagram/TikTok copy should feel like it came from a mystical source, not a marketing team
- Visual prompts must pull DIRECTLY from the actual story and scenes in the lyrics — not generic/abstract
- scenes array must have 8-12 entries covering the full song arc from intro to outro
- Each scene imagePrompt must be different — no repeating the same visual
- animationPrompt tells Suno or Canva AI exactly how to animate the still image
- Never use words like: banger, fire, lit, slaps, hits different
- Every piece of content should feel like the universe is sending a message through the music`;

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
            text: prompt
          }
        ]
      }]
    });

    const raw = response.choices[0].message.content.replace(/```json|```/g, '').trim();
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
        uniqueHook: result.uniqueHook,
        suggestedTitle: result.suggestedTitle
      },
      campaign: {
        Instagram: result.Instagram,
        TikTok: result.TikTok,
        YouTube: result.YouTube,
        'Twitter/X': result['Twitter/X'],
        Facebook: result.Facebook,
        'Press Release': result['Press Release']
      },
      visualPrompts: {
        thumbnail: result.thumbnailPrompt,
        banner: result.bannerPrompt,
        staticPost: result.staticPostPrompt,
        scenes: result.scenes || []
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TrackFire running on port ${PORT}`));
