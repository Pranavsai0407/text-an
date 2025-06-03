import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

// ─── DynamoDB Setup ──────────────────────────────────────────────────────────
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'RawInstructions';

export const createInstruction = async (req, res) => {
  try {
    const item = req.body;
    await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error putting item in DynamoDB:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getInstructionsById = async (id) => {
  const result = await docClient
    .get({ TableName: 'EnhancedInstructions', Key: {id} })
    .promise();
  return result.Item;
};