import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET || "yalanelab-assets";
const PUBLIC = process.env.R2_PUBLIC_URL || "";

export async function uploadToR2(key: string, body: Buffer | Uint8Array | string, contentType: string): Promise<string> {
  await R2.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }));
  return `${PUBLIC}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await R2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function getUploadUrl(key: string, contentType: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(R2, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn });
}

export const R2Keys = {
  worldThumbnail:  (worldId: string)           => `worlds/${worldId}/thumbnail.jpg`,
  worldScreenshot: (worldId: string, i: number) => `worlds/${worldId}/screenshot_${i}.jpg`,
  worldWebGL:      (worldId: string)           => `worlds/${worldId}/webgl/index.html`,
  avatarThumb:     (userId: string)            => `avatars/${userId}/thumbnail.png`,
};
