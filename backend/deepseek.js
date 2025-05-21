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

export const deepseekChat = async (userInput,filePath = './data.txt') => {
    const apiKey = "sk-bc8bb1c97f6c4fa98a4a22451cf34663";
  if (!apiKey) {
    throw new Error('DeepSeek API key not found. Please set DEEPSEEK_API_KEY');
  }

  const fileContent = loadFileContent(filePath);

  // Only inject the system prompt once at the start
  if (conversationHistory.length === 0) {
    conversationHistory.push(
      new SystemMessage(
        `You are a helpful assistant. Use the following context to answer the user's questions. 
If the answer is not in the context, respond with "I don't know".
Context:
${fileContent}`
      )
    );
  }

  // Add user input
  conversationHistory.push(new HumanMessage(userInput));

  const model = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: 'deepseek-chat',
    temperature: 0.3,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1', // DeepSeek's base URL
    },
  });

  const response = await model.call(conversationHistory);

  // Save the model's reply in history
  conversationHistory.push(new AIMessage(response.content));

  console.log(response.content);
  return response.content;
};
