import { ChatXAI } from '@langchain/xai';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from 'langchain/prompts';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { getInstructionsById } from './controllers/instructions.js';
import { retrieveChunks } from './retrieveChunks.js';
import dotenv from 'dotenv';
dotenv.config();

// Shared memory
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});

export const grokChat_RAG = async (userInput, datasetId) => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not found');

  // Get instructions
  const instructions = await getInstructionsById('main');
  const guidance = instructions.instructions
    .map(inst => `- ${inst.enhanced_text.replace(/^"|"$/g, '')}`)
    .join('\n');

  // Get relevant chunks from Pinecone
  const chunks = await retrieveChunks(userInput, datasetId, 10);
  const contextText = chunks.map(chunk => chunk.text).join('\n\n');

  // Fake retriever just for ConversationalRetrievalQAChain requirement
  const fakeRetriever = {
    getRelevantDocuments: async () =>
      chunks.map(chunk => ({
        pageContent: chunk.text,
        metadata: chunk.metadata || {},
      })),
  };

  // Define prompt
  const chatPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a helpful assistant with access to user-provided context.

Instructions:
${guidance}

Use only the context below to answer the user's question.
If the answer is not in the context, say "I don't know".

Context:
{context}`
  ),
  new MessagesPlaceholder('chat_history'),
  HumanMessagePromptTemplate.fromTemplate('{question}'),
]);

const model = new ChatXAI({
  xai_api_key: apiKey,
  model: 'grok-3-latest',
});

// Pass both `question` and `context` in the SINGLE `question` input

  // Create the chain
  const chain = ConversationalRetrievalQAChain.fromLLM(model, fakeRetriever, {
    memory,
    qaPrompt: chatPrompt,
    returnSourceDocuments: false,
  });

  // Run the chain
  const response = await chain.call({
  question: `Context:\n${contextText}\n\nQuestion:\n${userInput}`,
  });

  return response.text;
};

/*import { ChatXAI } from '@langchain/xai';
import { BufferMemory } from 'langchain/memory';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder
} from 'langchain/prompts';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { getInstructionsById } from './controllers/instructions.js';
import { retrieveChunks } from './retrieveChunks.js';
import dotenv from 'dotenv';
dotenv.config();

// 🧠 Shared memory for chat history
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});

// 💬 Main RAG Chat Handler
export const grokChat_RAG = async (userInput, datasetId) => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not found');

  //const dataset = await getDatasetById(datasetId);

  const instructions = await getInstructionsById('main');
  console.log(instructions.instructions);
  var guidance="";
  if (instructions.instructions) {
    guidance = instructions.instructions
    .map(inst => `- ${inst.enhanced_text.replace(/^"|"$/g, '')}`)
    .join('\n');
  };
   
  
  // 🔍 Retrieve relevant chunks from Pinecone
  const chunks = await retrieveChunks(userInput, datasetId, 10);
  const contextText = chunks.map(chunk => chunk.text).join('\n\n');
  //console.log(contextText);
  // 🧭 Format refined guidance
  //console.log(guidance);

  // 📜 Prompt template with context + guidance
  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `
       You are a highly intelligent assistant with access to user-provided documents.
       Use only the context provided below to answer user questions accurately and concisely.
      If the answer is not in the context, respond with "I don't know".

      When providing image links, format them in Markdown so they render as images in the chat interface. For example:
      - Solar Street Light: ![Solar Street Light](https://example.com/solar-street-light.jpg)`
    ),
    new MessagesPlaceholder('chat_history'),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
  ]);

  // 🤖 Grok Model (xAI)
  const model = new ChatXAI({
    xai_api_key: apiKey,
    model: 'grok-3-latest',
  });

  // 🔂 Fake retriever returns Pinecone-matched context
  const fakeRetriever = {
    getRelevantDocuments: async () => {
      return chunks.map(chunk => ({
        pageContent: chunk.text,
        metadata: chunk.metadata || {},
      }));
    },
  };
  
  
  // 🔗 Conversational RAG chain with memory and prompt
  const chain = ConversationalRetrievalQAChain.fromLLM(model, fakeRetriever, {
  memory,
  qaPrompt: chatPrompt,
  returnSourceDocuments: false,
  });

  
  
  console.log(1);
  // 🚀 Run the chain with the user question
  const response = await chain.call({
    question: `Your foremost directive is to strictly adhere to the instructions provided in ${guidance}.  ${userInput} `,
  });

  return response.text;
};*/
