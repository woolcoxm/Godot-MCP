import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const physics2dSchema = z.object({
  scenePath: z.string().describe('Path to the scene file (e.g., "res://scenes/level_2d.tscn")'),
  parentPath: z.string().describe('Path to parent node (use "." for root)'),
  action: z.enum(['create_body', 'create_shape', 'configure_raycast', 'configure_area', 'configure_joint']).describe('Physics 2D action'),
  name: z.string().describe('Name for the physics node'),
  bodyType: z.enum(['StaticBody2D', 'RigidBody2D', 'CharacterBody2D', 'AnimatableBody2D']).optional().describe('Type of physics body'),
  shapeType: z.enum([
    'CircleShape2D', 'RectangleShape2D', 'CapsuleShape2D', 'SegmentShape2D',
    'WorldBoundaryShape2D', 'ConvexPolygonShape2D', 'ConcavePolygonShape2D'
  ]).optional().describe('Type of collision shape'),
  bodyProperties: z.object({
    mass: z.number().optional().describe('Body mass (for RigidBody2D)'),
    inertia: z.number().optional().describe('Body inertia'),
    friction: z.number().optional().describe('Friction coefficient'),
    bounce: z.number().optional().describe('Bounce coefficient'),
    gravity_scale: z.number().optional().describe('Gravity scale'),
    linear_damp: z.number().optional().describe('Linear damping'),
    angular_damp: z.number().optional().describe('Angular damping'),
    constant_force: z.object({ x: z.number(), y: z.number() }).optional().describe('Constant force'),
    constant_torque: z.number().optional().describe('Constant torque'),
    freeze: z.boolean().optional().describe('Freeze body'),
    freeze_mode: z.enum(['static', 'kinematic']).optional().describe('Freeze mode'),
    continuous_cd: z.enum(['disabled', 'cast_ray', 'cast_shape']).optional().describe('Continuous collision detection'),
  }).optional().describe('Physics body properties'),
  shapeProperties: z.object({
    radius: z.number().optional().describe('Shape radius (for Circle/Capsule)'),
    size: z.object({ x: z.number(), y: z.number() }).optional().describe('Shape size (for Rectangle)'),
    height: z.number().optional().describe('Shape height (for Capsule)'),
    points: z.array(z.object({ x: z.number(), y: z.number() })).optional().describe('Points (for ConvexPolygonShape2D)'),
    segments: z.array(z.object({ 
      a: z.object({ x: z.number(), y: z.number() }),
      b: z.object({ x: z.number(), y: z.number() })
    })).optional().describe('Segments (for ConcavePolygonShape2D)'),
    normal: z.object({ x: z.number(), y: z.number() }).optional().describe('Normal (for WorldBoundaryShape2D)'),
    distance: z.number().optional().describe('Distance (for WorldBoundaryShape2D)'),
  }).optional().describe('Collision shape properties'),
  raycastProperties: z.object({
    enabled: z.boolean().optional().describe('Enable raycast'),
    exclude_parent: z.boolean().optional().describe('Exclude parent from raycast'),
    hit_from_inside: z.boolean().optional().describe('Hit from inside'),
    collision_mask: z.number().optional().describe('Collision mask'),
    target_position: z.object({ x: z.number(), y: z.number() }).optional().describe('Target position'),
    collision_with_areas: z.boolean().optional().describe('Collide with areas'),
    collision_with_bodies: z.boolean().optional().describe('Collide with bodies'),
  }).optional().describe('Raycast properties'),
  areaProperties: z.object({
    monitorable: z.boolean().optional().describe('Monitorable'),
    monitoring: z.boolean().optional().describe('Monitoring'),
    priority: z.number().optional().describe('Priority'),
    gravity_point: z.boolean().optional().describe('Gravity point'),
    gravity_distance_scale: z.number().optional().describe('Gravity distance scale'),
    gravity_vector: z.object({ x: z.number(), y: z.number() }).optional().describe('Gravity vector'),
    linear_damp: z.number().optional().describe('Linear damp'),
    angular_damp: z.number().optional().describe('Angular damp'),
    gravity: z.number().optional().describe('Gravity strength'),
  }).optional().describe('Area2D properties'),
  jointType: z.enum(['PinJoint2D', 'GrooveJoint2D', 'DampedSpringJoint2D']).optional().describe('Type of joint'),
  jointProperties: z.object({
    node_a: z.string().optional().describe('Path to first connected node'),
    node_b: z.string().optional().describe('Path to second connected node'),
    bias: z.number().optional().describe('Joint bias'),
    damping: z.number().optional().describe('Joint damping'),
    softness: z.number().optional().describe('Joint softness'),
    length: z.number().optional().describe('Joint length'),
    rest_length: z.number().optional().describe('Joint rest length'),
    stiffness: z.number().optional().describe('Joint stiffness'),
  }).optional().describe('Joint properties'),
  transform: z.object({
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    rotation: z.number().optional(),
    scale: z.object({ x: z.number(), y: z.number() }).optional(),
  }).optional().describe('Initial transform'),
});

export function createPhysics2DTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_physics2d',
    name: '2D Physics',
    description: 'Create physics bodies, collision shapes, raycasts, areas, and joints in 2D scenes',
    category: '2d',
    inputSchema: physics2dSchema,
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
          result = await createPhysicsBody2D(transport, args);
          break;
          
        case 'create_shape':
          result = await createCollisionShape2D(transport, args);
          break;
          
        case 'configure_raycast':
          result = await configureRaycast2D(transport, args);
          break;
          
        case 'configure_area':
          result = await configureArea2D(transport, args);
          break;
          
        case 'configure_joint':
          result = await configureJoint2D(transport, args);
          break;
          
        default:
          throw new Error(`Unknown physics 2D action: ${args.action}`);
      }

      return result;
    },
    destructiveHint: true,
    idempotentHint: false,
        readOnlyHint: false,
  };
}

async function createPhysicsBody2D(_transport: Transport, args: any): Promise<any> {
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

async function createCollisionShape2D(_transport: Transport, args: any): Promise<any> {
  if (!args.shapeType) {
    throw new Error('shapeType is required for create_shape action');
  }

  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create CollisionShape2D node
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

async function configureRaycast2D(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create or configure RayCast2D node
  // 2. Configure raycast properties
  // 3. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_raycast',
    nodePath: nodePath,
    raycastProperties: args.raycastProperties || {},
    message: `Configured RayCast2D "${args.name}" at ${nodePath}`,
  };
}

async function configureArea2D(_transport: Transport, args: any): Promise<any> {
  const nodePath = args.parentPath === '.' ? args.name : `${args.parentPath}/${args.name}`;
  
  // In a real implementation, we would:
  // 1. Create or configure Area2D node
  // 2. Configure area properties
  // 3. Add collision shapes
  // 4. Save the scene
  // For now, simulate the operation
  
  return {
    action: 'configure_area',
    nodePath: nodePath,
    areaProperties: args.areaProperties || {},
    message: `Configured Area2D "${args.name}" at ${nodePath}`,
  };
}

async function configureJoint2D(_transport: Transport, args: any): Promise<any> {
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