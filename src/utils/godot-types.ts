import {
  Vector2,
  Vector3,
  Color,
  Transform2D,
  Transform3D,
  Basis,
  Quaternion,
  Plane,
  AABB,
  NodePath,
  RID,
  GodotArray,
  GodotDictionary,
  GodotType,
} from '../types/godot.js';

export class GodotTypeConverter {
  static toVector2(data: any): Vector2 {
    if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data) {
      return { x: Number(data.x), y: Number(data.y) };
    }
    if (Array.isArray(data) && data.length >= 2) {
      return { x: Number(data[0]), y: Number(data[1]) };
    }
    throw new Error(`Invalid Vector2 data: ${JSON.stringify(data)}`);
  }

  static fromVector2(vec: Vector2): any {
    return { x: vec.x, y: vec.y };
  }

  static toVector3(data: any): Vector3 {
    if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'z' in data) {
      return { x: Number(data.x), y: Number(data.y), z: Number(data.z) };
    }
    if (Array.isArray(data) && data.length >= 3) {
      return { x: Number(data[0]), y: Number(data[1]), z: Number(data[2]) };
    }
    throw new Error(`Invalid Vector3 data: ${JSON.stringify(data)}`);
  }

  static fromVector3(vec: Vector3): any {
    return { x: vec.x, y: vec.y, z: vec.z };
  }

  static toColor(data: any): Color {
    if (typeof data === 'object' && data !== null && 'r' in data && 'g' in data && 'b' in data) {
      return {
        r: Number(data.r),
        g: Number(data.g),
        b: Number(data.b),
        a: 'a' in data ? Number(data.a) : 1.0,
      };
    }
    if (Array.isArray(data)) {
      if (data.length === 3) {
        return { r: Number(data[0]), g: Number(data[1]), b: Number(data[2]), a: 1.0 };
      }
      if (data.length === 4) {
        return { r: Number(data[0]), g: Number(data[1]), b: Number(data[2]), a: Number(data[3]) };
      }
    }
    if (typeof data === 'string') {
      const hex = data.replace(/^#/, '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16) / 255;
        const g = parseInt(hex[1] + hex[1], 16) / 255;
        const b = parseInt(hex[2] + hex[2], 16) / 255;
        return { r, g, b, a: 1.0 };
      }
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return { r, g, b, a: 1.0 };
      }
      if (hex.length === 8) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = parseInt(hex.substring(6, 8), 16) / 255;
        return { r, g, b, a };
      }
    }
    throw new Error(`Invalid Color data: ${JSON.stringify(data)}`);
  }

  static fromColor(color: Color): any {
    return { r: color.r, g: color.g, b: color.b, a: color.a };
  }

  static toTransform2D(data: any): Transform2D {
    if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'origin' in data) {
      return {
        x: this.toVector2(data.x),
        y: this.toVector2(data.y),
        origin: this.toVector2(data.origin),
      };
    }
    if (Array.isArray(data) && data.length === 6) {
      return {
        x: { x: data[0], y: data[1] },
        y: { x: data[2], y: data[3] },
        origin: { x: data[4], y: data[5] },
      };
    }
    throw new Error(`Invalid Transform2D data: ${JSON.stringify(data)}`);
  }

  static fromTransform2D(transform: Transform2D): any {
    return {
      x: this.fromVector2(transform.x),
      y: this.fromVector2(transform.y),
      origin: this.fromVector2(transform.origin),
    };
  }

  static toTransform3D(data: any): Transform3D {
    if (typeof data === 'object' && data !== null && 'basis' in data && 'origin' in data) {
      return {
        basis: this.toBasis(data.basis),
        origin: this.toVector3(data.origin),
      };
    }
    if (Array.isArray(data) && data.length === 12) {
      return {
        basis: {
          x: { x: data[0], y: data[1], z: data[2] },
          y: { x: data[3], y: data[4], z: data[5] },
          z: { x: data[6], y: data[7], z: data[8] },
        },
        origin: { x: data[9], y: data[10], z: data[11] },
      };
    }
    throw new Error(`Invalid Transform3D data: ${JSON.stringify(data)}`);
  }

  static fromTransform3D(transform: Transform3D): any {
    return {
      basis: this.fromBasis(transform.basis),
      origin: this.fromVector3(transform.origin),
    };
  }

  static toBasis(data: any): Basis {
    if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'z' in data) {
      return {
        x: this.toVector3(data.x),
        y: this.toVector3(data.y),
        z: this.toVector3(data.z),
      };
    }
    if (Array.isArray(data) && data.length === 9) {
      return {
        x: { x: data[0], y: data[1], z: data[2] },
        y: { x: data[3], y: data[4], z: data[5] },
        z: { x: data[6], y: data[7], z: data[8] },
      };
    }
    throw new Error(`Invalid Basis data: ${JSON.stringify(data)}`);
  }

  static fromBasis(basis: Basis): any {
    return {
      x: this.fromVector3(basis.x),
      y: this.fromVector3(basis.y),
      z: this.fromVector3(basis.z),
    };
  }

  static toQuaternion(data: any): Quaternion {
    if (typeof data === 'object' && data !== null && 'x' in data && 'y' in data && 'z' in data && 'w' in data) {
      return { x: Number(data.x), y: Number(data.y), z: Number(data.z), w: Number(data.w) };
    }
    if (Array.isArray(data) && data.length >= 4) {
      return { x: Number(data[0]), y: Number(data[1]), z: Number(data[2]), w: Number(data[3]) };
    }
    throw new Error(`Invalid Quaternion data: ${JSON.stringify(data)}`);
  }

  static fromQuaternion(quat: Quaternion): any {
    return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
  }

  static toPlane(data: any): Plane {
    if (typeof data === 'object' && data !== null && 'normal' in data && 'd' in data) {
      return {
        normal: this.toVector3(data.normal),
        d: Number(data.d)
      };
    }
    throw new Error(`Invalid Plane data: ${JSON.stringify(data)}`);
  }

  static fromPlane(plane: Plane): any {
    return {
      normal: this.fromVector3(plane.normal),
      d: plane.d
    };
  }

  static toAABB(data: any): AABB {
    if (typeof data === 'object' && data !== null && 'position' in data && 'size' in data) {
      return {
        position: this.toVector3(data.position),
        size: this.toVector3(data.size)
      };
    }
    throw new Error(`Invalid AABB data: ${JSON.stringify(data)}`);
  }

  static fromAABB(aabb: AABB): any {
    return {
      position: this.fromVector3(aabb.position),
      size: this.fromVector3(aabb.size)
    };
  }

  static toRID(data: any): RID {
    if (typeof data === 'number') {
      return { id: data };
    }
    if (typeof data === 'object' && data !== null && 'id' in data) {
      return { id: Number(data.id) };
    }
    throw new Error(`Invalid RID data: ${JSON.stringify(data)}`);
  }

  static fromRID(rid: RID): any {
    return rid.id;
  }

  // Duplicate removed - see line 366
  // static toGodotArray(data: any): GodotArray {
  //   if (Array.isArray(data)) {
  //     return { elements: data };
  //   }
  //   if (typeof data === 'object' && data !== null && 'elements' in data) {
  //     return { elements: data.elements };
  //   }
  //   throw new Error(`Invalid GodotArray data: ${JSON.stringify(data)}`);
  // }

  static fromGodotArray(arr: GodotArray): any {
    return arr.elements;
  }

  static toGodotDictionary(data: any): GodotDictionary {
    if (typeof data === 'object' && data !== null) {
      return { entries: data };
    }
    throw new Error(`Invalid GodotDictionary data: ${JSON.stringify(data)}`);
  }

  static fromGodotDictionary(dict: GodotDictionary): any {
    return dict.entries;
  }

  static detectType(data: any): string {
    if (typeof data !== 'object' || data === null) {
      return 'unknown';
    }

    // Check for Vector2
    if ('x' in data && 'y' in data && !('z' in data) && !('r' in data)) {
      return 'Vector2';
    }

    // Check for Vector3
    if ('x' in data && 'y' in data && 'z' in data && !('w' in data) && !('r' in data)) {
      return 'Vector3';
    }

    // Check for Vector4
    if ('x' in data && 'y' in data && 'z' in data && 'w' in data && !('r' in data)) {
      return 'Vector4';
    }

    // Check for Color
    if ('r' in data && 'g' in data && 'b' in data) {
      return 'Color';
    }

    // Check for Transform2D
    if ('x' in data && 'y' in data && 'origin' in data) {
      const x = data.x;
      const y = data.y;
      if (typeof x === 'object' && 'x' in x && 'y' in x &&
          typeof y === 'object' && 'x' in y && 'y' in y) {
        return 'Transform2D';
      }
    }

    // Check for Transform3D
    if ('basis' in data && 'origin' in data) {
      return 'Transform3D';
    }

    // Check for Basis
    if ('x' in data && 'y' in data && 'z' in data) {
      const x = data.x;
      const y = data.y;
      const z = data.z;
      if (typeof x === 'object' && 'x' in x && 'y' in x && 'z' in x &&
          typeof y === 'object' && 'x' in y && 'y' in y && 'z' in y &&
          typeof z === 'object' && 'x' in z && 'y' in z && 'z' in z) {
        return 'Basis';
      }
    }

    // Check for Quaternion
    if ('x' in data && 'y' in data && 'z' in data && 'w' in data && !('r' in data)) {
      return 'Quaternion';
    }

    // Check for Plane
    if ('normal' in data && 'd' in data) {
      return 'Plane';
    }

    // Check for AABB
    if ('position' in data && 'size' in data) {
      return 'AABB';
    }

    // Check for NodePath
    if ('path' in data && typeof data.path === 'string') {
      return 'NodePath';
    }

    // Check for RID
    if ('id' in data && typeof data.id === 'number') {
      return 'RID';
    }

    // Check for GodotArray
    if ('elements' in data && Array.isArray(data.elements)) {
      return 'GodotArray';
    }

    // Check for GodotDictionary
    if ('entries' in data && typeof data.entries === 'object') {
      return 'GodotDictionary';
    }

    return 'unknown';
  }



  static toNodePath(data: any): NodePath {
    if (typeof data === 'object' && data !== null && 'path' in data) {
      return { path: String(data.path) };
    }
    if (typeof data === 'string') {
      return { path: data };
    }
    throw new Error(`Invalid NodePath data: ${JSON.stringify(data)}`);
  }

  static fromNodePath(nodePath: NodePath): any {
    return nodePath.path;
  }

  static toGodotArray(data: any): GodotArray {
    if (Array.isArray(data)) {
      return { elements: data };
    }
    if (typeof data === 'object' && data !== null && 'elements' in data) {
      return { elements: Array.isArray(data.elements) ? data.elements : [] };
    }
    throw new Error(`Invalid GodotArray data: ${JSON.stringify(data)}`);
  }





  static convertToGodotType(data: any, typeHint?: string): GodotType {
    if (!typeHint) {
      return data;
    }

    switch (typeHint.toLowerCase()) {
      case 'vector2':
        return this.toVector2(data);
      case 'vector3':
        return this.toVector3(data);
      case 'vector4':
        return this.toVector3(data);
      case 'color':
        return this.toColor(data);
      case 'transform2d':
        return this.toTransform2D(data);
      case 'transform3d':
        return this.toTransform3D(data);
      case 'basis':
        return this.toBasis(data);
      case 'quaternion':
        return this.toQuaternion(data);
      case 'nodepath':
        return this.toNodePath(data);
      case 'array':
        return this.toGodotArray(data);
      case 'dictionary':
        return this.toGodotDictionary(data);
      default:
        return data;
    }
  }

  static convertFromGodotType(data: any, typeHint?: string): any {
    if (!typeHint) {
      return data;
    }

    switch (typeHint.toLowerCase()) {
      case 'vector2':
        return this.fromVector2(data as Vector2);
      case 'vector3':
        return this.fromVector3(data as Vector3);
      case 'vector4':
        return this.fromVector3(data as Vector3);
      case 'color':
        return this.fromColor(data as Color);
      case 'transform2d':
        return this.fromTransform2D(data as Transform2D);
      case 'transform3d':
        return this.fromTransform3D(data as Transform3D);
      case 'basis':
        return this.fromBasis(data as Basis);
      case 'quaternion':
        return this.fromQuaternion(data as Quaternion);
      case 'nodepath':
        return this.fromNodePath(data as NodePath);
      case 'array':
        return this.fromGodotArray(data as GodotArray);
      case 'dictionary':
        return this.fromGodotDictionary(data as GodotDictionary);
      default:
        return data;
    }
  }
}