import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { davinci } from './ask.js';
import { deepseekChat } from './deepseek.js';
import { grokChat } from './grok.js';
import datasetRoutes from './routes/datasets.js';
import roleRoutes from './routes/roles.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// 🔮 Ask using davinci
app.use('/api/datasets', datasetRoutes);
app.use('/api/roles', roleRoutes);

app.post('/ask', async (req, res) => {
  try {
    const { prompt, key, gptVersion } = req.body;
    if (!prompt || !key || !gptVersion) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const answer = await davinci(prompt, key, gptVersion);
    res.status(200).json({ response: answer });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔮 Ask using deepseek
app.post('/ask1', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing required fields' });

    const answer = await deepseekChat(prompt);
    res.status(200).json({ response: answer });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🔮 Ask using grok
app.post('/ask2', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing required fields' });

    const answer = await grokChat(prompt);
    res.status(200).json({ response: answer });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5001, () => {
  console.log('Server running on http://localhost:5001');
});
