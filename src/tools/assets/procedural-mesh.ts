import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const createProceduralMeshSchema = z.object({
  meshPath: z.string().describe('Path where to save the mesh file (e.g., "res://meshes/my_mesh.tres")'),
  meshType: z.enum(['plane', 'cube', 'sphere', 'cylinder', 'capsule', 'torus', 'cone', 'prism', 'pyramid', 'icosphere']).default('cube').describe('Type of procedural mesh to create'),
  
  // Plane parameters
  planeSize: z.object({
    width: z.number().min(0.1).max(100).default(2.0),
    height: z.number().min(0.1).max(100).default(2.0),
  }).optional().default({ width: 2.0, height: 2.0 }),
  planeSubdivisions: z.object({
    width: z.number().min(1).max(128).default(1),
    height: z.number().min(1).max(128).default(1),
  }).optional().default({ width: 1, height: 1 }),
  
  // Cube parameters
  cubeSize: z.object({
    width: z.number().min(0.1).max(100).default(2.0),
    height: z.number().min(0.1).max(100).default(2.0),
    depth: z.number().min(0.1).max(100).default(2.0),
  }).optional().default({ width: 2.0, height: 2.0, depth: 2.0 }),
  cubeSubdivisions: z.object({
    width: z.number().min(1).max(32).default(1),
    height: z.number().min(1).max(32).default(1),
    depth: z.number().min(1).max(32).default(1),
  }).optional().default({ width: 1, height: 1, depth: 1 }),
  
  // Sphere parameters
  sphereRadius: z.number().min(0.1).max(50).default(1.0),
  sphereSubdivisions: z.object({
    radial: z.number().min(3).max(128).default(24),
    rings: z.number().min(2).max(128).default(16),
  }).optional().default({ radial: 24, rings: 16 }),
  
  // Cylinder parameters
  cylinderRadius: z.number().min(0.1).max(50).default(1.0),
  cylinderHeight: z.number().min(0.1).max(100).default(2.0),
  cylinderSubdivisions: z.object({
    radial: z.number().min(3).max(128).default(24),
    rings: z.number().min(1).max(64).default(1),
    caps: z.boolean().default(true),
  }).optional().default({ radial: 24, rings: 1, caps: true }),
  
  // Capsule parameters
  capsuleRadius: z.number().min(0.1).max(50).default(1.0),
  capsuleHeight: z.number().min(0.1).max(100).default(2.0),
  capsuleSubdivisions: z.object({
    radial: z.number().min(3).max(128).default(24),
    rings: z.number().min(2).max(64).default(8),
  }).optional().default({ radial: 24, rings: 8 }),
  
  // Torus parameters
  torusInnerRadius: z.number().min(0.1).max(50).default(0.5),
  torusOuterRadius: z.number().min(0.1).max(50).default(1.0),
  torusSubdivisions: z.object({
    radial: z.number().min(3).max(128).default(24),
    rings: z.number().min(3).max(128).default(24),
  }).optional().default({ radial: 24, rings: 24 }),
  
  // Cone parameters
  coneRadius: z.number().min(0.1).max(50).default(1.0),
  coneHeight: z.number().min(0.1).max(100).default(2.0),
  coneSubdivisions: z.object({
    radial: z.number().min(3).max(128).default(24),
    caps: z.boolean().default(true),
  }).optional().default({ radial: 24, caps: true }),
  
  // Prism parameters
  prismSides: z.number().min(3).max(32).default(6),
  prismSize: z.object({
    width: z.number().min(0.1).max(100).default(2.0),
    height: z.number().min(0.1).max(100).default(2.0),
    depth: z.number().min(0.1).max(100).default(2.0),
  }).optional().default({ width: 2.0, height: 2.0, depth: 2.0 }),
  
  // Pyramid parameters
  pyramidSides: z.number().min(3).max(32).default(4),
  pyramidSize: z.object({
    width: z.number().min(0.1).max(100).default(2.0),
    height: z.number().min(0.1).max(100).default(2.0),
    depth: z.number().min(0.1).max(100).default(2.0),
  }).optional().default({ width: 2.0, height: 2.0, depth: 2.0 }),
  
  // Icosphere parameters
  icosphereRadius: z.number().min(0.1).max(50).default(1.0),
  icosphereSubdivisions: z.number().min(0).max(6).default(2),
  
  // Material
  materialPath: z.string().optional().describe('Path to material to apply to the mesh'),
  
  // UV and normals
  generateUVs: z.boolean().default(true).describe('Generate UV coordinates'),
  generateNormals: z.boolean().default(true).describe('Generate vertex normals'),
  generateTangents: z.boolean().default(false).describe('Generate vertex tangents'),
  
  // Mesh flags
  castShadow: z.boolean().default(true).describe('Mesh casts shadows'),
  receiveShadow: z.boolean().default(true).describe('Mesh receives shadows'),
});

