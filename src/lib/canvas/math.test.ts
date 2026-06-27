import { describe, expect, it } from "vitest";
import type { Camera, Point, Shape } from "@/types/canvas";
import {
  applyResize,
  applyRotation,
  getResizeHandle,
  getSelectionBoundingBox,
  getShapeBoundingBox,
  hitTestShape,
  screenToWorld,
  snapToGrid,
  worldToScreen,
} from "./math";

// ---------------------------------------------------------------------------
// Helpers — factory functions for test shapes
// ---------------------------------------------------------------------------

function makeRect(overrides?: Partial<Shape>): Shape {
  return {
    id: "r1" as Shape["id"],
    type: "rect",
    x: 100,
    y: 100,
    width: 200,
    height: 100,
    rotation: 0,
    fill: "#fff",
    stroke: "#000",
    strokeWidth: 1,
    opacity: 1,
    locked: false,
    createdBy: "test",
    updatedAt: 0,
    ...overrides,
  } as Shape;
}

function makePen(points: Point[]): Shape {
  return {
    id: "p1" as Shape["id"],
    type: "pen",
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    fill: "none",
    stroke: "#000",
    strokeWidth: 2,
    opacity: 1,
    locked: false,
    createdBy: "test",
    updatedAt: 0,
    points,
  } as Shape;
}

const IDENTITY_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

// ---------------------------------------------------------------------------
// screenToWorld
// ---------------------------------------------------------------------------

