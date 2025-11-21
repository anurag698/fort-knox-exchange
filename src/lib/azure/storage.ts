// Azure Blob Storage Client
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

// Blob Storage Configuration
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'fortknox-assets';

// Create Blob Service Client
export const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get container client
export function getContainerClient(): ContainerClient {
    return blobServiceClient.getContainerClient(containerName);
}

// Initialize storage container (run once on setup)
export async function initializeStorage() {
    const containerClient = getContainerClient();
    await containerClient.createIfNotExists({
        access: 'blob',
    });
    console.log('✅ Azure Blob Storage initialized successfully');
}

// Upload file
export async function uploadFile(
    fileName: string,
    fileContent: Buffer | Blob,
    contentType?: string
): Promise<string> {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.uploadData(fileContent, {
        blobHTTPHeaders: {
            blobContentType: contentType,
        },
    });

    return blockBlobClient.url;
}

// Download file
export async function downloadFile(fileName: string): Promise<Buffer> {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    const downloadResponse = await blockBlobClient.download();
    const downloaded = await streamToBuffer(downloadResponse.readableStreamBody!);
    return downloaded;
}

// Delete file
export async function deleteFile(fileName: string): Promise<void> {
    const containerClient = getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.delete();
}

// List files
export async function listFiles(prefix?: string): Promise<string[]> {
    const containerClient = getContainerClient();
    const fileNames: string[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
        fileNames.push(blob.name);
    }

    return fileNames;
}

// Utility: Convert stream to buffer
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}
