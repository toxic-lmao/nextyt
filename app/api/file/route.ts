import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

const downloadsDir = path.join(process.cwd(), "downloads");

export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file");
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 400 });
  }

  const filePath = path.join(downloadsDir, file);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);
  // Convert the Node.js stream to a Web ReadableStream and cast it to the expected type.
  const webStream = Readable.toWeb(
    fileStream
  ) as unknown as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${file}"`,
    },
  });
}
