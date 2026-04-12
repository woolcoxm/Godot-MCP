export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  toolCount: number;
}

export const CATEGORIES: ToolCategory[] = [
  {
    id: 'project',
    name: 'Project Management',
    description: 'Create and manage Godot projects, settings, input maps, export presets',
    toolCount: 8,
  },
  {
    id: 'scene',
    name: 'Scene Management',
    description: 'Create, read, modify, and save .tscn scene files',
    toolCount: 8,
  },
  {
    id: 'node',
    name: 'Node Operations',
    description: 'Create, modify, delete, and manage nodes within scenes',
    toolCount: 12,
  },
  {
    id: 'script',
    name: 'GDScript',
    description: 'Create, read, modify, and analyze GDScript files',
    toolCount: 7,
  },
  {
    id: 'assets',
    name: 'Asset Pipeline',
    description: 'Import assets, create materials, shaders, textures, procedural meshes',
    toolCount: 10,
  },
  {
    id: 'world3d',
    name: '3D World Building',
    description: 'CSG operations, mesh instances, lighting, environment, navigation, physics',
    toolCount: 20,
  },
  {
    id: 'world2d',
    name: '2D World Building',
    description: 'Tilemaps, sprites, physics, parallax, canvas layers',
    toolCount: 12,
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Animation players, trees, tweens, blend spaces, skeleton IK',
    toolCount: 8,
  },
  {
    id: 'ui',
    name: 'UI System',
    description: 'Controls, themes, layouts, popups, menus, text editors',
    toolCount: 12,
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Playback, audio buses, effects, spatial audio, streaming',
    toolCount: 6,
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'HTTP, WebSocket, multiplayer, RPC, packet management',
    toolCount: 5,
  },
  {
    id: 'runtime',
    name: 'Runtime Control',
    description: 'Eval code, input simulation, screenshots, debugging, game state',
    toolCount: 16,
  },
  {
    id: 'editor',
    name: 'Editor Control',
    description: 'Launch editor, run project, editor state, filesystem operations',
    toolCount: 6,
  },
  {
    id: 'build',
    name: 'Build & Export',
    description: 'Export projects, manage presets, deployment',
    toolCount: 4,
  },
];

export function getCategoryById(id: string): ToolCategory | undefined {
  return CATEGORIES.find(category => category.id === id);
}

export function getAllCategories(): ToolCategory[] {
  return CATEGORIES;
}