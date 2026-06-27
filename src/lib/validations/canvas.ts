import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/**
 * A non-empty string validated to be a ShapeId (branded at the type level).
 * At runtime we can't enforce the brand — we just ensure it's a non-empty string.
 */
const ShapeIdSchema = z.string().min(1);

const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

// ---------------------------------------------------------------------------
// Base shape — fields shared by every shape variant
// ---------------------------------------------------------------------------

const BaseShapeSchema = z.object({
  id: ShapeIdSchema,
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite(),
  height: z.number().finite(),
  rotation: z.number().finite(),
  fill: z.string().min(1),
  stroke: z.string().min(1),
  strokeWidth: z.number().nonnegative().finite(),
  opacity: z.number().min(0).max(1),
  locked: z.boolean(),
  createdBy: z.string().min(1),
  updatedAt: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Shape variants
// ---------------------------------------------------------------------------

export const RectShapeSchema = BaseShapeSchema.extend({
  type: z.literal("rect"),
});

export const EllipseShapeSchema = BaseShapeSchema.extend({
  type: z.literal("ellipse"),
});

export const TextShapeSchema = BaseShapeSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.number().positive().finite(),
  fontFamily: z.string().min(1),
  textAlign: z.enum(["left", "center", "right"]),
});

export const PenShapeSchema = BaseShapeSchema.extend({
  type: z.literal("pen"),
  /** At least two points are needed to form a visible stroke. */
  points: z.array(PointSchema).min(2),
});

// ---------------------------------------------------------------------------
// Discriminated union — the primary public schema
// ---------------------------------------------------------------------------

export const ShapeSchema = z.discriminatedUnion("type", [
  RectShapeSchema,
  EllipseShapeSchema,
  TextShapeSchema,
  PenShapeSchema,
]);

// ---------------------------------------------------------------------------
// Inferred types
// These replace hand-written types and are always in sync with the schemas.
// ---------------------------------------------------------------------------

export type RectShapeValidated = z.infer<typeof RectShapeSchema>;
export type EllipseShapeValidated = z.infer<typeof EllipseShapeSchema>;
export type TextShapeValidated = z.infer<typeof TextShapeSchema>;
export type PenShapeValidated = z.infer<typeof PenShapeSchema>;

/** Union of all validated shape types — runtime-safe counterpart to `Shape`. */
export type ShapeValidated = z.infer<typeof ShapeSchema>;

// ---------------------------------------------------------------------------
// Partial update schema — used at API boundaries for PATCH-style ops
// ---------------------------------------------------------------------------

/**
 * A PATCH-style update: requires `id` + at least one field from any shape variant.
 * Because ZodDiscriminatedUnion doesn't support .partial(), we use a plain union
 * of partial variants so the id is always required.
 */
export const ShapeUpdateSchema = z.union([
  RectShapeSchema.partial().required({ id: true }),
  EllipseShapeSchema.partial().required({ id: true }),
  TextShapeSchema.partial().required({ id: true }),
  PenShapeSchema.partial().required({ id: true }),
]);
