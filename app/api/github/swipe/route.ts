import { api as generatedApi } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest } from "next/server";

type Decision = "APPROVE" | "REQUEST_CHANGES" | "ACK" | "NEEDS_DISCUSSION";

type Body = {
  item: {
    id: string;
    repository: string; // owner/repo
    number: number;
    isPullRequest: boolean;
  };
  decision: Decision;
  note?: string;
  sessionId?: string; // Convex Id<'swipeSessions'> as string
};

function isDecision(x: any): x is Decision {
  return x === "APPROVE" || x === "REQUEST_CHANGES" || x === "ACK" || x === "NEEDS_DISCUSSION";
}

export async function POST(req: NextRequest) {
  const { userId: clerkUserId, getToken } = await auth();
  if (!clerkUserId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing GITHUB_TOKEN" }), {
      status: 500,
    });
  }

  let input: Body;
  try {
    input = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  if (
    !input?.item?.id ||
    !input?.item?.repository ||
    typeof input?.item?.number !== "number" ||
    typeof input?.item?.isPullRequest !== "boolean" ||
    !isDecision(input?.decision)
  ) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new Response(JSON.stringify({ error: "Missing Convex URL" }), {
      status: 500,
    });
  }

  const convex = new ConvexHttpClient(convexUrl);
  try {
    const convexToken = await getToken({ template: "convex" });
    if (convexToken) convex.setAuth(convexToken);
  } catch {}

  // Resolve Convex user id by Clerk external id
  let logged = false;
  let postedReview = false;

  try {
    const result = await convex.mutation((generatedApi as any).swipes.logPublic, {
      itemId: input.item.id,
      repository: input.item.repository,
      number: input.item.number,
      isPullRequest: input.item.isPullRequest,
      decision: input.decision,
      note: input.note,
      sessionId: input.sessionId as any,
    });
    logged = !!result?.created;
  } catch (e) {
    // Swallow logging errors but report failure
    return new Response(JSON.stringify({ error: "Failed to log swipe", postedReview }), {
      status: 500,
    });
  }

  if (
    logged &&
    input.item.isPullRequest &&
    (input.decision === "APPROVE" || input.decision === "REQUEST_CHANGES")
  ) {
    try {
      const path = `https://api.github.com/repos/${input.item.repository}/pulls/${input.item.number}/reviews`;
      const res = await fetch(path, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: input.decision === "APPROVE" ? "APPROVE" : "REQUEST_CHANGES",
          body:
            input.note ??
            (input.decision === "APPROVE"
              ? "Approved via Swipe Reviewer ✅"
              : "Requesting changes via Swipe Reviewer ❌"),
        }),
      });

      if (res.ok) postedReview = true;
    } catch {
      // ignore network errors; postedReview remains false
    }
  }

  return Response.json({ logged, postedReview });
}
