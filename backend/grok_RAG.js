/*import { ChatOpenAI } from 'langchain/chat_models/openai';
import { ChatXAI } from '@langchain/xai';


import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { BufferMemory } from 'langchain/memory';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder } from 'langchain/prompts';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

import { getDatasetById } from './controllers/datasets.js';
import { getInstructionsById } from './controllers/instructions.js';
import dotenv from 'dotenv';
dotenv.config();

// Shared memory for chat history

const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});
class xAIEmbeddings {
    constructor(apiKey) {
      this.chat = new ChatXAI({
        xai_api_key: apiKey,
        model: 'grok-3-latest',
      });
    }
  
    async embedQuery(text) {
        const response = await this.chat.invoke([
          ['system', 'Generate a vector embedding for the following text, return ONLY an array of numbers.'],
          ['human', text],
        ]);
      
        // Try safely parsing only if it looks like a JSON array
        try {
          const cleaned = response.content.trim();
          if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
            return JSON.parse(cleaned);
          } else {
            throw new Error(`Invalid embedding response: ${cleaned}`);
          }
        } catch (err) {
          console.error('Failed to parse embedding vector from Grok:', response.content);
          throw err;
        }
      }
      
  
    async embedDocuments(documents) {
      const embeddings = [];
      for (const doc of documents) {
        const embedding = await this.embedQuery(doc);
        embeddings.push(embedding);
      }
      return embeddings;
    }
  }
  
const extractPlainTextFromDataset = (dataset) => {
  const lines = [];

  const traverse = (node, depth = 0) => {
    const indent = '  '.repeat(depth);
    lines.push(`${indent}Name: ${node.name}`);
    lines.push(`${indent}Description: ${node.description}`);
    lines.push(`${indent}Status: ${node.status}`);

    if (node.roles && Array.isArray(node.roles)) {
      node.roles.forEach((role, i) => {
        lines.push(`${indent}Role #${i + 1}: ${role.description || ''}`);
        if (role.instruction?.content) {
          lines.push(`${indent}Instruction: ${role.instruction.content}`);
        }
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, depth + 1));
    }
  };

  traverse(dataset);
  return lines.join('\n\n');
};

export const grokChat_RAG = async (userInput, datasetId) => {
   const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not found in environment');

  const dataset = await getDatasetById(datasetId);
  const instructions = await getInstructionsById('main');
  if (!dataset) throw new Error('Dataset not found in DynamoDB');
  

  const rawText = extractPlainTextFromDataset(dataset);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([rawText]);


  const embeddings = new xAIEmbeddings(apiKey);
  const vectorstore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  const retriever = vectorstore.asRetriever({ k: 5 });

  
  const model = new ChatXAI({
    xai_api_key: apiKey,
    model: 'grok-3-latest',
  });


 // Extract enhanced_texts
const guidance = instructions.instructions
  .map(inst => `- ${inst.enhanced_text.replace(/^"|"$/g, '')}`)
  .join('\n');
console.log(guidance);
// Prompt with context + instruction guidelines
const chatPrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(
    `You are a highly intelligent assistant with access to user-provided documents.

Below are refined instructions on how to handle specific types of user queries:
${guidance}

Use only the context provided below to answer user questions accurately and concisely.
If the answer is not found in the context, say "I don't know".

Context:
{context}`
  ),
  new MessagesPlaceholder('chat_history'),
  HumanMessagePromptTemplate.fromTemplate('{question}'),
]);

  // 🔗 Create the Conversational RAG chain
  const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
    memory,
    qaPrompt: chatPrompt,
    returnSourceDocuments: false,
  });

  // 🤖 Run the chain
  const response = await chain.call({ question: userInput });

  console.log(response.text);
  //console.log('Embedding raw response from Grok:', response.content);

  return response.text;
};*/

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

// 🧠 Shared memory for chat history
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});

// 💬 Main RAG Chat Handler
export const grokChat_RAG = async (userInput, datasetId) => {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error('GROK_API_KEY not found');

  const instructions = await getInstructionsById('main');
  if (!instructions) throw new Error('Instructions not found');

  // 🔍 Retrieve relevant chunks from Pinecone
  const chunks = await retrieveChunks(userInput, datasetId, 5);
  const contextText = chunks.map(chunk => chunk.text).join('\n\n');
  console.log(contextText);
  // 🧭 Format refined guidance
  const guidance = instructions.instructions
    .map(inst => `- ${inst.enhanced_text.replace(/^"|"$/g, '')}`)
    .join('\n');

  // 📜 Prompt template with context + guidance
  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a highly intelligent assistant with access to user-provided documents.

Below are refined instructions on how to handle specific types of user queries:
${guidance}

Use only the context provided below to answer user questions accurately and concisely.
If the answer is not found in the context, say "I don't know".

Context:
${contextText}`
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
    question: userInput,
  });

  return response.text;
};
