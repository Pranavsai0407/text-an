import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();
import { v4 as uuidv4 } from 'uuid';

// ─── DynamoDB Setup ──────────────────────────────────────────────────────────
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: 'eu-north-1',
});
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'EnhancedInstructions';

export const updateInstruction = async (req, res) => {
  try {
    const { instructionId, updatedText, status } = req.body;

    const { Item } = await docClient.get({
      TableName: TABLE_NAME,
      Key: { id: 'main' },
    }).promise();

    const instructionToUpdate = Item.instructions.find(
      inst => inst.instructionId === instructionId
    );

    if (!instructionToUpdate) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    if (updatedText) instructionToUpdate.enhanced_text = updatedText;
    if (status) instructionToUpdate.status = status;

    await docClient.put({
      TableName: TABLE_NAME,
      Item: {
        id: 'main',
        instructions: Item.instructions,
      },
    }).promise();

    res.json({ 
      message: 'Instruction updated successfully',
      instruction: instructionToUpdate
    });
  } catch (error) {
    console.error('Error updating instruction:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteInstruction = async (req, res) => {
  try {
    const { instructionId } = req.params;

    const data = await docClient
      .get({
        TableName: TABLE_NAME,
        Key: { id: 'main' },
      })
      .promise();

    const instructions = data.Item.instructions;

    const filteredInstructions = instructions.filter(
      (inst) => inst.instructionId!== instructionId
    );

    if (instructions.length === filteredInstructions.length) {
      return res.status(404).json({ message: 'Instruction not found' });
    }

    await docClient
      .put({
        TableName: TABLE_NAME,
        Item: {
          id: 'main',
          instructions: filteredInstructions,
        },
      })
      .promise();

    res.json({ message: 'Instruction deleted successfully' });
  } catch (error) {
    console.error('Error deleting instruction:', error);
    res.status(500).json({ error: error.message });
  }
};



export const createInstruction = async (req, res) => {
  try {
    const { enhanced_text, status = 'ACTIVE' } = req.body;

    if (!enhanced_text) {
      return res.status(400).json({ message: 'Instruction text is required' });
    }

    // Get the current document
    const data = await docClient
      .get({
        TableName: TABLE_NAME,
        Key: { id: 'main' },
      })
      .promise();

    // Prepare the new instruction
    const newInstruction = {
      instructionId: uuidv4(),
      enhanced_text,
      status,
      created_at: new Date().toISOString()
    };

    // Update the instructions array
    const currentInstructions = data.Item?.instructions || [];
    const updatedInstructions = [...currentInstructions, newInstruction];

    // Save back to DynamoDB
    await docClient
      .put({
        TableName: TABLE_NAME,
        Item: {
          id: 'main',
          instructions: updatedInstructions,
        },
      })
      .promise();

    res.status(201).json({ 
      message: 'Instruction created successfully',
      instruction: newInstruction
    });
  } catch (error) {
    console.error('Error creating instruction:', error);
    res.status(500).json({ error: error.message });
  }
};