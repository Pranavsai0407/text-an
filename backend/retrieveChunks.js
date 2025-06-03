import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI} from 'openai'; 
import dotenv from 'dotenv';
dotenv.config();
//console.log(process.env.OPENAI_API_KEY); // should match .env

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_INDEX_NAME = 'rag-dataset'; 

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY,
});


// Initialize OpenAI Embeddings client
const openaiEmbeddings = new OpenAI({
    apiKey: OPENAI_API_KEY,
    organization: 'org-DukPxm8sEENmwFivEQvtylgA',
});
//console.log(OPENAI_API_KEY);
/**
 * Retrieves relevant chunks from Pinecone based on a user query and a specific dataset ID.
 *
 * @param {string} userQuery - The natural language query from the user.
 * @param {string} targetDatasetId - The ID of the dataset to filter by (this is your namespace ID).
 * @param {number} [topK=5] - The number of top relevant results to retrieve.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of retrieved chunks,
 * each including its ID, score, and metadata (original text).
 */
async function retrieveChunks(userQuery, targetDatasetId, topK = 5) {
    try {
        //console.log(1);
        console.log(`Retrieving chunks for query: "${userQuery}" in dataset: "${targetDatasetId}"`);

        // 1. Get the embedding for the user's query using OpenAI
        console.log("Generating embedding for user query...");
        const queryEmbeddingResponse = await openaiEmbeddings.embeddings.create({
            model: "text-embedding-3-small", // Must match the model used for indexing
            input: userQuery,
            encoding_format: "float"
        });

        if (!queryEmbeddingResponse.data || queryEmbeddingResponse.data.length === 0) {
            throw new Error("Failed to generate embedding for the user query.");
        }

        const queryVector = queryEmbeddingResponse.data[0].embedding;
        console.log(`Query embedding generated (length: ${queryVector.length}).`);

        const index = pinecone.Index(PINECONE_INDEX_NAME);
        const namespace = index.namespace(targetDatasetId);
        console.log(`Querying Pinecone index '${PINECONE_INDEX_NAME}' in namespace '${targetDatasetId}'...`);
        const queryResult = await namespace.query({
            vector: queryVector,
            topK: topK,
            includeMetadata: true,
        });

        if (!queryResult.matches || queryResult.matches.length === 0) {
            console.log("No matching chunks found.");
            return [];
        }

        console.log(`Found ${queryResult.matches.length} matching chunks.`);

        const retrievedChunks = queryResult.matches.map(match => ({
            id: match.id,
            score: match.score,
            text: match.metadata.text,
            type: match.metadata.type,
            product: match.metadata.product,
            datasetId: match.metadata.datasetId
        }));

        return retrievedChunks;

    } catch (error) {
        console.error("Error during chunk retrieval:", error);
        throw error;
    }
}


export {retrieveChunks};