// Helper to create mesh resource content
function createMeshResource(meshType: string, args: any): string {
  const baseMesh = [
    '[gd_resource type="ArrayMesh" load_steps=2 format=3]',
    '',
    '[ext_resource type="Material" path="res://default_material.tres" id="1_cbbd4"]',
    '',
    '[resource]',
  ];
  
  // Add material if provided
  if (args.materialPath) {
    baseMesh[2] = `[ext_resource type="Material" path="${args.materialPath}" id="1_cbbd4"]`;
  }
  
  // Create surface data placeholder
  // In a real implementation, we would generate actual mesh data
  // For now, we'll create a placeholder with mesh type information
  
  const surfaceData = [
    `surfaces/0 = {
"primitive": 4,
"arrays": [
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[],
[]
],
"blend_shape_data": [  ],
"bone_aabbs": [  ],
"format": 219,
"name": "${meshType}"
}`,
  ];
  
  baseMesh.push(...surfaceData);
  
  // Add mesh flags
  baseMesh.push(`custom_aabb = AABB(0, 0, 0, ${args.cubeSize?.width || 2}, ${args.cubeSize?.height || 2}, ${args.cubeSize?.depth || 2})`);
  baseMesh.push(`shadow_mesh = SubResource("1")`);
  baseMesh.push(`lightmap_size_hint = Vector2i(0, 0)`);
  
  return baseMesh.join('\n');
}

// Helper to create mesh description
function createMeshDescription(meshType: string, args: any): string {
  let description = '';
  
  switch (meshType) {
    case 'plane':
      description = `Plane mesh (${args.planeSize.width}x${args.planeSize.height}) with ${args.planeSubdivisions.width}x${args.planeSubdivisions.height} subdivisions`;
      break;
    case 'cube':
      description = `Cube mesh (${args.cubeSize.width}x${args.cubeSize.height}x${args.cubeSize.depth}) with ${args.cubeSubdivisions.width}x${args.cubeSubdivisions.height}x${args.cubeSubdivisions.depth} subdivisions`;
      break;
    case 'sphere':
      description = `Sphere mesh (radius: ${args.sphereRadius}) with ${args.sphereSubdivisions.radial} radial segments and ${args.sphereSubdivisions.rings} rings`;
      break;
    case 'cylinder':
      description = `Cylinder mesh (radius: ${args.cylinderRadius}, height: ${args.cylinderHeight}) with ${args.cylinderSubdivisions.radial} sides`;
      if (args.cylinderSubdivisions.caps) {
        description += ' and caps';
      }
      break;
    case 'capsule':
      description = `Capsule mesh (radius: ${args.capsuleRadius}, height: ${args.capsuleHeight}) with ${args.capsuleSubdivisions.radial} radial segments and ${args.capsuleSubdivisions.rings} rings`;
      break;
    case 'torus':
      description = `Torus mesh (inner: ${args.torusInnerRadius}, outer: ${args.torusOuterRadius}) with ${args.torusSubdivisions.radial}x${args.torusSubdivisions.rings} subdivisions`;
      break;
    case 'cone':
      description = `Cone mesh (radius: ${args.coneRadius}, height: ${args.coneHeight}) with ${args.coneSubdivisions.radial} sides`;
      if (args.coneSubdivisions.caps) {
        description += ' and cap';
      }
      break;
    case 'prism':
      description = `Prism mesh (${args.prismSides} sides, ${args.prismSize.width}x${args.prismSize.height}x${args.prismSize.depth})`;
      break;
    case 'pyramid':
      description = `Pyramid mesh (${args.pyramidSides} sides, ${args.pyramidSize.width}x${args.pyramidSize.height}x${args.pyramidSize.depth})`;
      break;
    case 'icosphere':
      description = `Icosphere mesh (radius: ${args.icosphereRadius}) with ${args.icosphereSubdivisions} subdivisions`;
      break;
  }
  
  // Add feature flags
  const features: string[] = [];
  if (args.generateUVs) features.push('UVs');
  if (args.generateNormals) features.push('normals');
  if (args.generateTangents) features.push('tangents');
  if (args.castShadow) features.push('casts shadows');
  if (args.receiveShadow) features.push('receives shadows');
  
  if (features.length > 0) {
    description += ` [${features.join(', ')}]`;
  }
  
  return description;
}

