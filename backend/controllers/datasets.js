import AWS from 'aws-sdk';
import { Pinecone } from '@pinecone-database/pinecone';
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
