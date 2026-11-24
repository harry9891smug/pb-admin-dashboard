"use client";

import { useEffect, useState } from "react";

/**
 * Client-side "view more" for lists that load everything at once.
 * const { visible, hasMore, more, rest } = useShowMore(items, 10);
 */
export function useShowMore<T>(items: T[], step = 10) {
  const [count, setCount] = useState(step);

  // Start over whenever the list itself changes (new search / filter).
  useEffect(() => {
    setCount(step);
  }, [items.length, step]);

  return {
    visible: items.slice(0, count),
    hasMore: items.length > count,
    rest: Math.max(0, items.length - count),
    more: () => setCount((c) => c + step),
  };
}

export function ShowMoreButton({
  hasMore,
  rest,
  onClick,
}: {
  hasMore: boolean;
  rest: number;
  onClick: () => void;
}) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-3">
      <button
        onClick={onClick}
        className="rounded-full border border-violet-200 bg-violet-50 px-5 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
      >
        View more ({rest} more)
      </button>
    </div>
  );
}
