export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Vector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Rect2 {
  position: Vector2;
  size: Vector2;
}

export interface Rect2i {
  position: Vector2i;
  size: Vector2i;
}

export interface Vector2i {
  x: number;
  y: number;
}

export interface Vector3i {
  x: number;
  y: number;
  z: number;
}

export interface Transform2D {
  x: Vector2;
  y: Vector2;
  origin: Vector2;
}

export interface Transform3D {
  basis: Basis;
  origin: Vector3;
}

export interface Basis {
  x: Vector3;
  y: Vector3;
  z: Vector3;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Plane {
  normal: Vector3;
  d: number;
}

export interface AABB {
  position: Vector3;
  size: Vector3;
}

export interface Projection {
  columns: [Vector4, Vector4, Vector4, Vector4];
}

export interface NodePath {
  path: string;
  name?: string;
}

export interface RID {
  id: number;
}

export interface GodotArray<T = any> {
  elements: T[];
}

export interface GodotDictionary {
  [key: string]: any;
}

export interface StringName {
  name: string;
}

export interface Signal {
  name: string;
  connections: SignalConnection[];
}

export interface SignalConnection {
  target: NodePath;
  method: string;
  flags: number;
  binds: any[];
  unbinds: number;
}

export interface PropertyInfo {
  name: string;
  type: string;
  hint?: string;
  hint_string?: string;
  usage?: number;
  default_value?: any;
}

export interface MethodInfo {
  name: string;
  return_type: string;
  flags: number;
  arguments: ArgumentInfo[];
  default_arguments: any[];
}

export interface ArgumentInfo {
  name: string;
  type: string;
  hint?: string;
  hint_string?: string;
}

export interface NodeInfo {
  name: string;
  type: string;
  path: NodePath;
  parent?: NodePath;
  children: (NodeInfo | NodePath)[];
  properties: Record<string, any>;
  groups: string[];
  script?: string | { path: string };
  metadata: Record<string, any>;
  instance?: string;
  instance_placeholder?: string;
}

export interface SceneInfo {
  path: string;
  root: NodeInfo;
  resources: ResourceInfo[];
  sub_resources: SubResourceInfo[];
  connections: ConnectionInfo[];
  format?: number;
  load_steps?: number;
  uid?: string;
  editable_instances?: string[];
}

export interface ResourceInfo {
  id: string;
  type: string;
  path: string;
}

export interface SubResourceInfo {
  id: string;
  type: string;
  properties: Record<string, any>;
}

export interface ConnectionInfo {
  from: NodePath;
  signal: string;
  to: NodePath;
  method: string;
  binds: any[];
  flags: number;
  source?: NodePath;
  target?: NodePath;
}

export interface ScriptInfo {
  path: string;
  class_name?: string;
  extends_class: string;
  signals: SignalDefinition[];
  variables: VariableDefinition[];
  functions: FunctionDefinition[];
  constants: ConstantDefinition[];
  enums: EnumDefinition[];
}

export interface SignalDefinition {
  name: string;
  arguments: ArgumentDefinition[];
}

export interface ArgumentDefinition {
  name: string;
  type: string;
  hint?: string;
  hint_string?: string;
}

export interface VariableDefinition {
  name: string;
  type: string;
  default_value?: any;
  export: boolean;
  onready: boolean;
  static: boolean;
}

export interface FunctionDefinition {
  name: string;
  return_type: string;
  arguments: ArgumentDefinition[];
  body: string;
  static: boolean;
  virtual: boolean;
}

export interface ConstantDefinition {
  name: string;
  value: any;
}

export interface EnumDefinition {
  name: string;
  values: Record<string, number>;
}

export type GodotType =
  | Vector2
  | Vector3
  | Vector4
  | Color
  | Rect2
  | Rect2i
  | Vector2i
  | Vector3i
  | Transform2D
  | Transform3D
  | Basis
  | Quaternion
  | Plane
  | AABB
  | Projection
  | NodePath
  | RID
  | GodotArray
  | GodotDictionary
  | StringName
  | Signal
  | PropertyInfo
  | MethodInfo
  | NodeInfo
  | SceneInfo
  | ResourceInfo
  | SubResourceInfo
  | ConnectionInfo
  | ScriptInfo;