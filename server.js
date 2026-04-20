const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/analyze', async (req, res) => {
  try {
    const { trackTitle, audioFeatures } = req.body;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this music track and generate a marketing campaign:
Track Title: ${trackTitle}
Audio Features: ${JSON.stringify(audioFeatures)}

Provide: genre tags, target audience, playlist pitching strategy,
social media campaign ideas, and press release angle.
Format as JSON.`
      }]
    });

    const campaignText = message.content[0].text;
    const campaign = JSON.parse(campaignText);
    res.json({ success: true, campaign });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TrackFire running on port ${PORT}`));
