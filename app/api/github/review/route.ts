import { NextRequest } from "next/server"

type Body = {
  repository: string // owner/repo
  number: number
  decision: "APPROVE" | "REQUEST_CHANGES"
  body?: string
}

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing GITHUB_TOKEN" }), {
      status: 500,
    })
  }
  const input = (await req.json()) as Body
  if (!input?.repository || !input?.number || !input?.decision) {
    return new Response(JSON.stringify({ error: "Invalid input" }), {
      status: 400,
    })
  }

  // Only PRs support reviews. If number points to an issue, this will 404 — that's fine.
  const path = `https://api.github.com/repos/${input.repository}/pulls/${input.number}/reviews`
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
      body: input.body ?? undefined,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(JSON.stringify({ error: text || "GitHub review error" }), {
      status: 502,
    })
  }

  return new Response(null, { status: 204 })
}


