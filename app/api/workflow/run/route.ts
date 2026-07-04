import workflowFixture from "../../../../lib/workflow/fixtures/workflow-intelligence.json"
import { createWorkflowRunArtifact } from "../../../../lib/workflow/run-artifacts"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => workflowFixture)
    const artifact = await createWorkflowRunArtifact(body ?? workflowFixture)

    return Response.json(artifact, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return Response.json(
      {
        error: "WORKFLOW_RUN_FAILED",
        message: error instanceof Error ? error.message : "Unknown workflow run error",
      },
      { status: 400 },
    )
  }
}
