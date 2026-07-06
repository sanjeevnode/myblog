"use client";

import Masonry from "react-masonry-css";

// max-w-5xl feed: 2 columns on desktop, 1 below 700px.
const breakpointCols = {
  default: 2,
  700: 1,
};

/** Unsplash-style masonry: cards keep natural height, columns pack tightly. */
export function PostsMasonry({ children }: { children: React.ReactNode }) {
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className="flex gap-6"
      columnClassName="min-w-0 flex-1 space-y-6"
    >
      {children}
    </Masonry>
  );
}
