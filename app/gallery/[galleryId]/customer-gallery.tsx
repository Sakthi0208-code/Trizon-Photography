"use client";

import {
  useEffect,
  useState,
} from "react";

type Photo = {
  id: string;
  file_name: string;
  created_at: string;
  signedUrl: string | null;
};

type EventInfo = {
  id?: string;
  name: string;
  event_date: string;
  location: string | null;
};

type GalleryData = {
  customerName: string;
  event: EventInfo | null;
  photos: Photo[];
};

type Props = {
  galleryId: string;
};

export default function CustomerGallery({
  galleryId,
}: Props) {
  const [pin, setPin] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [gallery, setGallery] =
    useState<GalleryData | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState<number | null>(
    null
  );

  const [downloading, setDownloading] =
    useState(false);

  function verifyGallery(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !/^\d{6}$/.test(pin)
    ) {
      setError(
        "Enter the 6-digit gallery PIN."
      );
      return;
    }

    setLoading(true);
    setError("");

    fetch("/api/gallery/verify", {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        publicToken: galleryId,
        pin,
      }),
    })
      .then(async (response) => {
        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Unable to open gallery."
          );
        }

        return data;
      })
      .then((data) => {
        setGallery(data);
      })
      .catch((verifyError) => {
        setError(
          verifyError instanceof Error
            ? verifyError.message
            : "Unable to open gallery."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function closeViewer() {
    setSelectedIndex(null);
  }

  function showPrevious() {
    if (
      selectedIndex === null ||
      !gallery ||
      gallery.photos.length === 0
    ) {
      return;
    }

    setSelectedIndex(
      selectedIndex === 0
        ? gallery.photos.length - 1
        : selectedIndex - 1
    );
  }

  function showNext() {
    if (
      selectedIndex === null ||
      !gallery ||
      gallery.photos.length === 0
    ) {
      return;
    }

    setSelectedIndex(
      selectedIndex ===
        gallery.photos.length - 1
        ? 0
        : selectedIndex + 1
    );
  }

  async function downloadPhoto(
    photo: Photo
  ) {
    if (!photo.signedUrl) {
      return;
    }

    setDownloading(true);

    try {
      const response =
        await fetch(
          photo.signedUrl
        );

      if (!response.ok) {
        throw new Error(
          "Failed to download image."
        );
      }

      const blob =
        await response.blob();

      const blobUrl =
        URL.createObjectURL(blob);

      const link =
        document.createElement(
          "a"
        );

      link.href = blobUrl;

      link.download =
        photo.file_name ||
        "photo.jpg";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        blobUrl
      );
    } catch (downloadError) {
      console.error(
        "Download error:",
        downloadError
      );

      window.open(
        photo.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } finally {
      setDownloading(false);
    }
  }

  // =========================================================
  // KEYBOARD CONTROLS
  // =========================================================

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (selectedIndex === null) {
        return;
      }

      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedIndex, gallery]);

  // =========================================================
  // PIN SCREEN
  // =========================================================

  if (!gallery) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07090c] px-6 text-white">

        <div className="w-full max-w-md">

          <div className="text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-600">
              TRIZEN
            </p>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight">
              Your Photo Gallery
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-500">
              Enter the 6-digit PIN provided by your photographer to view your photographs.
            </p>

          </div>

          <form
            onSubmit={verifyGallery}
            className="mt-10 rounded-3xl border border-white/[0.08] bg-[#101317] p-7"
          >

            <label
              htmlFor="gallery-pin"
              className="text-sm font-medium text-zinc-300"
            >
              Gallery PIN
            </label>

            <input
              id="gallery-pin"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black px-5 py-5 text-center font-mono text-3xl tracking-[0.45em] text-white outline-none focus:border-white/30"
            />

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                pin.length !== 6
              }
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Opening Gallery..."
                : "View Gallery"}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-zinc-700">
            No account is required.
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07090c] text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-white/[0.08] bg-[#0b0d10]">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 lg:px-8">

          <div className="min-w-0">

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-600">
              TRIZEN
            </p>

            <h1 className="mt-2 truncate text-2xl font-semibold">
              {gallery.event?.name ||
                "Photo Gallery"}
            </h1>

            <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-600">

              <span>
                {gallery.customerName}
              </span>

              {gallery.event?.event_date && (
                <span>
                  {gallery.event.event_date}
                </span>
              )}

              {gallery.event?.location && (
                <span>
                  {gallery.event.location}
                </span>
              )}

            </div>

          </div>

          <div className="hidden shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-zinc-400 sm:block">
            {gallery.photos.length}{" "}
            {gallery.photos.length === 1
              ? "photo"
              : "photos"}
          </div>

        </div>

      </header>

      {/* =====================================================
          GRID
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {gallery.photos.length > 0 ? (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">

            {gallery.photos.map(
              (photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() =>
                    setSelectedIndex(
                      index
                    )
                  }
                  className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101317] text-left"
                >

                  <div className="relative overflow-hidden">

                    {photo.signedUrl ? (
                      <img
                        src={
                          photo.signedUrl
                        }
                        alt={
                          photo.file_name
                        }
                        className="block h-auto w-full transition duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                        Image unavailable
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition group-hover:opacity-100">

                      <p className="truncate text-xs text-white">
                        {photo.file_name}
                      </p>

                    </div>

                  </div>

                </button>
              )
            )}

          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center">

            <p className="text-lg font-medium">
              No photos available
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              This gallery does not contain any selected photos.
            </p>

          </div>
        )}

      </div>

      {/* =====================================================
          FULLSCREEN VIEWER
      ====================================================== */}

      {selectedIndex !== null &&
        gallery.photos[selectedIndex] && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-xl"
            onClick={closeViewer}
          >

            {/* Counter */}
            <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-xs text-zinc-300">
              {selectedIndex + 1} /{" "}
              {gallery.photos.length}
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xl text-white hover:bg-white/[0.15]"
              aria-label="Close viewer"
            >
              ×
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrevious();
              }}
              className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xl text-white hover:bg-white/[0.15] sm:left-8"
              aria-label="Previous photo"
            >
              ←
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-xl text-white hover:bg-white/[0.15] sm:right-8"
              aria-label="Next photo"
            >
              →
            </button>

            {/* Image + toolbar */}
            <div
              className="flex max-h-[88vh] max-w-[90vw] flex-col items-center"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {gallery.photos[
                selectedIndex
              ].signedUrl ? (
                <img
                  src={
                    gallery.photos[
                      selectedIndex
                    ].signedUrl!
                  }
                  alt={
                    gallery.photos[
                      selectedIndex
                    ].file_name
                  }
                  className="max-h-[78vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <div className="flex h-96 w-96 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600">
                  Image unavailable
                </div>
              )}

              <div className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#101317] px-4 py-3">

                <p className="min-w-0 truncate text-xs text-zinc-400">
                  {
                    gallery.photos[
                      selectedIndex
                    ].file_name
                  }
                </p>

                <button
                  type="button"
                  disabled={
                    downloading ||
                    !gallery.photos[
                      selectedIndex
                    ].signedUrl
                  }
                  onClick={() =>
                    downloadPhoto(
                      gallery.photos[
                        selectedIndex
                      ]
                    )
                  }
                  className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-40"
                >
                  {downloading
                    ? "Downloading..."
                    : "Download"}
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}