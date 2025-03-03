"use client";

import { searchVideo } from "@/actions/action";
import { useActionState, useState } from "react";

export default function Home() {
  const [searchState, searchAction, searchIsPending] = useActionState(
    searchVideo,
    null
  );
  const [url, setUrl] = useState("");

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <form
        action={searchAction}
        className="flex flex-col gap-4 items-end w-1/2"
      >
        <input
          type="text"
          name="url"
          className="bg-transparent border rounded-lg px-4 py-2 focus:outline-0 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="Enter the YouTube link..."
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          disabled={searchIsPending}
        />
        <button
          className="bg-stone-900 px-4 py-1.5 w-fit rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={searchIsPending}
        >
          Search
        </button>
      </form>

      {searchState?.bestVideo && searchState?.bestAudio && (
        <div className="bg-stone-50 text-stone-950 py-2 px-4 rounded-lg shadow-lg">
          <p className="font-medium">
            Best Video: {searchState.bestVideo.details.resolution} -{" "}
            {searchState.bestVideo.details.extension} (
            {searchState.bestVideo.details.note})
          </p>
          <p className="font-medium">
            Best Audio: {searchState.bestAudio.details.extension} (
            {searchState.bestAudio.details.note})
          </p>

          <button
            onClick={async () => {
              try {
                const response = await fetch("/api/download", {
                  method: "POST",
                  body: JSON.stringify({
                    url,
                    videoId: searchState.bestVideo!.itag,
                    audioId: searchState.bestAudio!.itag,
                  }),
                  headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                  console.error("Download processing failed!");
                  return;
                }

                const data = await response.json();
                if (data.downloadUrl) {
                  // Redirect the user to the file download endpoint
                  window.location.href = data.downloadUrl;
                }
              } catch (error) {
                console.error("Error downloading the video:", error);
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {"Download Video"}
          </button>
        </div>
      )}
    </div>
  );
}
