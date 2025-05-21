import AWS from "aws-sdk";

AWS.config.update({ region: 'eu-north-1' }); // Set your region

const dynamodb = new AWS.DynamoDB();

dynamodb.listTables({}, (err, data) => {
  if (err) console.error("Unable to list tables:", err);
  else console.log("Tables in this region:", data.TableNames);
});
