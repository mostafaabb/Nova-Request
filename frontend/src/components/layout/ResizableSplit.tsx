'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ResizableSplitProps = {
  first: ReactNode;
  second: ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  storageKey?: string;
  className?: string;
  firstClassName?: string;
  secondClassName?: string;
  handleClassName?: string;
};

export function ResizableSplit({
  first,
  second,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  storageKey,
  className,
  firstClassName,
  secondClassName,
  handleClassName,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(defaultSize);

  useEffect(() => {
    if (!storageKey) return;

    const saved = window.localStorage.getItem(storageKey);
    const nextSize = saved ? Number(saved) : Number.NaN;

    if (!Number.isNaN(nextSize)) {
      setSize(Math.min(maxSize, Math.max(minSize, nextSize)));
    }
  }, [maxSize, minSize, storageKey]);

  const updateSize = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;

    const nextSize = ((clientX - rect.left) / rect.width) * 100;
    const clampedSize = Math.min(maxSize, Math.max(minSize, nextSize));
    setSize(clampedSize);

    if (storageKey) {
      window.localStorage.setItem(storageKey, String(clampedSize));
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const handlePointerMove = (moveEvent: PointerEvent) => updateSize(moveEvent.clientX);
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div ref={containerRef} className={cn('flex h-full w-full min-w-0 overflow-hidden', className)}>
      <div className={cn('h-full min-w-0 overflow-hidden', firstClassName)} style={{ flexBasis: `${size}%` }}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        className={cn(
          'group relative w-2 shrink-0 cursor-col-resize touch-none outline-none transition-colors hover:bg-primary/10 focus-visible:bg-primary/10',
          handleClassName
        )}
      >
        <div className="absolute left-1/2 top-1/2 h-12 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
      </div>
      <div className={cn('h-full min-w-0 flex-1 overflow-hidden', secondClassName)}>
        {second}
      </div>
    </div>
  );
}
