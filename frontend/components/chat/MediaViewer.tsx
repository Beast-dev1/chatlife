"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { uploadDisplayUrl } from "@/lib/utils";
import type { MessageWithSender } from "@/types/chat";
import { Download, X } from "lucide-react";

export default function MediaViewer({
  mediaMessages,
  initialIndex,
  onClose,
}: {
  mediaMessages: MessageWithSender[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
    api.on("select", () => setCurrentIndex(api.selectedScrollSnap()));
  }, [api]);

  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, true, onClose);

  const currentMessage = mediaMessages[currentIndex];
  const hasMultiple = mediaMessages.length > 1;

  const handleDownload = useCallback(() => {
    if (!currentMessage?.fileUrl) return;
    const link = document.createElement("a");
    link.href = uploadDisplayUrl(currentMessage.fileUrl);
    link.download =
      currentMessage.content ||
      (currentMessage.type === "IMAGE"
        ? "image.jpg"
        : currentMessage.type === "VIDEO"
          ? "video.mp4"
          : "file");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentMessage]);

  if (mediaMessages.length === 0) return null;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 shrink-0">
        <span className="text-sm text-white/80">
          {currentIndex + 1} / {mediaMessages.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center justify-center min-h-0 p-4">
        <Carousel
          setApi={setApi}
          initialIndex={initialIndex}
          opts={{ loop: true }}
          className="w-full max-w-4xl h-full max-h-[calc(100vh-80px)]"
        >
          <CarouselContent className="h-full">
            {mediaMessages.map((msg) => (
              <CarouselItem key={msg.id} className="h-full flex items-center justify-center">
                {msg.type === "IMAGE" && msg.fileUrl ? (
                  <div className="relative w-full h-full min-h-[200px]">
                    <Image
                      src={uploadDisplayUrl(msg.fileUrl)}
                      alt=""
                      fill
                      className="object-contain rounded-lg"
                      sizes="(max-width: 1024px) 100vw, 896px"
                    />
                  </div>
                ) : msg.type === "VIDEO" && msg.fileUrl ? (
                  <video
                    src={uploadDisplayUrl(msg.fileUrl)}
                    controls
                    className="max-w-full max-h-full rounded-lg"
                    playsInline
                  />
                ) : null}
              </CarouselItem>
            ))}
          </CarouselContent>
          {hasMultiple && (
            <>
              <CarouselPrevious className="text-white border-white/30 bg-black/50 hover:bg-black/70 left-2" />
              <CarouselNext className="text-white border-white/30 bg-black/50 hover:bg-black/70 right-2" />
            </>
          )}
        </Carousel>
      </div>
    </motion.div>
  );
}
