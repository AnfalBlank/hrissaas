/* dynamic route - reads cookies */
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { ok, handleError } from "@/server/api/respond";
import { presignUpload, uploadDataUrl, r2Configured } from "@/server/storage/r2";

const PresignBody = z.object({
  filename: z.string(),
  contentType: z.string(),
  category: z.enum(["selfie", "leave", "avatar"]).default("selfie"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = PresignBody.parse(await req.json());
    const ext = body.filename.split(".").pop() ?? "jpg";
    const key = `${session.companyId}/${body.category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const result = await presignUpload({
      key,
      contentType: body.contentType,
    });

    if (!result) {
      return ok({
        configured: false,
        message: "R2 belum dikonfigurasi. Gunakan endpoint /api/upload/data untuk fallback.",
      });
    }

    return ok({ configured: true, ...result });
  } catch (e) {
    return handleError(e);
  }
}

const DataBody = z.object({
  dataUrl: z.string(),
  filename: z.string().default("upload.jpg"),
  category: z.enum(["selfie", "leave", "avatar"]).default("selfie"),
});

// Fallback: send a base64 data URL, server stores or echoes it back.
export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = DataBody.parse(await req.json());
    const ext = body.filename.split(".").pop() ?? "jpg";
    const key = `${session.companyId}/${body.category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const result = await uploadDataUrl({ key, dataUrl: body.dataUrl });
    return ok({ ...result, configured: r2Configured() });
  } catch (e) {
    return handleError(e);
  }
}
