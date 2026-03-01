import * as Minio from 'minio';
import { config } from '../config';

const [host, portStr] = config.MINIO_ENDPOINT.replace(/^https?:\/\//, '').split(':');
const port = parseInt(portStr || '9000', 10);

const minioClient = new Minio.Client({
  endPoint: host,
  port: port,
  useSSL: config.MINIO_USE_SSL,
  accessKey: config.MINIO_ROOT_USER,
  secretKey: config.MINIO_ROOT_PASSWORD,
});

const DEFAULT_BUCKET = 'documents';

export async function getPresignedUploadUrl(
  bucket: string,
  objectName: string,
  expirySeconds = 3600
): Promise<string> {
  return minioClient.presignedPutObject(bucket, objectName, expirySeconds);
}

export async function getPresignedDownloadUrl(
  bucket: string,
  objectName: string,
  expirySeconds = 3600
): Promise<string> {
  return minioClient.presignedGetObject(bucket, objectName, expirySeconds);
}

export async function upload(
  bucket: string,
  objectName: string,
  data: Buffer,
  contentType = 'application/octet-stream'
): Promise<string> {
  await minioClient.putObject(bucket, objectName, data, data.length, {
    'Content-Type': contentType,
  });
  const protocol = config.MINIO_USE_SSL ? 'https' : 'http';
  return `${protocol}://${config.MINIO_ENDPOINT}/${bucket}/${objectName}`;
}

export async function download(
  bucket: string,
  objectName: string
): Promise<Buffer> {
  const stream = await minioClient.getObject(bucket, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function remove(bucket: string, objectName: string): Promise<void> {
  await minioClient.removeObject(bucket, objectName);
}

export async function healthCheck(): Promise<boolean> {
  try {
    await minioClient.bucketExists(DEFAULT_BUCKET);
    return true;
  } catch {
    try {
      const buckets = await minioClient.listBuckets();
      return Array.isArray(buckets);
    } catch {
      return false;
    }
  }
}

export { minioClient, DEFAULT_BUCKET };
