import AWS from "aws-sdk";

AWS.config.update({ region: 'eu-north-1' }); // Set your region

const dynamodb = new AWS.DynamoDB();
const TABLE_NAME = "Datasets"; // DynamoDB table name

export { dynamoClient, TABLE_NAME };
