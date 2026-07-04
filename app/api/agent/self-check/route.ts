import workflowFixture from "../../../../lib/workflow/fixtures/workflow-intelligence.json"
import { createAgentSelfCheckReport } from "../../../../lib/workflow/agent-self-check"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const report = await createAgentSelfCheckReport(workflowFixture, {
    endpoint: new URL(req.url).pathname,
  })

  return Response.json(report, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const report = await createAgentSelfCheckReport(body, {
      endpoint: new URL(req.url).pathname,
    })

    return Response.json(report, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: "AGENT_SELF_CHECK_FAILED",
        message: error instanceof Error ? error.message : "Unknown self-check error",
      },
      { status: 400 },
    )
  }
}
