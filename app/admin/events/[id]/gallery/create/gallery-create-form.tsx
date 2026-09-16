"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Photo = {
  id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
  signedUrl: string | null;
};

type Gallery = {
  id: string;
  event_id: string;
  customer_name: string;
  public_token: string;
  pin: string | null;
  published: boolean;
  created_at: string;
};

type Props = {
  eventId: string;
  eventName: string;
  photos: Photo[];
  editingGallery: Gallery | null;
  existingSelectedPhotoIds: string[];
};

type SaveResult = {
  success: boolean;
  mode: "created" | "updated";
  galleryId: string;
  customerName: string;
  publicToken: string;
  pin: string | null;
  published: boolean;
  url: string;
  selectedPhotos: number;
};

export default function GalleryCreateForm({
  eventId,
  eventName,
  photos,
  editingGallery,
  existingSelectedPhotoIds,
}: Props) {
  const router = useRouter();

  const [customerName, setCustomerName] =
    useState(
      editingGallery?.customer_name ?? ""
    );

  const [selectedPhotos, setSelectedPhotos] =
    useState<string[]>(
      editingGallery
        ? existingSelectedPhotoIds
        : []
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<SaveResult | null>(null);

  function togglePhoto(photoId: string) {
    setSelectedPhotos((current) => {
      if (current.includes(photoId)) {
        return current.filter(
          (id) => id !== photoId
        );
      }

      return [...current, photoId];
    });

    setError("");
    setResult(null);
  }

  function selectAll() {
    setSelectedPhotos(
      photos.map((photo) => photo.id)
    );

    setError("");
    setResult(null);
  }

  function clearAll() {
    setSelectedPhotos([]);
    setError("");
    setResult(null);
  }

  async function saveGallery() {
    if (!customerName.trim()) {
      setError(
        "Please enter the customer name."
      );
      return;
    }

    if (selectedPhotos.length === 0) {
      setError(
        "Select at least one photo."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "/api/admin/gallery/create",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            eventId,
            customerName:
              customerName.trim(),
            photoIds: selectedPhotos,
            galleryId:
              editingGallery?.id ?? null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save gallery."
        );
      }

      setResult(data);

      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save gallery."
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePublishStatus() {
    if (!editingGallery) {
      return;
    }

    const nextPublished =
      !editingGallery.published;

    if (
      nextPublished &&
      selectedPhotos.length === 0
    ) {
      setError(
        "Select at least one photo before publishing."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "/api/admin/gallery/status",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            galleryId:
              editingGallery.id,
            published:
              nextPublished,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update gallery status."
        );
      }

      router.refresh();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update gallery status."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteGallery() {
    if (!editingGallery) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${editingGallery.customer_name}" gallery? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/gallery/delete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            galleryId:
              editingGallery.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete gallery."
        );
      }

      router.push(
        `/admin/events/${eventId}/gallery/create`
      );

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete gallery."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="rounded-2xl border border-white/[0.08] bg-[#101317] p-6 md:p-7">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
              {editingGallery
                ? "Existing Gallery"
                : "New Gallery"}
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              {editingGallery
                ? editingGallery.customer_name
                : "Create Customer Gallery"}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              {editingGallery
                ? "Update the customer name or selected photos."
                : "Create a separate gallery for this customer."}
            </p>

          </div>

          {editingGallery && (
            <span
              className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                editingGallery.published
                  ? "bg-green-500/10 text-green-400"
                  : "bg-yellow-500/10 text-yellow-400"
              }`}
            >
              {editingGallery.published
                ? "Published"
                : "Draft"}
            </span>
          )}

        </div>

      </div>

      {/* =====================================================
          PIN
      ====================================================== */}

      {editingGallery && (
        <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.035] p-6">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-500/70">
            Customer PIN
          </p>

          <p className="mt-3 font-mono text-3xl font-semibold tracking-[0.3em] text-white">
            {editingGallery.pin ??
              "Unavailable"}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            The PIN remains unchanged while editing this gallery.
          </p>

        </div>
      )}

      {/* =====================================================
          CUSTOMER NAME
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

        <label
          htmlFor="customer-name"
          className="text-sm font-medium text-zinc-300"
        >
          Customer name
        </label>

        <input
          id="customer-name"
          type="text"
          value={customerName}
          onChange={(event) =>
            setCustomerName(
              event.target.value
            )
          }
          placeholder="e.g. Arjun & Priya"
          className="mt-3 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-white/30"
        />

      </div>

      {/* =====================================================
          PHOTOS
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101317] p-6 md:p-7">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-600">
              Gallery Photos
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Select customer photos
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Only these selected photos will be available to the customer.
            </p>

          </div>

          <p className="text-sm text-zinc-500">
            <span className="text-white">
              {selectedPhotos.length}
            </span>{" "}
            selected
          </p>

        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-2">

          <button
            type="button"
            onClick={selectAll}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Select All
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 transition hover:border-white/20 hover:text-white"
          >
            Clear All
          </button>

        </div>

        {photos.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">

            {photos.map((photo) => {
              const selected =
                selectedPhotos.includes(
                  photo.id
                );

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() =>
                    togglePhoto(
                      photo.id
                    )
                  }
                  className={`group relative aspect-square overflow-hidden rounded-2xl border-2 text-left transition ${
                    selected
                      ? "border-white"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >

                  {photo.signedUrl ? (
                    <img
                      src={photo.signedUrl}
                      alt={photo.file_name}
                      className={`h-full w-full object-cover transition duration-300 ${
                        selected
                          ? "brightness-100"
                          : "brightness-50 group-hover:brightness-75"
                      }`}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                      Image unavailable
                    </div>
                  )}

                  {selected && (
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                      ✓
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4">

                    <p className="truncate text-xs text-white">
                      {photo.file_name}
                    </p>

                  </div>

                </button>
              );
            })}

          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-10 text-center">

            <p className="text-sm text-zinc-500">
              No photos uploaded for this event.
            </p>

            <p className="mt-2 text-xs text-zinc-700">
              A Team Member needs to upload photos before this gallery can be published.
            </p>

          </div>
        )}

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* =====================================================
          RESULT
      ====================================================== */}

      {result && (
        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/[0.05] p-6">

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400/70">
            Gallery {result.mode}
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            {result.customerName}
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-white/10 bg-black p-5">

              <p className="text-xs text-zinc-600">
                Customer PIN
              </p>

              <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.3em]">
                {result.pin ??
                  "Unavailable"}
              </p>

            </div>

            <div className="rounded-xl border border-white/10 bg-black p-5">

              <p className="text-xs text-zinc-600">
                Status
              </p>

              <p className="mt-2 text-lg font-semibold">
                {result.published
                  ? "Published"
                  : "Draft"}
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black p-5">

            <p className="text-xs text-zinc-600">
              Customer URL
            </p>

            <p className="mt-2 break-all text-sm text-zinc-400">
              {result.url}
            </p>

          </div>

          <p className="mt-4 text-xs text-zinc-600">
            {result.selectedPhotos} selected photo
            {result.selectedPhotos === 1
              ? ""
              : "s"}.
          </p>

        </div>
      )}

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101317] p-6">

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

          <div>

            <p className="text-sm font-medium">
              {eventName}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              {editingGallery
                ? "Edit the gallery, publish it, unpublish it, or delete it."
                : "A new gallery starts as a Draft."}
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            {editingGallery && (
              <>
                <button
                  type="button"
                  onClick={
                    changePublishStatus
                  }
                  disabled={loading}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-40 ${
                    editingGallery.published
                      ? "border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {editingGallery.published
                    ? "Unpublish Gallery"
                    : "Publish Gallery"}
                </button>

                <button
                  type="button"
                  onClick={
                    deleteGallery
                  }
                  disabled={loading}
                  className="rounded-xl border border-red-500/30 px-5 py-3 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                  Delete Gallery
                </button>
              </>
            )}

            <button
              type="button"
              onClick={saveGallery}
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading
                ? "Saving..."
                : editingGallery
                  ? "Save Gallery Changes"
                  : "Create Gallery"}
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}