"use client";

import {
  use,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function UploadPhotosPage({
  params,
}: Props) {
  const { id } = use(params);

  const router = useRouter();

  const [files, setFiles] = useState<File[]>(
    []
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    setFiles(selectedFiles);
    setError("");
  }

  async function handleUpload(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (files.length === 0) {
      setError(
        "Please select at least one image."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "event_id",
        id
      );

      for (const file of files) {
        formData.append(
          "files",
          file
        );
      }

      const response = await fetch(
        "/api/team-member/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Upload failed."
        );
      }

      router.push(
        `/team-member/events/${id}`
      );

      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-8 py-12 text-white">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              `/team-member/events/${id}`
            )
          }
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← Back to Event
        </button>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
            Photography
          </p>

          <h1 className="mt-3 text-4xl font-semibold">
            Upload Photos
          </h1>

          <p className="mt-3 text-zinc-500">
            Upload the photos you captured
            for this event.
          </p>
        </div>

        <form
          onSubmit={handleUpload}
          className="mt-10 space-y-6"
        >
          <label className="block cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center transition hover:border-white/40">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

            <p className="text-lg font-medium">
              Select Photos
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              JPG, PNG or WebP
            </p>
          </label>

          {files.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium">
                {files.length} photo
                {files.length === 1
                  ? ""
                  : "s"} selected
              </p>

              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="flex items-center justify-between rounded-lg bg-white/[0.04] px-4 py-3"
                  >
                    <span className="truncate text-sm text-zinc-300">
                      {file.name}
                    </span>

                    <span className="ml-4 shrink-0 text-xs text-zinc-600">
                      {(
                        file.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              files.length === 0
            }
            className="w-full rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Uploading..."
              : "Upload Photos"}
          </button>
        </form>
      </div>
    </main>
  );
}