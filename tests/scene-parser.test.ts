import { describe, it, expect } from 'vitest';
import { SceneParser } from '../src/utils/scene-parser.js';

describe('SceneParser', () => {
  it('should parse simple scene', () => {
    const sceneContent = `[gd_scene load_steps=1 format=3 uid="uid://test"]

[ext_resource type="Script" path="res://test.gd" id="1_script"]

[node name="Root" type="Node3D"]
script = ExtResource("1_script")
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0)`;

    const sceneInfo = SceneParser.parseScene(sceneContent);
    
    expect(sceneInfo).toBeDefined();
    expect(sceneInfo.format).toBe(3);
    expect(sceneInfo.load_steps).toBe(1);
    expect(sceneInfo.uid).toBe('uid://test');
    expect(sceneInfo.resources).toHaveLength(1);
    expect(sceneInfo.resources[0].type).toBe('Script');
    expect(sceneInfo.resources[0].path).toBe('res://test.gd');
    expect(sceneInfo.root).toBeDefined();
    expect(sceneInfo.root.name).toBe('Root');
    expect(sceneInfo.root.type).toBe('Node3D');
  });

  it('should serialize scene back to text', () => {
    const sceneInfo = {
      path: 'res://test.tscn',
      format: 3,
      load_steps: 1,
      uid: 'uid://test',
      root: {
        name: 'TestNode',
        type: 'Node2D',
        path: { path: 'TestNode' },
        parent: undefined,
        children: [],
        properties: {
          position: { x: 100, y: 200 },
        },
        groups: [],
        script: undefined,
        metadata: {},
      },
      resources: [
        {
          id: '1',
          type: 'Texture2D',
          path: 'res://icon.png',
        },
      ],
      sub_resources: [],
      connections: [],
    };

    const serialized = SceneParser.serializeScene(sceneInfo as any);
    
    expect(serialized).toContain('[gd_scene');
    expect(serialized).toContain('TestNode');
    expect(serialized).toContain('Node2D');
    expect(serialized).toContain('Texture2D');
  });

  it('should parse node with properties', () => {
    const sceneContent = `[gd_scene load_steps=0 format=3]

[node name="Sprite" type="Sprite2D"]
position = Vector2(100, 200)
scale = Vector2(2, 2)
visible = true`;

    const sceneInfo = SceneParser.parseScene(sceneContent);
    
    expect(sceneInfo.root.properties.position).toEqual({ x: 100, y: 200 });
    expect(sceneInfo.root.properties.scale).toEqual({ x: 2, y: 2 });
    expect(sceneInfo.root.properties.visible).toBe(true);
  });

  it('should parse arrays and dictionaries', () => {
    const sceneContent = `[gd_scene load_steps=0 format=3]

[node name="Test" type="Node"]
groups = ["group1", "group2"]`;

    const sceneInfo = SceneParser.parseScene(sceneContent);
    
    expect(sceneInfo.root.groups).toEqual(['group1', 'group2']);
  });
});