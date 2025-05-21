import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from 'langchain/document';
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
} from 'langchain/prompts';
import { parse } from 'csv-parse/sync';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

// Load and split data from txt, json, or csv
const loadCustomData = async (filePath) => {
  const ext = path.extname(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  let rawText = '';

  if (ext === '.txt') {
    rawText = fileContent;
  } else if (ext === '.json') {
    const json = JSON.parse(fileContent);
    rawText = JSON.stringify(json, null, 2);
  } else if (ext === '.csv') {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    rawText = records
      .map((row) => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join('\n'))
      .join('\n\n');
  } else {
    throw new Error('Unsupported file type. Only .txt, .json, and .csv are supported.');
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const docs = await splitter.createDocuments([rawText]);
  return docs;
};

// Shared memory object
const memory = new BufferMemory({
  returnMessages: true,
  memoryKey: 'chat_history',
});

export const davinci = async (prompt, key, gptVersion, filePath = './data.txt') => {
  
  const docs = await loadCustomData(filePath);

  const embeddings = new OpenAIEmbeddings({ openAIApiKey: key });
  const vectorstore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  const model = new ChatOpenAI({
    openAIApiKey: key,
    modelName: gptVersion,
    temperature: 0.3,
  });

  const chatPrompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a highly intelligent assistant with access to user-provided documents.
       Use only the context provided below to answer user questions accurately and concisely.
       If the answer is not found in the context, say "I don't know". 
       Context:
       {context}`
    ),
    new MessagesPlaceholder('chat_history'),
    HumanMessagePromptTemplate.fromTemplate('{question}'),
  ]);

  const retriever = vectorstore.asRetriever({ k: 5 }); // Retrieve top 5 chunks
  
  const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
    memory,
    qaPrompt: chatPrompt,
    returnSourceDocuments: false, // for debugging, optional
  });
  
  const response= await chain.call({
    question: prompt,
  });
  
  // Optional: Uncomment to see which context was retrieved
  //console.log('Retrieved context:', response.sourceDocuments);
  console.log(response.text);
  
  return response?.text ?? "No response received.";
};











































