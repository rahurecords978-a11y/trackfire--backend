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
    const { trackTitle } = req.body;
    const audioBuffer = req.file.buffer;
    const base64Audio = audioBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-audio-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this music track titled "${trackTitle}" and generate a marketing campaign. Provide: genre tags, target audience, playlist pitching strategy, social media campaign ideas, and press release angle. Format as JSON.`
            },
            {
              type: 'input_audio',
              input_audio: { data: base64Audio, format: 'mp3' }
            }
          ]
        }
      ]
    });

    const campaign = JSON.parse(response.choices[0].message.content);
    res.json({ success: true, campaign });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TrackFire running on port ${PORT}`));
