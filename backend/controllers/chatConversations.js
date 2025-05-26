import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "eu-north-1",
});

const docClient = new AWS.DynamoDB.DocumentClient();

export const saveConversation = async (req, res) => {
  const { chatId,adminId, messages, status, timestamp } = req.body;

  const dynamoFormatMessages = messages.map(msg => ({
    M: {
      content: { S: msg.content },
      role: { S: msg.role }
    }
  }));

  const params = {
    TableName: "ChatConversations",
    Item: {
      chatId: { S: chatId },
      adminId: {S : adminId},
      messages: { L: dynamoFormatMessages },
      status: { S: status },
      timestamp: { S: timestamp }
    }
  };

  try {
    const result = await new AWS.DynamoDB().putItem(params).promise();
    res.status(200).json({ message: "Conversation saved successfully", result });
  } catch (err) {
    console.error("DynamoDB error:", err);
    res.status(500).json({ message: "Failed to save conversation", error: err });
  }
};

export const getConversation = async (req, res) => {
    const { chatId } = req.params;
  
    const params = {
      TableName: "ChatConversations",
      Key: {
        chatId: { S: chatId }
      }
    };
  
    try {
      const result = await new AWS.DynamoDB().getItem(params).promise();
  
      if (!result.Item) {
        return res.status(404).json({ message: "Conversation not found" });
      }
  
      // Convert DynamoDB format back to JSON
      const messages = result.Item.messages.L.map(msg => ({
        content: msg.M.content.S,
        role: msg.M.role.S,
      }));
  
      const conversation = {
        chatId: result.Item.chatId.S,
        adminId: result.Item.adminId.S,
        messages,
        status: result.Item.status.S,
        timestamp: result.Item.timestamp.S,
      };
  
      res.status(200).json(conversation);
    } catch (err) {
      console.error("DynamoDB get error:", err);
      res.status(500).json({ message: "Failed to retrieve conversation", error: err });
    }
  };
  
