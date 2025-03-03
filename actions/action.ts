"use server";

import { exec } from "child_process";
import path from "path";
import util from "util";

const ytdlpPath = path.join(process.cwd(), "yt-dlp.exe");
const execPromise = util.promisify(exec);

export const searchVideo = async (prevState: any, formData: FormData) => {
  try {
    const url = formData.get("url");
    if (!url) {
      throw new Error("URL is required");
    }

    const { stdout, stderr } = await execPromise(`"${ytdlpPath}" -F ${url}`);

    if (stderr) {
      console.error("yt-dlp error:", stderr);
      throw new Error(stderr);
    }

    console.log("Available Formats:\n", stdout);

    let bestVideo: any = null;
    let bestAudio: any = null;

    stdout
      .split("\n")
      .filter((line) => line.match(/^\s*\d+/)) // Only lines with format codes
      .forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const format = {
          itag: parts[0], // Format ID
          extension: parts[1], // File type (mp4, webm, etc.)
          resolution: parts[2] || "N/A", // Resolution
          fps: parseInt(parts[3]) || 0, // FPS
          note: parts.slice(4).join(" "), // Extra info (bitrate, codec)
        };

        if (format.note.includes("audio")) {
          // Choose the highest bitrate audio
          if (!bestAudio || parseInt(format.note) > parseInt(bestAudio.note)) {
            bestAudio = format;
          }
        } else if (format.resolution !== "N/A") {
          // Choose the highest resolution video
          const resolutionNum =
            parseInt(format.resolution.replace(/\D/g, "")) || 0;
          if (
            !bestVideo ||
            resolutionNum > parseInt(bestVideo.resolution.replace(/\D/g, ""))
          ) {
            bestVideo = format;
          }
        }
      });

    return {
      bestVideo: bestVideo
        ? { itag: bestVideo.itag, details: bestVideo }
        : null,
      bestAudio: bestAudio
        ? { itag: bestAudio.itag, details: bestAudio }
        : null,
    };
  } catch (error: any) {
    console.error("Error executing yt-dlp:", error.message);
    return { error: error.message };
  }
};

export const downloadVideo = async (prevState: any, formData: FormData) => {
  const videoId = formData.get("videoid");
  const audioId = formData.get("audioid");

  if (!videoId || !audioId) {
    return { error: "Invalid video or audio ID." };
  }

  try {
    exec(`"${ytdlpPath}" -f ${videoId}+${audioId} -o "video.mp4"`);

    return { success: true };
  } catch (error) {
    console.error("Download error:", error);
    return { error: "Failed to download video." };
  }
};
