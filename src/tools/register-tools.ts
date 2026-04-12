import { ToolRegistry } from './registry.js';
import { HeadlessBridge } from '../transports/headless-bridge.js';
import { createCreateSceneTool } from './scene/create-scene.js';
import { createReadSceneTool } from './scene/read-scene.js';
import { createModifySceneTool } from './scene/modify-scene.js';
import { createSaveSceneTool } from './scene/save-scene.js';
import { createSceneTreeTool } from './scene/scene-tree.js';
import { createCreateProjectTool } from './project/create-project.js';
import { createCreateNodeTool } from './node/create-node.js';
import { createModifyNodeTool } from './node/modify-node.js';
import { createDeleteNodeTool } from './node/delete-node.js';
import { createNodePropertiesTool } from './node/properties.js';
import { createCreateScriptTool } from './script/create-script.js';
import { createReadScriptTool } from './script/read-script.js';
import { createModifyScriptTool } from './script/modify-script.js';
import { createImportAssetTool } from './assets/import-asset.js';
import { createCSGOpsTool } from './3d/csg-ops.js';
import { createMeshInstanceTool } from './3d/mesh-instance.js';
import { createLightingTool } from './3d/lighting.js';
import { createEnvironmentTool } from './3d/environment.js';
import { createNavigationTool } from './3d/navigation.js';
import { createPhysics3DTool } from './3d/physics3d.js';

export function registerAllTools(registry: ToolRegistry, bridge: HeadlessBridge): void {
  // Project tools
  registry.registerTool(createCreateProjectTool(bridge));
  
  // Scene tools
  registry.registerTool(createCreateSceneTool(bridge));
  registry.registerTool(createReadSceneTool(bridge));
  registry.registerTool(createModifySceneTool(bridge));
  registry.registerTool(createSaveSceneTool(bridge));
  registry.registerTool(createSceneTreeTool(bridge));
  
  // Node tools
  registry.registerTool(createCreateNodeTool(bridge));
  registry.registerTool(createModifyNodeTool(bridge));
  registry.registerTool(createDeleteNodeTool(bridge));
  registry.registerTool(createNodePropertiesTool(bridge));
  
  // Script tools
  registry.registerTool(createCreateScriptTool(bridge));
  registry.registerTool(createReadScriptTool(bridge));
  registry.registerTool(createModifyScriptTool(bridge));
  
  // Asset tools
  registry.registerTool(createImportAssetTool(bridge));
  
  // 3D tools
  registry.registerTool(createCSGOpsTool(bridge));
  registry.registerTool(createMeshInstanceTool(bridge));
  registry.registerTool(createLightingTool(bridge));
  registry.registerTool(createEnvironmentTool(bridge));
  registry.registerTool(createNavigationTool(bridge));
  registry.registerTool(createPhysics3DTool(bridge));
}