describe("screenToWorld", () => {
  it("identity camera — returns the same point", () => {
    const result = screenToWorld({ x: 300, y: 200 }, IDENTITY_CAMERA);
    expect(result).toEqual({ x: 300, y: 200 });
  });

  it("camera offset — subtracts offset and divides by zoom", () => {
    const camera: Camera = { x: 100, y: 50, zoom: 2 };
    const result = screenToWorld({ x: 200, y: 150 }, camera);
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it("zoom-only — divides by zoom without offset", () => {
    const camera: Camera = { x: 0, y: 0, zoom: 4 };
    const result = screenToWorld({ x: 400, y: 200 }, camera);
    expect(result).toEqual({ x: 100, y: 50 });
  });
});

// ---------------------------------------------------------------------------
// worldToScreen
// ---------------------------------------------------------------------------

describe("worldToScreen", () => {
  it("identity camera — returns the same point", () => {
    const result = worldToScreen({ x: 300, y: 200 }, IDENTITY_CAMERA);
    expect(result).toEqual({ x: 300, y: 200 });
  });

  it("camera offset — multiplies by zoom and adds offset", () => {
    const camera: Camera = { x: 100, y: 50, zoom: 2 };
    const result = worldToScreen({ x: 50, y: 50 }, camera);
    expect(result).toEqual({ x: 200, y: 150 });
  });

  it("is the inverse of screenToWorld", () => {
    const camera: Camera = { x: -30, y: 40, zoom: 1.5 };
    const world: Point = { x: 120, y: 80 };
    const screen = worldToScreen(world, camera);
    const backToWorld = screenToWorld(screen, camera);
    expect(backToWorld.x).toBeCloseTo(world.x);
    expect(backToWorld.y).toBeCloseTo(world.y);
  });
});

// ---------------------------------------------------------------------------
// snapToGrid
// ---------------------------------------------------------------------------

describe("snapToGrid", () => {
  it("rounds down to nearest grid line", () => {
    expect(snapToGrid(23, 20)).toBe(20);
  });

  it("rounds up to nearest grid line", () => {
    expect(snapToGrid(31, 20)).toBe(40);
  });

  it("already on grid — unchanged", () => {
    expect(snapToGrid(40, 20)).toBe(40);
  });

  it("negative value snaps correctly", () => {
    // Math.round(-7/20)*20 = Math.round(-0.35)*20 = 0*20 = -0 (IEEE 754)
    // toBeCloseTo treats -0 and 0 as equal, which is the correct semantic
    expect(snapToGrid(-7, 20)).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// getShapeBoundingBox
// ---------------------------------------------------------------------------

describe("getShapeBoundingBox", () => {
  it("rect — returns x/y/width/height directly", () => {
    const shape = makeRect({ x: 50, y: 60, width: 120, height: 80 });
    expect(getShapeBoundingBox(shape)).toEqual({
      x: 50,
      y: 60,
      width: 120,
      height: 80,
    });
  });

  it("ellipse — same as rect (uses base fields)", () => {
    const shape = { ...makeRect(), type: "ellipse" } as Shape;
    expect(getShapeBoundingBox(shape)).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    });
  });

  it("pen — derives bbox from points", () => {
    const pen = makePen([
      { x: 10, y: 20 },
      { x: 50, y: 5 },
      { x: 30, y: 40 },
    ]);
    expect(getShapeBoundingBox(pen)).toEqual({
      x: 10,
      y: 5,
      width: 40,
      height: 35,
    });
  });

  it("pen with empty points — falls back to shape x/y", () => {
    const pen = makePen([]);
    const bbox = getShapeBoundingBox(pen);
    expect(bbox).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});

// ---------------------------------------------------------------------------
// hitTestShape
// ---------------------------------------------------------------------------

describe("hitTestShape", () => {
  it("point inside unrotated rect — returns true", () => {
    const shape = makeRect({ x: 100, y: 100, width: 200, height: 100 });
    expect(hitTestShape({ x: 150, y: 130 }, shape)).toBe(true);
  });

  it("point outside unrotated rect — returns false", () => {
    const shape = makeRect({ x: 100, y: 100, width: 200, height: 100 });
    expect(hitTestShape({ x: 50, y: 50 }, shape)).toBe(false);
  });

  it("point inside a 45° rotated rect — returns true", () => {
    // Shape centered at (200, 200), 100×100, rotated 45°
    // The center of the shape is still the test point — always inside
    const shape = makeRect({
      x: 150,
      y: 150,
      width: 100,
      height: 100,
      rotation: Math.PI / 4, // 45°
    });
    // Center of the shape — should always be inside regardless of rotation
    expect(hitTestShape({ x: 200, y: 200 }, shape)).toBe(true);
  });

  it("point at a corner of the AABB that is outside the rotated shape — returns false", () => {
    // Thin rect 10×200 at (95,100), centered at (100,200), rotated 45°
    // The AABB corner (95,100) is not inside the rotated footprint
    const shape = makeRect({
      x: 95,
      y: 100,
      width: 10,
      height: 200,
      rotation: Math.PI / 4, // 45°
    });
    // A far corner of the unrotated bbox that would not be inside the rotated shape
    expect(hitTestShape({ x: 200, y: 101 }, shape)).toBe(false);
  });

  it("point on the boundary (corner) — returns true", () => {
    const shape = makeRect({ x: 0, y: 0, width: 100, height: 50, rotation: 0 });
    expect(hitTestShape({ x: 0, y: 0 }, shape)).toBe(true);
    expect(hitTestShape({ x: 100, y: 50 }, shape)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSelectionBoundingBox
// ---------------------------------------------------------------------------

describe("getSelectionBoundingBox", () => {
  it("empty array — returns null", () => {
    expect(getSelectionBoundingBox([])).toBeNull();
  });

  it("single shape — returns its bounding box", () => {
    const shape = makeRect({ x: 10, y: 20, width: 80, height: 40 });
    expect(getSelectionBoundingBox([shape])).toEqual({
      x: 10,
      y: 20,
      width: 80,
      height: 40,
    });
  });

  it("two non-overlapping shapes — returns union", () => {
    const a = makeRect({ x: 0, y: 0, width: 50, height: 50 });
    const b = makeRect({ x: 100, y: 100, width: 50, height: 50 });
    expect(getSelectionBoundingBox([a, b])).toEqual({
      x: 0,
      y: 0,
      width: 150,
      height: 150,
    });
  });

  it("two overlapping shapes — returns tight union", () => {
    const a = makeRect({ x: 0, y: 0, width: 100, height: 60 });
    const b = makeRect({ x: 50, y: 20, width: 80, height: 60 });
    expect(getSelectionBoundingBox([a, b])).toEqual({
      x: 0,
      y: 0,
      width: 130,
      height: 80,
    });
  });
});

// ---------------------------------------------------------------------------
// getResizeHandle
// ---------------------------------------------------------------------------

describe("getResizeHandle", () => {
  // bbox at world (0,0) 200×100 — screen = world at zoom=1, offset=0
  const bbox = { x: 0, y: 0, width: 200, height: 100 };
  const cam = IDENTITY_CAMERA;

  it("pointer exactly on 'se' corner — returns se", () => {
    // se is at world (200, 100) = screen (200, 100)
    expect(getResizeHandle({ x: 200, y: 100 }, bbox, cam)).toBe("se");
  });

  it("pointer exactly on 'n' midpoint — returns n", () => {
    // n is at world (100, 0) = screen (100, 0)
    expect(getResizeHandle({ x: 100, y: 0 }, bbox, cam)).toBe("n");
  });

  it("pointer in the interior — returns null", () => {
    expect(getResizeHandle({ x: 100, y: 50 }, bbox, cam)).toBeNull();
  });

  it("pointer near 'nw' within hit radius — returns nw", () => {
    // nw is at screen (0,0), hit radius = 4 — test at (3, 3)
    expect(getResizeHandle({ x: 3, y: 3 }, bbox, cam)).toBe("nw");
  });

  it("pointer just outside 'nw' hit radius — returns null", () => {
    // hit radius = 4, so (5, 5) is outside
    expect(getResizeHandle({ x: 5, y: 5 }, bbox, cam)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyResize
// ---------------------------------------------------------------------------

describe("applyResize", () => {
  const base = makeRect({ x: 100, y: 100, width: 200, height: 100 });

  it("se handle — grows to the right and down", () => {
    const result = applyResize(base, "se", { x: 20, y: 10 }, false);
    expect(result).toMatchObject({ x: 100, y: 100, width: 220, height: 110 });
  });

  it("nw handle — shrinks from top-left", () => {
    const result = applyResize(base, "nw", { x: 10, y: 10 }, false);
    expect(result).toMatchObject({ x: 110, y: 110, width: 190, height: 90 });
  });

  it("n handle — only height changes, x/width unchanged", () => {
    const result = applyResize(base, "n", { x: 0, y: -20 }, false);
    expect(result).toMatchObject({ x: 100, y: 80, width: 200, height: 120 });
  });

  it("e handle — only width changes", () => {
    const result = applyResize(base, "e", { x: 50, y: 0 }, false);
    expect(result).toMatchObject({ x: 100, y: 100, width: 250, height: 100 });
  });

  it("clamps width to MIN_SHAPE_SIZE", () => {
    const result = applyResize(base, "e", { x: -9999, y: 0 }, false);
    expect(result.width).toBeGreaterThanOrEqual(4);
  });

  it("se with aspect lock — height follows width", () => {
    // 2:1 aspect (200×100). Drag se by (100,0) → width becomes 300.
    const result = applyResize(base, "se", { x: 100, y: 0 }, true);
    // aspect = 200/100 = 2; newHeight = 300/2 = 150
    expect(result.width).toBe(300);
    expect(result.height).toBe(150);
  });
});

// ---------------------------------------------------------------------------
// applyRotation
// ---------------------------------------------------------------------------

describe("applyRotation", () => {
  const pivot = { x: 0, y: 0 };

  it("adds angleDelta to current rotation", () => {
    const shape = makeRect({ rotation: 0 });
    const result = applyRotation(shape, pivot, Math.PI / 2);
    expect(result.rotation).toBeCloseTo(Math.PI / 2);
  });

  it("wraps rotation past 2π back to [0, 2π)", () => {
    const shape = makeRect({ rotation: Math.PI * 1.9 });
    const result = applyRotation(shape, pivot, Math.PI * 0.5);
    // 1.9π + 0.5π = 2.4π → wraps to 0.4π
    expect(result.rotation).toBeCloseTo(0.4 * Math.PI);
  });

  it("negative angleDelta wraps correctly into positive range", () => {
    const shape = makeRect({ rotation: 0 });
    const result = applyRotation(shape, pivot, -Math.PI / 4);
    // 0 - π/4 = -π/4 → +7π/4
    expect(result.rotation).toBeCloseTo((7 * Math.PI) / 4);
  });

  it("full rotation (2π) returns near-zero", () => {
    const shape = makeRect({ rotation: 0 });
    const result = applyRotation(shape, pivot, Math.PI * 2);
    expect(result.rotation).toBeCloseTo(0);
  });
});
