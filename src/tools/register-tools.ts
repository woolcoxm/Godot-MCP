import { ToolRegistry } from './registry.js';
import { HeadlessBridge } from '../transports/headless-bridge.js';
import { createCreateSceneTool } from './scene/create-scene.js';
import { createReadSceneTool } from './scene/read-scene.js';
import { createModifySceneTool } from './scene/modify-scene.js';
import { createSaveSceneTool } from './scene/save-scene.js';
import { createSceneTreeTool } from './scene/scene-tree.js';
import { createCreateProjectTool } from './project/create-project.js';

export function registerAllTools(registry: ToolRegistry, bridge: HeadlessBridge): void {
  // Project tools
  registry.registerTool(createCreateProjectTool(bridge));
  
  // Scene tools
  registry.registerTool(createCreateSceneTool(bridge));
  registry.registerTool(createReadSceneTool(bridge));
  registry.registerTool(createModifySceneTool(bridge));
  registry.registerTool(createSaveSceneTool(bridge));
  registry.registerTool(createSceneTreeTool(bridge));
  
  // Note: Node, script, and asset tools will be added here when implemented
}