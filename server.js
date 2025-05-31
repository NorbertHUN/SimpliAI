require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { OpenAI } = require('openai');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 🟢 Hang → Szöveg (Whisper)
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  const audioPath = req.file.path;

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1"
    });

    fs.unlinkSync(audioPath);
    res.json({ text: transcription.text });
  } catch (error) {
    console.error(error);
    res.status(500).send('Hiba a beszédfelismerésnél');
  }
});

// 🧠 Szöveg → Válasz (GPT-4o)
app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Te egy kedves, empatikus AI pszichológus vagy, aki nyugodtan és figyelmesen reagál." },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).send('Hiba az AI válasznál');
  }
});

// 🔊 Szöveg → Hang (TTS)
app.post('/speak', async (req, res) => {
  const { text } = req.body;

  try {
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "nova", // lehet: alloy, echo, fable, onyx, nova, shimmer
      input: text
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    speechResponse.body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Hiba a hanggenerálásnál');
  }
});

app.listen(port, () => {
  console.log(`🟢 SimpliAI szerver fut: http://localhost:${port}`);
});
