"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { IconBrandGithub, IconCircleCheck, IconCircleX, IconRefresh } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { TinderCard, type TinderCardHandle } from "@/components/swipe/TinderCard";

type IssueLike = {
  id: string;
  title: string;
  body: string;
  number: number;
  html_url: string;
  repository: string;
  author: string;
  isPullRequest: boolean;
};

export default function IssueReviewPage() {
  const [items, setItems] = useState<IssueLike[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);
  const cardRef = useRef<TinderCardHandle | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let data: IssueLike[] = [];
        if (useMock) {
          const resMock = await fetch("/api/github/issues?mock=1");
          if (!resMock.ok) throw new Error("Failed to load mock issues");
          data = (await resMock.json()) as IssueLike[];
        } else {
          const res = await fetch("/api/github/issues");
          if (!res.ok) throw new Error("Failed to load issues");
          data = (await res.json()) as IssueLike[];
          if (Array.isArray(data) && data.length === 0) {
            // Auto-fallback to mock when live returns empty
            const resMock = await fetch("/api/github/issues?mock=1");
            if (resMock.ok) {
              data = (await resMock.json()) as IssueLike[];
            }
          }
        }
        setItems(Array.isArray(data) ? data : []);
        setIndex(0);
      } catch (e: any) {
        setError(e?.message ?? "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchIssues();
  }, [useMock]);

  const reload = () => {
    // trigger effect by toggling a dummy state or call fetch inline
    setError(null);
    setIndex(0);
    // flip useMock twice to retrigger effect without changing value
    setUseMock((v) => !v);
    setTimeout(() => setUseMock((v) => !v), 0);
  };

  const current = items[index];
  const nextItem = items[index + 1];
  const thirdItem = items[index + 2];

  // Reset drag progress when current item changes to ensure clean state
  useEffect(() => {
    setDragProgress(0);
  }, [current?.id]);

  const onSwipe = async (dir: "left" | "right", item: IssueLike) => {
    // Log to Convex and optionally post a GitHub review (server does both)
    try {
      await fetch("/api/github/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: {
            id: item.id,
            repository: item.repository,
            number: item.number,
            isPullRequest: item.isPullRequest,
          },
          decision:
            dir === "right"
              ? "APPROVE"
              : item.isPullRequest
                ? "REQUEST_CHANGES"
                : "NEEDS_DISCUSSION",
        }),
      });
    } catch {}
    
    // Reset drag progress to ensure clean state for next card
    setDragProgress(0);
    setIndex((i) => Math.min(i + 1, items.length));
  };

  // Keyboard shortcuts for swiping
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!current) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        cardRef.current?.swipeLeft();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        cardRef.current?.swipeRight();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  const [dragProgress, setDragProgress] = useState(0);

  const percentDone = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((index / items.length) * 100);
  }, [index, items.length]);

  return (
    <div className="px-4 lg:px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Progress: {percentDone}%</div>
          <div className="flex items-center gap-2">
            <Switch id="use-mock" checked={useMock} onCheckedChange={setUseMock} />
            <Label htmlFor="use-mock" className="text-sm">
              Use mock data
            </Label>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={reload}>
          <IconRefresh /> Refresh
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Loading issues…</CardTitle>
            <CardDescription>Fetching your GitHub inbox</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={reload}>
                Retry
              </Button>
              {!useMock && (
                <Button variant="outline" onClick={() => setUseMock(true)}>
                  Load mock data
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}

      {!isLoading && !error && !current && (
        <Card>
          <CardHeader>
            <CardTitle>All caught up 🎉</CardTitle>
            <CardDescription>Nothing left to review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Come back later or change your filters.
            </div>
          </CardContent>
        </Card>
      )}

      {current && (
        <div className="relative mx-auto grid h-[70vh] max-w-3xl place-items-center">
          {/* Third card in stack (deepest) */}
          {thirdItem && (
            <motion.div
              key={`third-${thirdItem.id}`}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[12%] z-[-1] mx-auto w-[90%]"
              initial={{ opacity: 0.2, scale: 0.88, y: 24, filter: "blur(3px)" }}
              animate={{ opacity: 0.25, scale: 0.88, y: 24, filter: "blur(3px)" }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconBrandGithub />
                    <span className="truncate">{thirdItem.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {thirdItem.isPullRequest ? "Pull Request" : "Issue"} • {thirdItem.repository} • #{thirdItem.number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[40vh] overflow-hidden rounded-lg bg-muted/40" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Next card preview underneath */}
          {nextItem && (
            <motion.div
              key={`next-${nextItem.id}`}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[8%] z-0 mx-auto w-[95%]"
              initial={{ opacity: 0.35, scale: 0.94, y: 18, filter: "blur(2px)" }}
              animate={{
                // As the top card is dragged, subtly react to it
                opacity: Math.max(0.35, 0.45 + Math.min(0.1, Math.abs(dragProgress) * 0.15)),
                scale: Math.max(0.94, 0.94 + Math.min(0.015, Math.abs(dragProgress) * 0.015)),
                y: Math.max(12, 18 - Math.min(6, Math.abs(dragProgress) * 6)),
                filter: `blur(${Math.max(0.5, 2 - Math.abs(dragProgress) * 1.5)}px)`,
              }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 28,
                // Faster transition when dragProgress resets to 0
                duration: dragProgress === 0 ? 0.3 : undefined
              }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconBrandGithub />
                    <span className="truncate">{nextItem.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {nextItem.isPullRequest ? "Pull Request" : "Issue"} • {nextItem.repository} • #{nextItem.number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[40vh] overflow-hidden rounded-lg bg-muted/40" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active draggable card */}
          <motion.div
            key={current.id}
            initial={{ y: 10, scale: 0.96, opacity: 0.9 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30
            }}
            className="z-20 w-full"
          >
            <TinderCard
              ref={cardRef}
              className="w-full"
              onSwipe={(dir) => onSwipe(dir, current)}
              onDragProgress={setDragProgress}
            >
              <Card className="overflow-hidden">
                <CardHeader className="gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IconBrandGithub />
                    <span className="truncate">{current.title}</span>
                  </CardTitle>
                  <CardDescription>
                    {current.isPullRequest ? "Pull Request" : "Issue"} • {current.repository} • #{current.number}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm max-h-[50vh] overflow-auto bg-muted/40 p-4 rounded-lg">
                    {current.body || "No description provided."}
                  </pre>
                </CardContent>
                <CardFooter className="justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => cardRef.current?.swipeLeft()}
                      aria-label="Request changes"
                    >
                      <IconCircleX /> Request Changes
                    </Button>
                    <Button onClick={() => cardRef.current?.swipeRight()} aria-label="Approve">
                      <IconCircleCheck /> Approve
                    </Button>
                  </div>
                  <Link href={current.html_url} target="_blank" className="text-sm underline">
                    Open on GitHub
                  </Link>
                </CardFooter>
              </Card>
            </TinderCard>
          </motion.div>
        </div>
      )}
    </div>
  );
}
