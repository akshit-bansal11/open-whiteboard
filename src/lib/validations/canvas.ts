import { z } from "zod"

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/**
 * A non-empty string validated to be a ShapeId (branded at the type level).
 * At runtime we can't enforce the brand — we just ensure it's a non-empty string.
 */
const ShapeIdSchema = z.string().min(1)

const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

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
  shapeOpacity: z.number().min(0).max(1).default(1),
  strokeOpacity: z.number().min(0).max(1).default(1),
  locked: z.boolean(),
  createdBy: z.string().min(1),
  updatedAt: z.number().int().nonnegative(),
  cornerRadius: z.number().min(0).default(0),
  dashArray: z.array(z.number()).default([]),
  fillStyle: z.enum(["solid", "hachure", "none"]).default("solid"),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
})

// ---------------------------------------------------------------------------
// Shape variants
// ---------------------------------------------------------------------------

export const RectShapeSchema = BaseShapeSchema.extend({
  type: z.literal("rect"),
})

export const EllipseShapeSchema = BaseShapeSchema.extend({
  type: z.literal("ellipse"),
})

export const TextShapeSchema = BaseShapeSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  fontSize: z.number().positive().finite(),
  fontFamily: z.string().min(1),
  textAlign: z.enum(["left", "center", "right"]),
})

export const PenShapeSchema = BaseShapeSchema.extend({
  type: z.literal("pen"),
  /** At least two points are needed to form a visible stroke. */
  points: z.array(PointSchema).min(2),
})

export const DiamondShapeSchema = BaseShapeSchema.extend({
  type: z.literal("diamond"),
})

export const TriangleShapeSchema = BaseShapeSchema.extend({
  type: z.literal("triangle"),
})

export const PolygonShapeSchema = BaseShapeSchema.extend({
  type: z.literal("polygon"),
  sides: z.number().int().min(3).max(20),
})

export const StarShapeSchema = BaseShapeSchema.extend({
  type: z.literal("star"),
  points: z.number().int().min(3).max(20),
})

export const StarPolygonShapeSchema = BaseShapeSchema.extend({
  type: z.literal("star-polygon"),
  points: z.number().int().min(3).max(20),
})

export const ArrowShapeSchema = BaseShapeSchema.extend({
  type: z.literal("arrow"),
  startX: z.number().finite(),
  startY: z.number().finite(),
  endX: z.number().finite(),
  endY: z.number().finite(),
  arrowHead: z.enum(["none", "start", "end", "both"]),
  headStyle: z.enum(["classic", "triangle", "stealth", "diamond"]),
})

export const LineShapeSchema = BaseShapeSchema.extend({
  type: z.literal("line"),
  startX: z.number().finite(),
  startY: z.number().finite(),
  endX: z.number().finite(),
  endY: z.number().finite(),
})

export const ImageShapeSchema = BaseShapeSchema.extend({
  type: z.literal("image"),
  src: z.string().min(1),
  naturalWidth: z.number().positive().finite(),
  naturalHeight: z.number().positive().finite(),
})

// ---------------------------------------------------------------------------
// Discriminated union — the primary public schema
// ---------------------------------------------------------------------------

export const ShapeSchema = z.discriminatedUnion("type", [
  RectShapeSchema,
  EllipseShapeSchema,
  TextShapeSchema,
  PenShapeSchema,
  DiamondShapeSchema,
  TriangleShapeSchema,
  PolygonShapeSchema,
  StarShapeSchema,
  StarPolygonShapeSchema,
  ArrowShapeSchema,
  LineShapeSchema,
  ImageShapeSchema,
])

// ---------------------------------------------------------------------------
// Inferred types
// These replace hand-written types and are always in sync with the schemas.
// ---------------------------------------------------------------------------

export type RectShapeValidated = z.infer<typeof RectShapeSchema>
export type EllipseShapeValidated = z.infer<typeof EllipseShapeSchema>
export type TextShapeValidated = z.infer<typeof TextShapeSchema>
export type PenShapeValidated = z.infer<typeof PenShapeSchema>
export type DiamondShapeValidated = z.infer<typeof DiamondShapeSchema>
export type TriangleShapeValidated = z.infer<typeof TriangleShapeSchema>
export type PolygonShapeValidated = z.infer<typeof PolygonShapeSchema>
export type StarShapeValidated = z.infer<typeof StarShapeSchema>
export type StarPolygonShapeValidated = z.infer<typeof StarPolygonShapeSchema>
export type ArrowShapeValidated = z.infer<typeof ArrowShapeSchema>
export type LineShapeValidated = z.infer<typeof LineShapeSchema>
export type ImageShapeValidated = z.infer<typeof ImageShapeSchema>

/** Union of all validated shape types — runtime-safe counterpart to `Shape`. */
export type ShapeValidated = z.infer<typeof ShapeSchema>

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
  DiamondShapeSchema.partial().required({ id: true }),
  TriangleShapeSchema.partial().required({ id: true }),
  PolygonShapeSchema.partial().required({ id: true }),
  StarShapeSchema.partial().required({ id: true }),
  StarPolygonShapeSchema.partial().required({ id: true }),
  ArrowShapeSchema.partial().required({ id: true }),
  LineShapeSchema.partial().required({ id: true }),
  ImageShapeSchema.partial().required({ id: true }),
])
