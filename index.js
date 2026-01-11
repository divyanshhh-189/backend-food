const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ✅ Use memory storage
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Optional health check
app.get('/', (req, res) => {
  res.send('Food Recipe Backend is running 🚀');
});

app.post('/api/recipe', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // ✅ Convert image buffer directly to base64
    const base64Image = req.file.buffer.toString('base64');

    const geminiRes = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              { text: 'Generate a recipe from this food image. Include ingredients and preparation steps:' },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      },
      {
        params: {
          key: process.env.GEMINI_API_KEY,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const recipeText =
      geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    res.json({ recipe: recipeText });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
