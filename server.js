const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const multer = require('multer');
const upload = multer();
const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ARTIST_PROFILES = {
  'DJ Akai': {
    visualDNA: `DJ Akai is a hooded, mysterious street intellectual. Visual world: dark urban environments, city blueprints and sacred geometry overlays, leather jacket, aviator sunglasses, chains. Color palette: deep blue, electric red, dark charcoal, sparks of light. Cinematic style: noir, high contrast, cinematic street photography. Virgo energy — precise, analytical, powerful but controlled. Every visual should feel like a secret being revealed in a dark city at midnight.`,
    narratorStyle: `DJ Akai narrates from a place of quiet power and street wisdom. He observes, he reflects, he knows more than he shows. First person — grounded, cool, never desperate. The man in the room who everyone notices but nobody fully knows.`,
    contentTone: `Dark, intelligent, magnetic. Underground luxury. Speaks to people who think deeper than the surface. Never tries too hard.`
  },
  'AKXION': {
    visualDNA: `AKXION are twin brothers — raw, rebellious, urban warriors. Visual world: graffiti walls, brick buildings, street steps, city rooftops at night, chain link fences. Colorful hair — blue and red/gold. Black tactical streetwear with gold chains and rings. Color palette: gritty urban tones, flashes of neon, raw concrete textures. Cinematic style: gritty street photography, handheld energy, young and dangerous.`,
    narratorStyle: `AKXION narrates with dual energy — two voices, two perspectives, sometimes in harmony sometimes in tension. Young, raw, honest. Street poetry. They live what they sing.`,
    contentTone: `Raw, real, rebellious. Speaks to young people navigating a world that wasn't built for them. K-pop energy meets street credibility.`
  },
  'House of Lunita': {
    visualDNA: `House of Lunita is warm, golden, feminine divine. Visual world: beaches at sunset, golden hour light, ocean waves, flowers, natural landscapes, warm interiors with soft candle light. Curly hair, natural beauty, earth tones, gold jewelry. Color palette: warm amber, soft gold, ocean blue, sunset orange, cream. Cinematic style: warm film photography, soft focus, natural light, intimate and radiant.`,
    narratorStyle: `House of Lunita narrates from the heart — open, vulnerable, powerful in her softness. She feels everything deeply and isn't afraid to show it. First person feminine — warm, honest, soulful.`,
    contentTone: `Warm, soulful, healing. Speaks to people who lead with their heart. R&B soul meets natural spirituality.`
  },
  'Nocturnal Bliss': {
    visualDNA: `Nocturnal Bliss lives in permanent darkness and gothic beauty. Visual world: foggy castles, dark forests, moonlit fields, black horses, abandoned places, candles in the dark, crumbling architecture. All black clothing, oversized dark coats, black sunglasses, chains. Color palette: pure black, deep grey, muted browns, cold moonlight silver, occasional blood red accent. Cinematic style: gothic horror meets high fashion editorial, desaturated, moody, haunting.`,
    narratorStyle: `Nocturnal Bliss narrates from the shadows — detached, poetic, dark. Sees beauty in pain. Neither fully alive nor fully gone. First person — brooding, philosophical, uncomfortably honest.`,
    contentTone: `Dark, poetic, alternative. Speaks to people who find comfort in the night. Gothic soul meets modern emo.`
  },
  'R.A.H.U.': {
    visualDNA: `R.A.H.U. is the supergroup — all artists unified. Visual world: dark enchanted forests, moonlit castle ruins, ancient trees with twisted roots, mystical fog, occult symbols, collective power. Four figures standing together in darkness. Color palette: deep forest green, midnight black, moonlight silver, hints of gold. Cinematic style: epic fantasy meets dark mythology, wide shots, otherworldly atmosphere.`,
    narratorStyle: `R.A.H.U. narrates as a collective consciousness — we, not I. Ancient, wise, powerful. Speaks for a generation that sees through the illusion. The voice of the awakened.`,
    contentTone: `Mystical, powerful, unified. Speaks to the spiritually aware, the seekers, the ones who feel called to something bigger. R.A.H.U. = Respect, Authenticity, Honor, Uniqueness.`
  }
};

