import { z } from "zod";

export const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
}).describe("3D vector with x, y, z components");

export const colorSchema = z.string().describe("Color as hex string (#RRGGBB or #RRGGBBAA)");

export const nodePathSchema = z.string().describe("Godot node path (e.g. '/root/Main/Node3D')");

export const resourcePathSchema = z.string().describe("Godot resource path (e.g. 'res://scenes/main.tscn')");

export const godotResultSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export const primitiveTypeSchema = z.enum([
  "box",
  "sphere",
  "cylinder",
  "capsule",
  "plane",
  "torus",
  "cone",
  "prism",
  "quad",
  "triangles",
]);

export const lightTypeSchema = z.enum([
  "directional",
  "omni",
  "spot",
]);

export const physicsBodyTypeSchema = z.enum([
  "rigid",
  "static",
  "character",
  "area",
]);

export const collisionShapeTypeSchema = z.enum([
  "box",
  "sphere",
  "capsule",
  "cylinder",
  "convex_polygon",
  "concave_polygon",
  "world_boundary",
  "separation_ray",
]);

export const materialPropertySchema = z.object({
  albedo_color: colorSchema.optional(),
  albedo_texture: resourcePathSchema.optional(),
  metallic: z.number().min(0).max(1).optional(),
  roughness: z.number().min(0).max(1).optional(),
  emission_enabled: z.boolean().optional(),
  emission_color: colorSchema.optional(),
  emission_energy: z.number().optional(),
  emission_texture: resourcePathSchema.optional(),
  normal_texture: resourcePathSchema.optional(),
  normal_scale: z.number().optional(),
  uv1_scale: vector3Schema.optional(),
  uv1_offset: vector3Schema.optional(),
  transparency: z.boolean().optional(),
  alpha_scissor_threshold: z.number().optional(),
  alpha_hash_scale: z.number().optional(),
  cull_mode: z.enum(["disabled", "front", "back", "max"]).optional(),
  distance_fade_enabled: z.boolean().optional(),
  distance_fade_min_distance: z.number().optional(),
  distance_fade_max_distance: z.number().optional(),
  detail_uv_layer: z.enum(["uv1", "uv2"]).optional(),
  metal_texture: resourcePathSchema.optional(),
  metal_texture_channel: z.enum(["red", "green", "blue", "alpha"]).optional(),
  roughness_texture: resourcePathSchema.optional(),
  roughness_texture_channel: z.enum(["red", "green", "blue", "alpha"]).optional(),
  ao_texture: resourcePathSchema.optional(),
  ao_texture_channel: z.enum(["red", "green", "blue", "alpha"]).optional(),
  ao_light_affect: z.number().optional(),
  ssr_enabled: z.boolean().optional(),
  ssr_roughness: z.number().optional(),
});

export const boneDefinitionSchema = z.object({
  name: z.string(),
  parent: z.string().optional().describe("Parent bone name, omit for root bone"),
  rest_position: vector3Schema.optional().describe("Rest position of the bone"),
  rest_rotation: vector3Schema.optional().describe("Rest rotation as Euler angles (degrees)"),
  rest_scale: vector3Schema.optional().describe("Rest scale"),
});
