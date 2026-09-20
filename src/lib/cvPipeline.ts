import type { DamagePhoto, SeedDatabase } from "../types/database";

export const CV_ALERT_THRESHOLD = 0.8;

export const CV_PIPELINE_STEPS = [
  { id: "photo_upload", label: "Photo Upload" },
  { id: "cv_analysis", label: "Computer Vision Analysis" },
  { id: "location_detection", label: "Damage Location Detection" },
  { id: "compare_previous", label: "Compare To Previous Photos" },
  { id: "new_damage_alert", label: "Potential New Damage Alert" },
] as const;

export type CvPipelineStepId = (typeof CV_PIPELINE_STEPS)[number]["id"];
export type CvStageStatus = "pending" | "running" | "complete" | "skipped" | "alert";

export interface CvPipelineStepState {
  id: CvPipelineStepId;
  label: string;
  status: CvStageStatus;
  detail: string;
}

export function pipelineForPhoto(photo: DamagePhoto): CvPipelineStepState[] {
  const uploaded = Boolean(photo.storage_path);
  const analyzed = photo.embedding_status === "ready";
  const failed = photo.embedding_status === "failed";
  const located = Boolean(photo.zone);
  const compared = photo.compared_to_photo_id !== null;
  const alert =
    !photo.is_baseline && compared && (photo.change_confidence ?? 0) >= CV_ALERT_THRESHOLD;

  return [
    {
      id: "photo_upload",
      label: "Photo Upload",
      status: uploaded ? "complete" : "pending",
      detail: uploaded ? photo.storage_path.split("/").slice(-1)[0] ?? photo.storage_path : "Waiting for upload",
    },
    {
      id: "cv_analysis",
      label: "Computer Vision Analysis",
      status: failed ? "alert" : analyzed ? "complete" : "pending",
      detail: analyzed
        ? `${photo.embedding_model ?? "vision"} · ${photo.embedding_dims}d · ${photo.embedding_status}`
        : failed
          ? "Embedding failed"
          : "Queued for analysis",
    },
    {
      id: "location_detection",
      label: "Damage Location Detection",
      status: located && analyzed ? "complete" : "pending",
      detail: located ? `${photo.zone.replace(/_/g, " ")} · ${photo.camera_angle}` : "Zone not detected",
    },
    {
      id: "compare_previous",
      label: "Compare To Previous Photos",
      status: photo.is_baseline ? "skipped" : compared ? "complete" : "pending",
      detail: photo.is_baseline
        ? "Baseline photo — comparison skipped"
        : compared
          ? `sim ${(photo.similarity_score ?? 0).toFixed(2)} · Δ ${(photo.change_confidence ?? 0).toFixed(2)}`
          : "No prior photo matched",
    },
    {
      id: "new_damage_alert",
      label: "Potential New Damage Alert",
      status: photo.is_baseline ? "skipped" : alert ? "alert" : compared ? "complete" : "pending",
      detail: photo.is_baseline
        ? "No alert on baseline"
        : alert
          ? (photo.ai_notes ?? "Potential new damage vs prior DVIC")
          : compared
            ? "No material change vs prior photo"
            : "Alert pending comparison",
    },
  ];
}

export function completedStageCount(steps: CvPipelineStepState[]): number {
  return steps.filter((step) => step.status === "complete" || step.status === "alert" || step.status === "skipped").length;
}

export function currentStageIndex(steps: CvPipelineStepState[]): number {
  const firstOpen = steps.findIndex((step) => step.status === "pending" || step.status === "running");
  return firstOpen === -1 ? steps.length - 1 : Math.max(0, firstOpen);
}

export function resolveUploadPipeline(fileName: string, db: SeedDatabase): DamagePhoto {
  const lower = fileName.toLowerCase();
  const id = /218|bumper/.test(lower)
    ? "ph-02b"
    : /224|quarter/.test(lower)
      ? "ph-04b"
      : /211|glass|wind/.test(lower)
        ? "ph-03b"
        : /223|collision/.test(lower)
          ? "ph-05b"
          : "ph-01b";
  return db.damagePhotos.find((photo) => photo.id === id) ?? db.damagePhotos[1];
}

export function runningStatuses(upToIndex: number): CvStageStatus[] {
  return CV_PIPELINE_STEPS.map((_, index) => {
    if (index < upToIndex) return "complete";
    if (index === upToIndex) return "running";
    return "pending";
  });
}

export function buildCvPipelineBoard(db: SeedDatabase) {
  const afterPhotos = db.damagePhotos.filter((photo) => !photo.is_baseline);
  const runs = afterPhotos.map((photo) => {
    const steps = pipelineForPhoto(photo);
    const event = db.damageEvents.find((row) => row.id === photo.damage_event_id);
    const vehicle = db.vehicles.find((row) => row.id === photo.vehicle_id);
    return {
      photo,
      steps,
      completed: completedStageCount(steps),
      alert: steps[4]?.status === "alert",
      vanId: vehicle?.van_id ?? photo.vehicle_id,
      zone: photo.zone,
      eventId: event?.id ?? photo.damage_event_id,
      notes: photo.ai_notes,
    };
  });
  const alerts = runs.filter((run) => run.alert);
  return {
    steps: CV_PIPELINE_STEPS,
    runs,
    alerts,
    uploaded: db.damagePhotos.length,
    analyzed: db.damagePhotos.filter((photo) => photo.embedding_status === "ready").length,
    compared: db.damagePhotos.filter((photo) => photo.compared_to_photo_id).length,
    alertCount: alerts.length,
  };
}
