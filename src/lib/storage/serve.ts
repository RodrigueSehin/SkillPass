import type { StorageService } from "./storage";

/** Streams a stored file. Authorization must already be done by the caller. */
export function serveStoredFile(
  content: Awaited<ReturnType<StorageService["read"]>>,
  fileName: string,
  mimeType: string,
): Response {
  if ("redirectUrl" in content) return Response.redirect(content.redirectUrl, 302);
  return new Response(Buffer.from(content.bytes), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      // Uploaded content must never execute in the app's origin.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, no-store",
    },
  });
}
