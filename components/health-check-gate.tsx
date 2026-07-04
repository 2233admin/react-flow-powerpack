"use client"

import { useSearchParams } from "next/navigation"
import { HealthCheck } from "@/components/health-check"

export function HealthCheckGate() {
  const params = useSearchParams()
  if (params.get("health") !== "1") return null
  return <HealthCheck />
}
