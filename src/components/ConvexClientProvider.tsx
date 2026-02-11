"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Only create the client if the URL is available (prevents build crash on Vercel)
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    if (!convex) {
        // During SSR/build without env vars, render children without Convex
        return <>{children}</>;
    }
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
