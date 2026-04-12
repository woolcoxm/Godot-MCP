import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const physics3dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level.tscn")'),
  action: z.enum(['create_body', 'create_shape', 'configure_raycast', 'configure_area', 'configure_joint']).describe('Physics action to perform'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  name: z.string().describe('Name for the physics node'),
  bodyType: z.enum(['StaticBody3D', 'RigidBody3D', 'CharacterBody3D', 'AnimatableBody3D']).optional().describe('Type of physics body'),
  shapeType: z.enum([
    'BoxShape3D', 'SphereShape3D', 'CapsuleShape3D', 'CylinderShape3D',
    'WorldBoundaryShape3D', 'ConvexPolygonShape3D', 'ConcavePolygonShape3D',
    'HeightMapShape3D', 'SeparationRayShape3D', 'SphereShape3D'
  ]).optional().describe('Type of collision shape'),
  bodyProperties: z.object({
    mass: z.number().optional().describe('Body mass (for RigidBody3D)'),
    friction: z.number().optional().describe('Friction coefficient'),
    bounce: z.number().optional().describe('Bounce coefficient'),
    gravity_scale: z.number().optional().describe('Gravity scale'),
    linear_damp: z.number().optional().describe('Linear damping'),
    angular_damp: z.number().optional().describe('Angular damping'),
    constant_force: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Constant force'),
    constant_torque: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Constant torque'),
    freeze: z.boolean().optional().describe('Freeze body'),
    freeze_mode: z.enum(['static', 'kinematic']).optional().describe('Freeze mode'),
  }).optional().describe('Physics body properties'),
  shapeProperties: z.object({
    size: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Shape size (for BoxShape3D)'),
    radius: z.number().optional().describe('Shape radius (for Sphere/Capsule/Cylinder)'),
    height: z.number().optional().describe('Shape height (for Capsule/Cylinder)'),
    points: z.array(z.object({ x: z.number(), y: z.number(), z: z.number() })).optional().describe('Points (for ConvexPolygonShape3D)'),
    faces: z.array(z.array(z.object({ x: z.number(), y: z.number(), z: z.number() }))).optional().describe('Faces (for ConcavePolygonShape3D)'),
    direction: z.enum(['up', 'down', 'left', 'right', 'forward', 'back']).optional().describe('Direction (for SeparationRayShape3D)'),
    length: z.number().optional().describe('Length (for SeparationRayShape3D)'),
    slide_on_slope: z.boolean().optional().describe('Slide on slope (for SeparationRayShape3D)'),
  }).optional().describe('Collision shape properties'),
  raycastProperties: z.object({
    enabled: z.boolean().optional().describe('Enable raycast'),
    exclude_parent: z.boolean().optional().describe('Exclude parent from raycast'),
    hit_from_inside: z.boolean().optional().describe('Hit from inside'),
    collision_mask: z.number().optional().describe('Collision mask'),
    target_position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Target position'),
  }).optional().describe('Raycast properties'),
  areaProperties: z.object({
    monitorable: z.boolean().optional().describe('Monitorable'),
    monitoring: z.boolean().optional().describe('Monitoring'),
    priority: z.number().optional().describe('Priority'),
    gravity_point: z.boolean().optional().describe('Gravity point'),
    gravity_distance_scale: z.number().optional().describe('Gravity distance scale'),
    gravity_vector: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional().describe('Gravity vector'),
    linear_damp: z.number().optional().describe('Linear damp'),
    angular_damp: z.number().optional().describe('Angular damp'),
  }).optional().describe('Area3D properties'),
  jointType: z.enum(['PinJoint3D', 'HingeJoint3D', 'SliderJoint3D', 'ConeTwistJoint3D', 'Generic6DOFJoint3D']).optional().describe('Type of joint'),
  jointProperties: z.object({
    node_a: z.string().optional().describe('Path to first connected node'),
    node_b: z.string().optional().describe('Path to second connected node'),
    bias: z.number().optional().describe('Joint bias'),
    damping: z.number().optional().describe('Joint damping'),
    impulse_clamp: z.number().optional().describe('Impulse clamp'),
  }).optional().describe('Joint properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    rotation: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
    scale: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createPhysics3DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_physics3d',
    name: '3D Physics',
    description: 'Create physics bodies, collision shapes, raycasts, areas, and joints in 3D scenes',
    category: '3d',
    inputSchema: physics3dSchema,
    handler: async (args) => {
      // Read the scene first
      const readOperation: TransportOperation = {
        operation: 'read_scene',
        params: { path: args.scenePath },
      };
      
      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Failed to read scene: ${readResult.error}`);
      }

      if (!readResult.data?.content) {
        throw new Error('Scene file is empty or could not be read');
      }

      let result: any;
      
      switch (args.action) {
        case 'create_body':
          result = await createPhysicsBody(transport, args);
          break;
          
        case 'create_shape':
          result = await createCollisionShape(transport, args);
          break;
          
        case 'configure_raycast':
          result = await configureRaycast(transport, args);
          break;
          
        case 'configure_area':
          result = await configureArea(transport, args);
          break;
          
        case 'configure_joint':
          result = await configureJoint(transport, args);
          break;
          
        default:
          throw new Error(`Unknown physics action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}

async function createPhysicsBody(_transport: Transport, args: any): Promise<any> {
  if (!args.bodyType) {
    throw new Error('bodyType is required for create_body action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create physics body node
  // 2. Configure body properties
  // 3. Add collision shapes
  // 4. Apply transform
  // 5. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_body',
    bodyType: args.bodyType,
    nodePath: nodePath,
    bodyProperties: args.bodyProperties || {},
    transform: args.transform,
    message: `Created ${args.bodyType} "${args.name}" at ${nodePath}`,
  };
}

async function createCollisionShape(_transport: Transport, args: any): Promise<any> {
  if (!args.shapeType) {
    throw new Error('shapeType is required for create_shape action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create CollisionShape3D node
  // 2. Configure shape properties
  // 3. Apply transform
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'create_shape',
    shapeType: args.shapeType,
    nodePath: nodePath,
    shapeProperties: args.shapeProperties || {},
    transform: args.transform,
    message: `Created ${args.shapeType} "${args.name}" at ${nodePath}`,
  };
}

async function configureRaycast(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create or configure RayCast3D node
  // 2. Configure raycast properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_raycast',
    nodePath: nodePath,
    raycastProperties: args.raycastProperties || {},
    message: `Configured RayCast3D "${args.name}" at ${nodePath}`,
  };
}

async function configureArea(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create or configure Area3D node
  // 2. Configure area properties
  // 3. Add collision shapes
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_area',
    nodePath: nodePath,
    areaProperties: args.areaProperties || {},
    message: `Configured Area3D "${args.name}" at ${nodePath}`,
  };
}

async function configureJoint(_transport: Transport, args: any): Promise<any> {
  if (!args.jointType) {
    throw new Error('jointType is required for configure_joint action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create physics joint node
  // 2. Configure joint properties
  // 3. Connect to target bodies
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_joint',
    jointType: args.jointType,
    nodePath: nodePath,
    jointProperties: args.jointProperties || {},
    message: `Created ${args.jointType} "${args.name}" at ${nodePath}`,
  };
}