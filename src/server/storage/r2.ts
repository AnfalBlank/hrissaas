/**
 * Cloudflare R2 helpers using S3-compatible SDK + presigned URLs.
 * Falls back to a base64 data URL when R2 env vars are missing,
 * so the demo still works without R2 credentials.
 */
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBase = process.env.R2_PUBLIC_BASE_URL; // e.g. https://cdn.manggala.id

let client: S3Client | null = null;
function getClient() {
  if (client) return client;
  if (!accessKeyId || !secretAccessKey || !accountId || !bucket) return null;
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export const r2Configured = () => !!getClient();

export async function presignUpload(opts: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) {
  const c = getClient();
  if (!c) return null;
  const command = new PutObjectCommand({
    Bucket: bucket!,
    Key: opts.key,
    ContentType: opts.contentType,
  });
  const url = await getSignedUrl(c, command, {
    expiresIn: opts.expiresIn ?? 60,
  });
  const publicUrl = publicBase
    ? `${publicBase.replace(/\/$/, "")}/${opts.key}`
    : await getSignedUrl(c, new GetObjectCommand({ Bucket: bucket!, Key: opts.key }), {
        expiresIn: 60 * 60 * 24 * 7,
      });
  return { uploadUrl: url, publicUrl, key: opts.key };
}

export async function uploadDataUrl(opts: {
  key: string;
  dataUrl: string;
}) {
  const c = getClient();
  const match = opts.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  const [, mime, b64] = match;
  const buffer = Buffer.from(b64, "base64");

  if (!c) {
    // Fallback — return the data URL itself so demo still works
    return { url: opts.dataUrl, key: opts.key, fallback: true };
  }

  await c.send(
    new PutObjectCommand({
      Bucket: bucket!,
      Key: opts.key,
      Body: buffer,
      ContentType: mime,
    })
  );

  const publicUrl = publicBase
    ? `${publicBase.replace(/\/$/, "")}/${opts.key}`
    : await getSignedUrl(
        c,
        new GetObjectCommand({ Bucket: bucket!, Key: opts.key }),
        { expiresIn: 60 * 60 * 24 * 7 }
      );

  return { url: publicUrl, key: opts.key, fallback: false };
}
