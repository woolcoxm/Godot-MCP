import { describe, it, expect } from 'vitest';
import { GodotTypeConverter } from '../src/utils/godot-types.js';
import {
  Vector2,
  Vector3,
  Vector4,
  Color,
  Rect2,
  Transform2D,
  Transform3D,
  Basis,
  Quaternion,
  Plane,
  AABB,
  NodePath,
  RID,
  GodotArray,
  GodotDictionary
} from '../src/types/godot.js';

describe('Type Safety Audit - Godot Type Converters', () => {
  describe('Vector2', () => {
    it('should convert valid object to Vector2', () => {
      const data = { x: 10, y: 20 };
      const result = GodotTypeConverter.toVector2(data);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should convert valid array to Vector2', () => {
      const data = [10, 20];
      const result = GodotTypeConverter.toVector2(data);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should throw error for invalid Vector2 data', () => {
      expect(() => GodotTypeConverter.toVector2({ x: 10 })).toThrow();
      expect(() => GodotTypeConverter.toVector2([10])).toThrow();
      expect(() => GodotTypeConverter.toVector2(null)).toThrow();
      expect(() => GodotTypeConverter.toVector2('invalid')).toThrow();
    });

    it('should convert Vector2 to object', () => {
      const vec: Vector2 = { x: 10, y: 20 };
      const result = GodotTypeConverter.fromVector2(vec);
      expect(result).toEqual({ x: 10, y: 20 });
    });
  });

  describe('Vector3', () => {
    it('should convert valid object to Vector3', () => {
      const data = { x: 10, y: 20, z: 30 };
      const result = GodotTypeConverter.toVector3(data);
      expect(result).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('should convert valid array to Vector3', () => {
      const data = [10, 20, 30];
      const result = GodotTypeConverter.toVector3(data);
      expect(result).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('should throw error for invalid Vector3 data', () => {
      expect(() => GodotTypeConverter.toVector3({ x: 10, y: 20 })).toThrow();
      expect(() => GodotTypeConverter.toVector3([10, 20])).toThrow();
    });
  });

  describe('Color', () => {
    it('should convert valid object to Color with alpha', () => {
      const data = { r: 1, g: 0.5, b: 0, a: 0.8 };
      const result = GodotTypeConverter.toColor(data);
      expect(result).toEqual({ r: 1, g: 0.5, b: 0, a: 0.8 });
    });

    it('should convert valid object to Color without alpha (defaults to 1)', () => {
      const data = { r: 1, g: 0.5, b: 0 };
      const result = GodotTypeConverter.toColor(data);
      expect(result).toEqual({ r: 1, g: 0.5, b: 0, a: 1 });
    });

    it('should convert hex string to Color', () => {
      const data = '#ff8000';
      const result = GodotTypeConverter.toColor(data);
      expect(result.r).toBeCloseTo(1, 2);
      expect(result.g).toBeCloseTo(0.5, 2);
      expect(result.b).toBeCloseTo(0, 2);
      expect(result.a).toBe(1);
    });

    it('should convert Color to object', () => {
      const color: Color = { r: 1, g: 0.5, b: 0, a: 0.8 };
      const result = GodotTypeConverter.fromColor(color);
      expect(result).toEqual({ r: 1, g: 0.5, b: 0, a: 0.8 });
    });
  });

  describe('Transform2D', () => {
    it('should convert valid object to Transform2D', () => {
      const data = {
        x: { x: 1, y: 0 },
        y: { x: 0, y: 1 },
        origin: { x: 10, y: 20 }
      };
      const result = GodotTypeConverter.toTransform2D(data);
      expect(result).toEqual(data);
    });

    it('should convert Transform2D to object', () => {
      const transform: Transform2D = {
        x: { x: 1, y: 0 },
        y: { x: 0, y: 1 },
        origin: { x: 10, y: 20 }
      };
      const result = GodotTypeConverter.fromTransform2D(transform);
      expect(result).toEqual(transform);
    });
  });

  describe('Transform3D', () => {
    it('should convert valid object to Transform3D', () => {
      const data = {
        basis: {
          x: { x: 1, y: 0, z: 0 },
          y: { x: 0, y: 1, z: 0 },
          z: { x: 0, y: 0, z: 1 }
        },
        origin: { x: 10, y: 20, z: 30 }
      };
      const result = GodotTypeConverter.toTransform3D(data);
      expect(result).toEqual(data);
    });
  });

  describe('Basis', () => {
    it('should convert valid object to Basis', () => {
      const data = {
        x: { x: 1, y: 0, z: 0 },
        y: { x: 0, y: 1, z: 0 },
        z: { x: 0, y: 0, z: 1 }
      };
      const result = GodotTypeConverter.toBasis(data);
      expect(result).toEqual(data);
    });
  });

  describe('Quaternion', () => {
    it('should convert valid object to Quaternion', () => {
      const data = { x: 0, y: 0, z: 0, w: 1 };
      const result = GodotTypeConverter.toQuaternion(data);
      expect(result).toEqual(data);
    });

    it('should convert valid array to Quaternion', () => {
      const data = [0, 0, 0, 1];
      const result = GodotTypeConverter.toQuaternion(data);
      expect(result).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    });
  });

  describe('Plane', () => {
    it('should convert valid object to Plane', () => {
      const data = {
        normal: { x: 0, y: 1, z: 0 },
        d: 10
      };
      const result = GodotTypeConverter.toPlane(data);
      expect(result).toEqual(data);
    });
  });

  describe('AABB', () => {
    it('should convert valid object to AABB', () => {
      const data = {
        position: { x: 0, y: 0, z: 0 },
        size: { x: 10, y: 20, z: 30 }
      };
      const result = GodotTypeConverter.toAABB(data);
      expect(result).toEqual(data);
    });
  });

  describe('NodePath', () => {
    it('should convert string to NodePath', () => {
      const data = '/root/Main/Player';
      const result = GodotTypeConverter.toNodePath(data);
      expect(result).toEqual({ path: '/root/Main/Player' });
    });

    it('should convert object with path to NodePath', () => {
      const data = { path: '/root/Main/Player' };
      const result = GodotTypeConverter.toNodePath(data);
      expect(result).toEqual(data);
    });

    it('should convert NodePath to string', () => {
      const nodePath: NodePath = { path: '/root/Main/Player' };
      const result = GodotTypeConverter.fromNodePath(nodePath);
      expect(result).toBe('/root/Main/Player');
    });
  });

  describe('RID', () => {
    it('should convert number to RID', () => {
      const data = 12345;
      const result = GodotTypeConverter.toRID(data);
      expect(result).toEqual({ id: 12345 });
    });

    it('should convert object with id to RID', () => {
      const data = { id: 12345 };
      const result = GodotTypeConverter.toRID(data);
      expect(result).toEqual(data);
    });

    it('should convert RID to number', () => {
      const rid: RID = { id: 12345 };
      const result = GodotTypeConverter.fromRID(rid);
      expect(result).toBe(12345);
    });
  });

  describe('GodotArray', () => {
    it('should convert array to GodotArray', () => {
      const data = [1, 2, 3, { x: 10, y: 20 }];
      const result = GodotTypeConverter.toGodotArray(data);
      expect(result).toEqual({ elements: data });
    });

    it('should convert GodotArray to array', () => {
      const godotArray: GodotArray = { elements: [1, 2, 3] };
      const result = GodotTypeConverter.fromGodotArray(godotArray);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('GodotDictionary', () => {
    it('should convert object to GodotDictionary', () => {
      const data = { key1: 'value1', key2: 123 };
      const result = GodotTypeConverter.toGodotDictionary(data);
      expect(result).toEqual({ entries: data });
    });

    it('should convert GodotDictionary to object', () => {
      const godotDict: GodotDictionary = { entries: { key1: 'value1', key2: 123 } };
      const result = GodotTypeConverter.fromGodotDictionary(godotDict);
      expect(result).toEqual({ key1: 'value1', key2: 123 });
    });
  });

  describe('Type detection', () => {
    it('should detect Vector2 type', () => {
      const data = { x: 10, y: 20 };
      const result = GodotTypeConverter.detectType(data);
      expect(result).toBe('Vector2');
    });

    it('should detect Vector3 type', () => {
      const data = { x: 10, y: 20, z: 30 };
      const result = GodotTypeConverter.detectType(data);
      expect(result).toBe('Vector3');
    });

    it('should detect Color type', () => {
      const data = { r: 1, g: 0, b: 0, a: 1 };
      const result = GodotTypeConverter.detectType(data);
      expect(result).toBe('Color');
    });

    it('should detect unknown type', () => {
      const data = { custom: 'data' };
      const result = GodotTypeConverter.detectType(data);
      expect(result).toBe('unknown');
    });
  });

  describe('Round-trip conversion', () => {
    it('should round-trip Vector2', () => {
      const original = { x: 10, y: 20 };
      const converted = GodotTypeConverter.toVector2(original);
      const roundTrip = GodotTypeConverter.fromVector2(converted);
      expect(roundTrip).toEqual(original);
    });

    it('should round-trip Color', () => {
      const original = { r: 1, g: 0.5, b: 0, a: 0.8 };
      const converted = GodotTypeConverter.toColor(original);
      const roundTrip = GodotTypeConverter.fromColor(converted);
      expect(roundTrip).toEqual(original);
    });

    it('should round-trip NodePath', () => {
      const original = '/root/Main/Player';
      const converted = GodotTypeConverter.toNodePath(original);
      const roundTrip = GodotTypeConverter.fromNodePath(converted);
      expect(roundTrip).toBe(original);
    });
  });
});