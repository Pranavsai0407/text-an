import AWS from 'aws-sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { ChatXAI } from '@langchain/xai';
import { Embeddings } from 'langchain/embeddings/base';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import dotenv from 'dotenv';
dotenv.config();

// ─── DynamoDB Setup ──────────────────────────────────────────────────────────
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'Datasets';

// ─── xAIEmbeddings Class ────────────────────────────────────────────────────
class xAIEmbeddings extends Embeddings {
  constructor(apiKey) {
    super();
    this.chat = new ChatXAI({
      xai_api_key: apiKey,
      model: 'grok-3-latest',
    });
  }

  // Embed a single string → return array of numbers.
  // This version finds the first '[' and last ']' and parses only that slice.
  async embedQuery(text) {
    const response = await this.chat.invoke([
      new SystemMessage(
        'Generate a vector embedding for the following text, return ONLY an array of numbers.'
      ),
      new HumanMessage(text),
    ]);

    const content = response.content.trim();
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');

    if (start === -1 || end === -1) {
      throw new Error(`Cannot find JSON array in Grok response: ${content}`);
    }

    const arraySubstring = content.slice(start, end + 1);
    try {
      return JSON.parse(arraySubstring);
    } catch (err) {
      throw new Error(
        `Failed to parse JSON array from Grok response. Extracted: ${arraySubstring}`
      );
    }
  }

  async embedDocuments(documents) {
    const texts = documents.map((doc) =>
      typeof doc === 'string' ? doc : doc.pageContent
    );
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }
}

// ─── Helper: Convert Dataset → Big Text Block ────────────────────────────────
const extractPlainTextFromDataset = (dataset) => {
  const lines = [];

  const traverse = (node, depth = 0) => {
    const indent = '  '.repeat(depth);
    lines.push(`${indent}Name: ${node.name}`);
    lines.push(`${indent}Description: ${node.description}`);
    lines.push(`${indent}Status: ${node.status}`);

    if (Array.isArray(node.roles)) {
      node.roles.forEach((role, i) => {
        lines.push(`${indent}Role #${i + 1}: ${role.description || ''}`);
        if (role.instruction) {
          lines.push(`${indent}Instruction: ${role.instruction}`);
        }
      });
    }

    if (Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, depth + 1));
    }
  };

  traverse(dataset);
  return lines.join('\n\n');
};

// ─── Core: Upsert Entire Dataset into Pinecone in Chunks ──────────────────
const upsertDatasetToPinecone = async (dataset) => {
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  // 1) Convert dataset → one large text block
  const text = extractPlainTextFromDataset(dataset);

  // 2) Split into ~500-character chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  const docs = await splitter.createDocuments([text]);
  console.log('Split into docs:', docs.length);

  // 3) Embed each chunk via xAIEmbeddings
  const embeddings = new xAIEmbeddings(process.env.XAI_API_KEY);
  const vectorsArray = await embeddings.embedDocuments(docs);
  console.log('Generated embeddings:', vectorsArray.length);

  // 4) Build Pinecone records array
  const records = docs.map((doc, i) => ({
    id: `${dataset.id}-${i}`,
    values: vectorsArray[i],
    metadata: {
      datasetId: dataset.id,
      chunkIndex: i,
      // (optional) text: doc.pageContent
    },
  }));

  console.log('--- DEBUG: typeof records ---', typeof records);
  console.log('--- DEBUG: Array.isArray(records) ---', Array.isArray(records));
  console.log('--- DEBUG: records.length ---', records.length);
  console.log('--- DEBUG: sample record[0] ---', records[0]);

  // 5) Upsert under upsertRequest
  const pineconeArg = {
    upsertRequest: {
      vectors: records,
      namespace: dataset.id,
    },
  };
  console.log('Attempting Pinecone upsert with:', JSON.stringify(pineconeArg, null, 2));

  try {
    await index.upsert(pineconeArg);
    console.log('Upserted to Pinecone successfully');
  } catch (pineconeError) {
    console.error('--- PINECONE UPSERT ERROR ---');
    console.error('Error message:', pineconeError.message);
    console.error('Full error object:', pineconeError);
    throw pineconeError;
  }
};

// ─── CRUD Endpoints ─────────────────────────────────────────────────────────

export const getAllDatasets = async (req, res) => {
  try {
    const data = await docClient.scan({ TableName: TABLE_NAME }).promise();
    res.json(data.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDatasetById = async (id) => {
  const result = await docClient
    .get({ TableName: TABLE_NAME, Key: { id } })
    .promise();
  return result.Item;
};

export const createDataset = async (req, res) => {
  try {
    const item = req.body;
    await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
    //await upsertDatasetToPinecone(item);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error putting item in DynamoDB:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    //console.log(item);
    await docClient
      .update({
        TableName: TABLE_NAME,
        Key: { id: id.toString() },
        UpdateExpression:
          'set #name = :name, description = :description, converted = :converted, #status = :status, #roles = :roles, children = :children',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#status': 'status',
          '#roles': 'roles',
        },
        ExpressionAttributeValues: {
          ':name': item.name,
          ':description': item.description,
          ':converted': item.converted,
          ':status': item.status,
          ':roles': item.roles,
          ':children': item.children || [],
        },
        ReturnValues: 'UPDATED_NEW',
      })
      .promise();

    //const updatedDataset = { id, ...item };
    //await upsertDatasetToPinecone(updatedDataset);
    res.json({ message: 'Dataset updated' });
  } catch (error) {
    console.error('Error in updateDataset:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteDataset = async (req, res) => {
  try {
    const { id } = req.params;
    await docClient.delete({ TableName: TABLE_NAME, Key: { id } }).promise();
    //(Optional) Delete entire Pinecone namespace
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const namespace = index.namespace(id);
    await namespace.deleteAll();
    //console.log(namespace);
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    res.status(500).json({ error: error.message });
  }
};