app.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { trackTitle, artistName, lyrics } = req.body;
    const base64Audio = req.file.buffer.toString('base64');
    const fmt = req.file.mimetype.includes('wav') ? 'wav' : 'mp3';

    const artistProfile = ARTIST_PROFILES[artistName] || null;
    const artistSection = artistProfile
      ? `\nARTIST PROFILE:\nVisual DNA: ${artistProfile.visualDNA}\nNarrator Style: ${artistProfile.narratorStyle}\nContent Tone: ${artistProfile.contentTone}\n\nAll visuals, scenes, and content MUST be filtered through this artist's specific visual world and narrator perspective.`
      : '';

    const lyricsSection = lyrics
      ? `\nLYRICS PROVIDED:\n${lyrics}\n\nBefore generating anything, identify:\n- WHO is the narrator? (gender, relationship to subject, emotional state)\n- What is the narrator's PERSPECTIVE? (watching from afar, confronting someone, reflecting alone, etc.)\n- What is the KEY VISUAL MOMENT in the song?\n- What does the narrator SEE, FEEL, and WANT?\n\nUse ALL of this to generate every visual from the NARRATOR'S point of view. Put the viewer IN the narrator's shoes.\n\nFor example: if the narrator is a man watching his ex at her wedding from the back of the room — one scene must show HIS VIEW of her across the room, another shows him standing alone with a drink trying not to be noticed, another shows his face watching her laugh. Tell the story from HIS eyes, not a third-party observer.`
      : '';

    const prompt = `You are a visionary music marketing strategist, creative director, and music video storyboard artist. You make people feel like a song found THEM at exactly the right moment. You translate lyrics into cinematic scenes told from the narrator's perspective.

Listen to this track. Return ONLY a valid JSON object.${artistSection}${lyricsSection}

Artist: ${artistName || 'Independent Artist'}
Track: ${trackTitle || 'Untitled'}
Label: R.A.H.U. Records

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
  "uniqueHook": "the one emotional truth this song captures",
  "narratorPOV": "1-2 sentences: who is the narrator, their exact perspective, what they want",
  "suggestedTitle": "Scroll-stopping, emotionally magnetic title. Like a tarot reading or message from the universe. Makes people think 'wait, is this about me?'",
  "Instagram": "4-6 punchy lines with rhythm. Cinematic, magnetic. Speak to the feeling. 20-25 hashtags on new line.",
  "TikTok": "2-3 lines MAX. 'if this found you' or 'this is for' energy. 15-20 trending hashtags.",
  "YouTube": "150-200 words. Opens with emotional story. Describes sound. Includes artist and R.A.H.U. Records. SEO-optimized but human.",
  "Twitter/X": "Under 240 chars. One gut-punch sentence. 2-3 hashtags.",
  "Facebook": "Conversational, warm, community. 100-150 words. 5-8 hashtags.",
  "Press Release": "Third-person, 150 words. Cinematic opening. Sonic world, emotional core, artist vision. Ends with R.A.H.U. Records.",
  "thumbnailPrompt": "The single most powerful visual moment from the NARRATOR's perspective. Exact scene from lyrics. Character details, setting, lighting, camera angle. Photorealistic cinematic. Filtered through artist visual DNA. No text.",
  "bannerPrompt": "Wide format. Artist's entire visual world. Pull from artist visual DNA. Dark, atmospheric, cinematic. No text.",
  "staticPostPrompt": "Square. Striking moment from the song as album art. Artist visual DNA. No text.",
  "scenes": [
    {
      "lyric": "exact lyric line this scene represents",
      "section": "Intro / Verse 1 / Pre-Chorus / Chorus / Verse 2 / Bridge / Outro",
      "narratorView": "what the narrator is doing/seeing/feeling in this exact moment",
      "imagePrompt": "Highly specific cinematic prompt from NARRATOR's POV. Exact scene from lyrics. Character description, setting, lighting, camera angle, color palette, emotional atmosphere. Filtered through artist visual DNA. Minimum 3 sentences. No text in image.",
      "animationPrompt": "1-2 sentences for Suno/Canva video. Specific camera movement and atmospheric motion."
    }
  ]
}

CRITICAL RULES:
- narratorPOV identified first, informs everything
- ALL scenes from NARRATOR's perspective — what they see and feel
- Must include shots of narrator observing from their vantage point
- 8-12 scenes covering full song arc
- Each scene visually distinct
- Every visual filtered through artist visual DNA
- Never use: banger, fire, lit, slaps, hits different
- R.A.H.U. Records in YouTube and Press Release`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'input_audio', input_audio: { data: base64Audio, format: fmt } },
          { type: 'text', text: prompt }
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
        narratorPOV: result.narratorPOV,
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
