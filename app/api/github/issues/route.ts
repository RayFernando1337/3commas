import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest } from "next/server";

// Fetch a mix of issues and PRs assigned to the authenticated user
// Requires env GITHUB_TOKEN with repo read access
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mock = searchParams.get("mock") === "1";

  if (mock) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return new Response(JSON.stringify({ error: "Missing Convex URL" }), {
        status: 500,
      });
    }
    const convex = new ConvexHttpClient(convexUrl);
    const rows = await convex.query(api.mockIssues.list, {});
    const mapped = rows.map((it) => ({
      id: it.id,
      title: it.title,
      body: it.body,
      number: it.number,
      html_url: it.html_url,
      repository: it.repository,
      author: it.author,
      isPullRequest: it.isPullRequest,
    }));
    return Response.json(mapped);
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing GITHUB_TOKEN" }), {
      status: 500,
    });
  }

  // Search assigned issues and PRs updated recently
  const q = encodeURIComponent("is:open is:issue,pr involves:@me archived:false sort:updated-desc");
  const url = `https://api.github.com/search/issues?q=${q}&per_page=25`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: text || "GitHub error" }), {
      status: 502,
    });
  }

  const data = (await res.json()) as { items: any[] };

  const mapped = data.items.map((it) => {
    // repo info comes in repository_url like https://api.github.com/repos/owner/repo
    const repoPath = it.repository_url?.split("/repos/")?.[1] ?? "";
    const isPR = !!it.pull_request;
    return {
      id: String(it.id),
      title: it.title,
      body: it.body ?? "",
      number: it.number,
      html_url: it.html_url,
      repository: repoPath, // owner/repo
      author: it.user?.login ?? "unknown",
      isPullRequest: isPR,
    };
  });

  return Response.json(mapped);
}
