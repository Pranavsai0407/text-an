import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from 'langchain/schema';
import { parse } from 'csv-parse/sync';


// Global conversation history
const conversationHistory = [];

// Load and format content from txt, json, or csv
const loadFileContent = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');

  if (ext === '.txt') {
    return content;
  } else if (ext === '.json') {
    return JSON.stringify(JSON.parse(content), null, 2);
  } else if (ext === '.csv') {
    const records = parse(content, { columns: true, skip_empty_lines: true });
    return records
      .map(row => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n'))
      .join('\n\n');
  } else {
    throw new Error('Unsupported file type. Only .txt, .json, and .csv are supported.');
  }
};

export const grokChat = async (userInput,filePath = './data.txt') => {
    const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error('API key not found. Please set API_KEY');
  }

  const fileContent = loadFileContent(filePath);

  // Only inject the system prompt once at the start
  if (conversationHistory.length === 0) {
    conversationHistory.push(
      new SystemMessage(
        `You are a highly intelligent assistant with access to user-provided documents.
       Use only the context provided below to answer user questions accurately and concisely.
If the answer is not in the context, respond with "I don't know".

When providing image links, format them in Markdown so they render as images in the chat interface. For example:
- Solar Street Light: ![Solar Street Light](https://example.com/solar-street-light.jpg)

Context:
${fileContent}`
      )
    );
  }
  // Add user input
  conversationHistory.push(new HumanMessage(userInput));

  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: 'grok-3-latest',
    temperature: 0.6,
    configuration: {
      baseURL: 'https://api.x.ai/v1', // base URL
    },
  });

  const response = await model.call(conversationHistory);

  // Save the model's reply in history
  conversationHistory.push(new AIMessage(response.content));

  console.log(response.content);
  return response.content;
};
