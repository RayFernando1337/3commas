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
import { useEffect, useMemo, useState } from "react";
import { useSwipeable } from "react-swipeable";

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

  const onSwipe = async (dir: "left" | "right") => {
    // Log to Convex and optionally post a GitHub review (server does both)
    try {
      await fetch("/api/github/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: {
            id: current.id,
            repository: current.repository,
            number: current.number,
            isPullRequest: current.isPullRequest,
          },
          decision:
            dir === "right"
              ? "APPROVE"
              : current.isPullRequest
                ? "REQUEST_CHANGES"
                : "NEEDS_DISCUSSION",
        }),
      });
    } catch {}
    setIndex((i) => Math.min(i + 1, items.length));
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onSwipe("left"),
    onSwipedRight: () => onSwipe("right"),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

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
        <div className="relative max-w-3xl mx-auto">
          <div {...swipeHandlers} className="select-none">
            <Card className="overflow-hidden">
              <CardHeader className="gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconBrandGithub />
                  <span className="truncate">{current.title}</span>
                </CardTitle>
                <CardDescription>
                  {current.isPullRequest ? "Pull Request" : "Issue"} • {current.repository} • #
                  {current.number}
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
                    onClick={() => onSwipe("left")}
                    aria-label="Request changes"
                  >
                    <IconCircleX /> Request Changes
                  </Button>
                  <Button onClick={() => onSwipe("right")} aria-label="Approve">
                    <IconCircleCheck /> Approve
                  </Button>
                </div>
                <Link href={current.html_url} target="_blank" className="text-sm underline">
                  Open on GitHub
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
