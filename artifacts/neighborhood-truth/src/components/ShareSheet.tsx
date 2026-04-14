import { useState, useEffect, useRef, useCallback } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import { generateVibeCard, type VibeCardData } from "@/lib/vibeCard";

interface ShareSheetProps {
  cardData: VibeCardData;
  shareUrl: string;
  whatsappText: string;
  onClose: () => void;
}

export function ShareSheet({ cardData, shareUrl, whatsappText, onClose }: ShareSheetProps) {
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const objUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGenerating(true);
    generateVibeCard(cardData)
      .then((blob) => {
        if (cancelled) return;
        blobRef.current = blob;
        const url = URL.createObjectURL(blob);
        objUrlRef.current = url;
        setPreviewUrl(url);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setGenerating(false); });
    return () => {
      cancelled = true;
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current);
    };
  }, []);

  const handleShareImage = useCallback(async () => {
    if (!blobRef.current) return;
    const file = new File([blobRef.current], `${cardData.areaName.replace(/\s+/g, "-")}-vibe-card.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${cardData.areaName} — PlaceLabels Vibe Card`,
          text: `Check out ${cardData.areaName} on PlaceLabels!\n${shareUrl}`,
          files: [file],
        });
        return;
      } catch {
        // Fall through to download
      }
    }
    // Fallback: download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blobRef.current);
    a.download = file.name;
    a.click();
  }, [cardData.areaName, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareUrl]);

  return (
    <div
      className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center"
      style={{ backdropFilter: "blur(2px)", backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="font-bold text-gray-900 text-sm">Share Vibe Card</p>
          <button aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Card preview */}
        <div className="px-5 py-4">
          {generating ? (
            <div
              className="w-full rounded-xl animate-pulse"
              style={{ height: 180, background: "linear-gradient(135deg, #0f766e, #1d4ed8)" }}
            />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Vibe card preview"
              className="w-full rounded-xl shadow-md"
              style={{ aspectRatio: "16/9", objectFit: "cover" }}
            />
          ) : null}
        </div>

        {/* Share options */}
        <div className="px-5 pb-5 flex flex-col gap-2.5">
          <button
            onClick={handleShareImage}
            disabled={generating || !blobRef.current}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 text-left"
          >
            <span className="text-xl">📤</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Share image</p>
              <p className="text-xs text-gray-500">Download or share via your device</p>
            </div>
            <Download className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-green-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left no-underline"
          >
            <span className="text-xl">💬</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
              <p className="text-xs text-gray-500">Share area description + link</p>
            </div>
          </a>

          <button
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
          >
            {copied ? <Check className="h-5 w-5 text-green-500 flex-shrink-0" /> : <Copy className="h-5 w-5 text-gray-400 flex-shrink-0" />}
            <div>
              <p className="text-sm font-semibold text-gray-900">{copied ? "Copied!" : "Copy link"}</p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{shareUrl}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