// Helper to estimate vertex and triangle counts
function estimateMeshComplexity(meshType: string, args: any): { vertices: number, triangles: number } {
  let vertices = 0;
  let triangles = 0;
  
  switch (meshType) {
    case 'plane':
      const planeVerts = (args.planeSubdivisions.width + 1) * (args.planeSubdivisions.height + 1);
      const planeTris = args.planeSubdivisions.width * args.planeSubdivisions.height * 2;
      vertices = planeVerts;
      triangles = planeTris;
      break;
      
    case 'cube':
      // 6 faces, each is a plane
      const cubeVertsPerFace = (args.cubeSubdivisions.width + 1) * (args.cubeSubdivisions.height + 1);
      const cubeTrisPerFace = args.cubeSubdivisions.width * args.cubeSubdivisions.height * 2;
      vertices = cubeVertsPerFace * 6;
      triangles = cubeTrisPerFace * 6;
      break;
      
    case 'sphere':
      // Sphere: (rings-1)*(radial+1)*2 triangles per ring segment
      vertices = (args.sphereSubdivisions.rings + 1) * (args.sphereSubdivisions.radial + 1);
      triangles = args.sphereSubdivisions.rings * args.sphereSubdivisions.radial * 2;
      break;
      
    case 'cylinder':
      // Body: rings*(radial+1) vertices, rings*radial*2 triangles
      // Caps: 2*(radial+2) vertices, 2*radial triangles (if caps enabled)
      const bodyVerts = (args.cylinderSubdivisions.rings + 1) * (args.cylinderSubdivisions.radial + 1);
      const bodyTris = args.cylinderSubdivisions.rings * args.cylinderSubdivisions.radial * 2;
      let capVerts = 0;
      let capTris = 0;
      
      if (args.cylinderSubdivisions.caps) {
        capVerts = 2 * (args.cylinderSubdivisions.radial + 2); // +2 for center vertices
        capTris = 2 * args.cylinderSubdivisions.radial;
      }
      
      vertices = bodyVerts + capVerts;
      triangles = bodyTris + capTris;
      break;
      
    case 'capsule':
      // Similar to cylinder but with hemispherical caps
      vertices = (args.capsuleSubdivisions.rings + 1) * (args.capsuleSubdivisions.radial + 1);
      triangles = args.capsuleSubdivisions.rings * args.capsuleSubdivisions.radial * 2;
      break;
      
    case 'torus':
      vertices = (args.torusSubdivisions.rings + 1) * (args.torusSubdivisions.radial + 1);
      triangles = args.torusSubdivisions.rings * args.torusSubdivisions.radial * 2;
      break;
      
    case 'cone':
      // Body: (radial+1) vertices per ring, radial*2 triangles
      // Cap: radial+2 vertices, radial triangles (if cap enabled)
      const coneBodyVerts = (args.coneSubdivisions.radial + 1);
      const coneBodyTris = args.coneSubdivisions.radial * 2;
      let coneCapVerts = 0;
      let coneCapTris = 0;
      
      if (args.coneSubdivisions.caps) {
        coneCapVerts = args.coneSubdivisions.radial + 2;
        coneCapTris = args.coneSubdivisions.radial;
      }
      
      vertices = coneBodyVerts + coneCapVerts;
      triangles = coneBodyTris + coneCapTris;
      break;
      
    case 'prism':
      // n-sided prism: 2*n vertices for ends, n vertices for sides = 3n vertices
      // 2*(n-2) triangles for ends, 2*n triangles for sides = 4n-4 triangles
      vertices = 3 * args.prismSides;
      triangles = 4 * args.prismSides - 4;
      break;
      
    case 'pyramid':
      // n-sided pyramid: n+1 vertices for base and apex
      // (n-2) triangles for base, n triangles for sides = 2n-2 triangles
      vertices = args.pyramidSides + 1;
      triangles = 2 * args.pyramidSides - 2;
      break;
      
    case 'icosphere':
      // Icosphere: 12*4^subdivisions vertices, 20*4^subdivisions triangles
      vertices = 12 * Math.pow(4, args.icosphereSubdivisions);
      triangles = 20 * Math.pow(4, args.icosphereSubdivisions);
      break;
  }
  
  return { vertices, triangles };
}

export function createProceduralMeshTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_create_procedural_mesh',
    name: 'Create Procedural Mesh',
    description: 'Create a procedural mesh resource with various primitive shapes',
    category: 'assets',
    inputSchema: createProceduralMeshSchema,
    handler: async (args) => {
      // Generate mesh resource content
      const meshContent = createMeshResource(args.meshType, args);
      const meshDescription = createMeshDescription(args.meshType, args);
      const complexity = estimateMeshComplexity(args.meshType, args);
      
      // Write the mesh file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.meshPath,
          content: meshContent,
        },
      };
      
      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to create mesh file: ${writeResult.error}`);
      }
      
      // Create a simple default material if none provided and mesh needs it
      if (!args.materialPath) {
        const materialPath = args.meshPath.replace('.tres', '_material.tres');
        
        const materialContent = [
          '[gd_resource type="StandardMaterial3D" load_steps=1 format=3]',
          '',
          '[resource]',
          'albedo_color = Color(0.8, 0.8, 0.8, 1)',
          'metallic = 0.0',
          'roughness = 0.5',
          'emission_enabled = false',
        ].join('\n');
        
        const materialWriteOp: TransportOperation = {
          operation: 'write_file',
          params: {
            path: materialPath,
            content: materialContent,
          },
        };
        
        await transport.execute(materialWriteOp);
      }
      
      return {
        meshPath: args.meshPath,
        meshType: args.meshType,
        description: meshDescription,
        complexity,
        materialPath: args.materialPath || args.meshPath.replace('.tres', '_material.tres'),
        features: {
          generateUVs: args.generateUVs,
          generateNormals: args.generateNormals,
          generateTangents: args.generateTangents,
          castShadow: args.castShadow,
          receiveShadow: args.receiveShadow,
        },
        contentLength: meshContent.length,
        message: `Created ${args.meshType} mesh at ${args.meshPath} (estimated: ${complexity.vertices} vertices, ${complexity.triangles} triangles)`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}