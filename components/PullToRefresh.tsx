"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const threshold = 80;

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;

    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current || isRefreshing) return;

    isPulling.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const element = document.body;
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;

  return (
    <div className="relative">
      {/* Pull to Refresh Indicator */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-200 ${
          pullDistance > 0 ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          height: pullDistance,
          opacity: progress,
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-sm rounded-full p-3 shadow-lg">
          <RefreshCw
            className={`w-6 h-6 text-blue-500 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {children}
    </div>
  );
}
