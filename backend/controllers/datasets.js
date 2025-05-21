import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "eu-north-1",
});


const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'Datasets';

// Flatten the hierarchical structure into a list if needed

export const getAllDatasets = async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };
    const data = await docClient.scan(params).promise();
    res.json(data.Items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDatasetById = async (id) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id },
  };

  const result = await docClient.get(params).promise();
  return result.Item;
};

export const createDataset = async (req, res) => {

  try {
    
    const item = req.body;
    const params = {
      TableName: TABLE_NAME,
      Item: item,
    };
    const listParams = {
  TableName: 'Datasets',
  Limit: 1,
};

try {
  const data = await docClient.scan(listParams).promise();
  console.log('Scan test success:', data.Items);
} catch (err) {
  console.error('Scan test failed:', err);
}

    await docClient.put(params).promise();
    console.log(1);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error putting item in DynamoDB:", error); // Add this
    res.status(500).json({ error: error.message });
  }
};

export const updateDataset = async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;

    const params = {
      TableName: TABLE_NAME,
      Key: { id: id.toString() },
      UpdateExpression:
        'set #name = :name, description = :description, #status = :status, #roles = :roles, children = :children',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#status': 'status',
        '#roles': 'roles',    // add alias for roles
      },
      ExpressionAttributeValues: {
        ':name': item.name,
        ':description': item.description,
        ':status': item.status,
        ':roles': item.roles,
        ':children': item.children || [],
      },
      ReturnValues: 'UPDATED_NEW',
    };
    
    console.log("Update params:", JSON.stringify(params, null, 2));
    const result = await docClient.update(params).promise();
    console.log("Update result:", result);
    res.json(result.Attributes);
  } catch (error) {
    console.error("Error in updateDataset:", error);
    res.status(500).json({ error: error.message });
  }
};


export const deleteDataset = async (req, res) => {
  try {
    const { id } = req.params;

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    await docClient.delete(params).promise();
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

