// IslandReady AI — deployment feature gates (assessment deployment).
// Server-side only. Unset/anything-but-"false" means ENABLED, so local
// development behavior is unchanged unless explicitly disabled.
export function isAiEnabled(): boolean {
  return process.env.FEATURE_AI !== "false";
}

export function isUploadsEnabled(): boolean {
  return process.env.FEATURE_UPLOADS !== "false";
}

export function unavailableResponse(feature: string): Response {
  return Response.json(
    {
      error: `${feature} is temporarily unavailable in this deployment.`,
      available: false,
    },
    { status: 503 }
  );
}
