import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

const ytdlpPath = path.join(process.cwd(), "yt-dlp.exe");
const ffmpegPath = path.join(process.cwd(), "bin", "ffmpeg.exe"); // Direct path to ffmpeg.exe
const downloadsDir = path.join(process.cwd(), "downloads");

export async function POST(req: NextRequest) {
  try {
    const { url, videoId, audioId } = await req.json();
    if (!url || !videoId || !audioId) {
      return NextResponse.json(
        { error: "Missing url, videoId or audioId" },
        { status: 400 }
      );
    }

    // Ensure the downloads directory exists
    await fs.mkdir(downloadsDir, { recursive: true });

    // Generate a unique file name and use the downloads folder
    const randomFileName = `video_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}.mp4`;
    const tempOutput = path.join(downloadsDir, randomFileName);

    // Delete temp file if it exists
    try {
      await fs.unlink(tempOutput);
    } catch {}

    // Spawn yt-dlp to download and merge using ffmpeg
    const ytdlp = spawn(ytdlpPath, [
      "-f",
      `${videoId}+${audioId}`,
      "--merge-output-format",
      "mp4",
      "--ffmpeg-location",
      path.dirname(ffmpegPath), // Pass directory containing ffmpeg.exe
      "--postprocessor-args",
      "-c copy", // Ensure no re-encoding takes place
      "-o",
      tempOutput,
      "--no-part",
      "--quiet",
      url,
    ]);

    let stderrData = "";
    ytdlp.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      ytdlp.on("close", resolve);
    });

    if (exitCode !== 0) {
      console.error(
        `yt-dlp exited with code ${exitCode}. Error: ${stderrData}`
      );
      return NextResponse.json(
        { error: `yt-dlp error: ${stderrData}` },
        { status: 500 }
      );
    }

    // Wait for the file to be created and have non-zero size
    let fileReady = false;
    for (let i = 0; i < 20; i++) {
      try {
        const stats = await fs.stat(tempOutput);
        if (stats.size > 0) {
          fileReady = true;
          break;
        }
      } catch {}
      await new Promise((res) => setTimeout(res, 500));
    }
    if (!fileReady) {
      return NextResponse.json(
        { error: "File not created or empty" },
        { status: 500 }
      );
    }

    // Return JSON with the dynamic download URL
    return NextResponse.json({
      downloadUrl: `/api/file?file=${encodeURIComponent(randomFileName)}`,
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Something went wrong!" },
      { status: 500 }
    );
  }
}
