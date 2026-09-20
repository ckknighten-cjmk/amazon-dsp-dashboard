import { describe, expect, it } from "vitest";
import { seedDb } from "../data/seed";
import {
  CV_PIPELINE_STEPS,
  buildCvPipelineBoard,
  completedStageCount,
  pipelineForPhoto,
  resolveUploadPipeline,
} from "./cvPipeline";

describe("DVIC computer vision pipeline", () => {
  it("keeps the five-stage photo flow in order", () => {
    expect(CV_PIPELINE_STEPS.map((step) => step.label)).toEqual([
      "Photo Upload",
      "Computer Vision Analysis",
      "Damage Location Detection",
      "Compare To Previous Photos",
      "Potential New Damage Alert",
    ]);
  });

  it("completes the pipeline and alerts on a high-confidence new scrape", () => {
    const photo = seedDb.damagePhotos.find((row) => row.id === "ph-01b");
    expect(photo).toBeTruthy();
    const steps = pipelineForPhoto(photo!);
    expect(steps.map((step) => step.status)).toEqual(["complete", "complete", "complete", "complete", "alert"]);
    expect(completedStageCount(steps)).toBe(5);
    expect(steps[2].detail).toContain("driver door");
    expect(steps[4].detail.toLowerCase()).toContain("scrape");
  });

  it("skips compare and alert on a baseline photo", () => {
    const photo = seedDb.damagePhotos.find((row) => row.id === "ph-01a")!;
    const steps = pipelineForPhoto(photo);
    expect(steps[3].status).toBe("skipped");
    expect(steps[4].status).toBe("skipped");
  });

  it("maps an uploaded file name to a seeded comparison and lists alerts", () => {
    const door = resolveUploadPipeline("ev-210-door.jpg", seedDb);
    expect(door.id).toBe("ph-01b");
    const quarter = resolveUploadPipeline("EV-224-quarter.png", seedDb);
    expect(quarter.id).toBe("ph-04b");
    const board = buildCvPipelineBoard(seedDb);
    expect(board.alertCount).toBeGreaterThan(0);
    expect(board.alerts.some((row) => row.vanId === "EV-210")).toBe(true);
    expect(board.compared).toBeGreaterThan(0);
  });
});
