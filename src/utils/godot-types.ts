import {
  Vector2,
  Vector3,
  Color,
  Transform2D,
  Transform3D,
  Basis,
  Quaternion,
  NodePath,
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
    if (Array.isArray(data) && data.length === 4) {
      return { x: Number(data[0]), y: Number(data[1]), z: Number(data[2]), w: Number(data[3]) };
    }
    throw new Error(`Invalid Quaternion data: ${JSON.stringify(data)}`);
  }

  static fromQuaternion(quat: Quaternion): any {
    return { x: quat.x, y: quat.y, z: quat.z, w: quat.w };
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
    return { path: nodePath.path };
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

  static fromGodotArray(array: GodotArray): any {
    return { elements: array.elements };
  }

  static toGodotDictionary(data: any): GodotDictionary {
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    throw new Error(`Invalid GodotDictionary data: ${JSON.stringify(data)}`);
  }

  static fromGodotDictionary(dict: GodotDictionary): any {
    return dict;
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