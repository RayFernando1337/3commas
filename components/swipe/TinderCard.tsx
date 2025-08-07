"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/utils";
import { IconCircleCheck, IconCircleX } from "@tabler/icons-react";

export type SwipeDirection = "left" | "right";

export type TinderCardHandle = {
  swipeLeft: () => void;
  swipeRight: () => void;
};

export type TinderCardProps = {
  className?: string;
  onSwipe?: (direction: SwipeDirection) => void;
  renderBadges?: boolean;
  children: React.ReactNode;
  threshold?: number; // in px; default 120
  onDragProgress?: (progress: number) => void; // -1..1 based on x / threshold
};

export const TinderCard = forwardRef<TinderCardHandle, TinderCardProps>(
  ({ className, onSwipe, renderBadges = true, children, threshold = 120, onDragProgress }, ref) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-240, 0, 240], [-8, 0, 8]);
    const scale = useTransform(x, [-200, 0, 200], [1.01, 1, 1.01]);
    const shadow = useTransform(x, [-240, 0, 240], [0.25, 0.12, 0.25]);

    const rightOpacity = useTransform(x, [0, threshold], [0, 1]);
    const leftOpacity = useTransform(x, [-threshold, 0], [1, 0]);

    const isExitingRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    // Reset exiting state when component mounts/unmounts
    useEffect(() => {
      isExitingRef.current = false;
      return () => {
        isExitingRef.current = false;
      };
    }, []);

    // Notify parent about drag progress for background animations
    useMotionValueEvent(x, "change", (latest) => {
      const denom = threshold * 1.2;
      const normalized = Math.max(-1, Math.min(1, latest / (denom || 1)));
      onDragProgress?.(normalized);
    });

    function completeSwipe(direction: SwipeDirection) {
      if (isExitingRef.current) return;
      isExitingRef.current = true;

      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
      const destination = (viewportWidth + 200) * (direction === "right" ? 1 : -1);

      const controls = animate(x, destination, {
        type: "spring",
        stiffness: 300,
        damping: 35,
        onComplete: () => {
          onSwipe?.(direction);
          // Reset for next card
          isExitingRef.current = false;
        },
      });

      return () => controls?.stop();
    }

    function cancelSwipe() {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      onDragProgress?.(0);
    }

    useImperativeHandle(
      ref,
      () => ({
        swipeLeft: () => completeSwipe("left"),
        swipeRight: () => completeSwipe("right"),
      }),
      [onSwipe]
    );

    return (
      <motion.div
        className={cn(
          "relative touch-pan-y select-none will-change-transform",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        style={{ x, rotate, scale }}
        drag="x"
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          const offsetX = info.offset.x;
          const dir: SwipeDirection | null = offsetX > threshold ? "right" : offsetX < -threshold ? "left" : null;
          if (dir) {
            completeSwipe(dir);
          } else {
            cancelSwipe();
          }
        }}
        whileTap={{ scale: 0.99 }}
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        {/* Decision overlays */}
        {renderBadges && (
          <>
            <motion.div
              className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border-2 border-emerald-500/70 bg-emerald-500/10 px-3 py-1 text-sm font-semibold uppercase tracking-widest text-emerald-600 shadow-sm"
              style={{ opacity: rightOpacity }}
            >
              <div className="flex items-center gap-2">
                <IconCircleCheck className="h-4 w-4" /> Approve
              </div>
            </motion.div>
            <motion.div
              className="pointer-events-none absolute right-3 top-3 z-10 rounded-md border-2 border-rose-500/70 bg-rose-500/10 px-3 py-1 text-sm font-semibold uppercase tracking-widest text-rose-600 shadow-sm"
              style={{ opacity: leftOpacity }}
            >
              <div className="flex items-center gap-2">
                <IconCircleX className="h-4 w-4" /> Request Changes
              </div>
            </motion.div>
          </>
        )}

        {/* Glow shadow that intensifies slightly as you drag */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl blur-lg"
          style={{ opacity: shadow, background:
            "radial-gradient(1200px circle at var(--x,50%) var(--y,50%), hsl(var(--primary)/0.15), transparent 60%)" }}
        />

        {/* Card content goes here */}
        <div className="relative">
          {children}
        </div>
      </motion.div>
    );
  }
);

TinderCard.displayName = "TinderCard";
