import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  ImageOff,
  Paperclip,
  X,
  ZoomIn,
} from "lucide-react";

import type { TaskAttachment } from "@/api/task.api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

const BACKEND_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
})();

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;

const resolveAttachmentUrl = (rawUrl: string): string => {
  if (!rawUrl) return "";

  const cleaned = rawUrl.trim();
  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  // Handle legacy DB records saved when SERVER_URL was empty or "undefined"
  const normalizedPath = cleaned
    .replace(/^undefined(?=\/)/i, "")
    .replace(/^\/+/, "");

  const segments = normalizedPath.split("/").map((segment) => {
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  });

  return `${BACKEND_ORIGIN}/${segments.join("/")}`;
};

const getAttachmentFileName = (url: string, index: number): string => {
  const raw = url.split("/").pop() || `Attachment ${index + 1}`;
  try {
    const decoded = decodeURIComponent(raw);
    // Strip leading Multer timestamp prefix (e.g. "1795444455343-") for cleaner display
    return decoded.replace(/^\d{10,}-/, "");
  } catch {
    return raw;
  }
};

const isImageAttachment = (file: TaskAttachment, resolvedUrl: string): boolean => {
  const mime = file.MimeType || file.mimetype || "";
  if (mime.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(resolvedUrl);
};

const isImageKitUrl = (url: string): boolean => {
  try {
    return new URL(url).hostname.includes("imagekit.io");
  } catch {
    return false;
  }
};

const withImageKitTransform = (url: string, transform: string): string => {
  if (!isImageKitUrl(url)) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=${transform}`;
};

interface ResolvedAttachment {
  id: string;
  url: string;
  thumbUrl: string;
  lightboxUrl: string;
  name: string;
  size?: number;
  isImage: boolean;
}

interface ImageThumbnailCardProps {
  item: ResolvedAttachment;
  onOpen: () => void;
}

const ImageThumbnailCard = ({ item, onOpen }: ImageThumbnailCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-muted/20 transition-all hover:border-primary/40 hover:shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-video w-full overflow-hidden bg-muted/50 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {!loaded && !failed && (
          <div className="absolute inset-0 animate-pulse bg-muted" />
        )}

        {failed ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <span>Preview unavailable</span>
          </div>
        ) : (
          <img
            src={item.thumbUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.02] ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {!failed && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5" />
              View
            </span>
          </div>
        )}
      </button>

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {item.name}
          </p>
          {item.size !== undefined && (
            <p className="text-[11px] text-muted-foreground">
              {(item.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${item.name} in new tab`}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};

interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
}

export const TaskAttachments = ({ attachments }: TaskAttachmentsProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const resolvedItems: ResolvedAttachment[] = attachments.map((file, index) => {
    const url = resolveAttachmentUrl(file.url);
    const isImage = isImageAttachment(file, url);
    return {
      id: file._id ?? `${url}-${index}`,
      url,
      thumbUrl: isImage ? withImageKitTransform(url, "w-600,q-80,f-auto") : url,
      lightboxUrl: isImage
        ? withImageKitTransform(url, "w-1600,q-85,f-auto")
        : url,
      name: getAttachmentFileName(url, index),
      size: file.size,
      isImage,
    };
  });

  const imageItems = resolvedItems.filter((item) => item.isImage);
  const otherItems = resolvedItems.filter((item) => !item.isImage);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      } else if (event.key === "ArrowRight" && imageItems.length > 1) {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % imageItems.length,
        );
      } else if (event.key === "ArrowLeft" && imageItems.length > 1) {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + imageItems.length) % imageItems.length,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, imageItems.length]);

  if (resolvedItems.length === 0) {
    return null;
  }

  const activeImage =
    lightboxIndex !== null ? imageItems[lightboxIndex] : null;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Paperclip className="h-3.5 w-3.5" />
        Attachments ({resolvedItems.length})
      </div>

      {imageItems.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {imageItems.map((item, idx) => (
            <ImageThumbnailCard
              key={item.id}
              item={item}
              onOpen={() => setLightboxIndex(idx)}
            />
          ))}
        </div>
      )}

      {otherItems.length > 0 && (
        <div
          className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
            imageItems.length > 0 ? "mt-3" : ""
          }`}
        >
          {otherItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-muted/60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground group-hover:text-primary">
                  {item.name}
                </p>
                {item.size !== undefined && (
                  <p className="text-[11px] text-muted-foreground">
                    {(item.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </a>
          ))}
        </div>
      )}

      {/* Lightbox Modal for full-size image viewing */}
      {activeImage && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.name}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="mb-3 flex w-full items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {activeImage.name}
                </p>
                <p className="text-xs text-white/70">
                  {imageItems.length > 1
                    ? `${lightboxIndex + 1} of ${imageItems.length}`
                    : ""}
                  {activeImage.size !== undefined
                    ? `${imageItems.length > 1 ? " · " : ""}${(activeImage.size / 1024).toFixed(1)} KB`
                    : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={activeImage.url}
                  download={activeImage.name}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Download image"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </a>
                <a
                  href={activeImage.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open original in new tab"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Close preview"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image stage */}
            <div className="relative flex w-full items-center justify-center">
              {imageItems.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + imageItems.length) %
                        imageItems.length,
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              <img
                src={activeImage.lightboxUrl}
                alt={activeImage.name}
                decoding="async"
                className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
              />

              {imageItems.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % imageItems.length)
                  }
                  aria-label="Next image"
                  className="absolute right-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
