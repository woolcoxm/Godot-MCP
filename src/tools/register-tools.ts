import { ToolRegistry } from './registry.js';
import { Transport } from '../transports/transport.js';
import { createCreateSceneTool } from './scene/create-scene.js';
import { createReadSceneTool } from './scene/read-scene.js';
import { createModifySceneTool } from './scene/modify-scene.js';
import { createSaveSceneTool } from './scene/save-scene.js';
import { createSceneTreeTool } from './scene/scene-tree.js';
import { createBatchOperationsTool } from './scene/batch-operations.js';
import { createCreateProjectTool } from './project/create-project.js';
import { createInputMapTool } from './project/input-map.js';
import { createAutoloadsTool } from './project/autoloads.js';
import { createPluginsTool } from './project/plugins.js';
import { createTranslationsTool } from './project/translations.js';
import { createCreateNodeTool } from './node/create-node.js';
import { createModifyNodeTool } from './node/modify-node.js';
import { createDeleteNodeTool } from './node/delete-node.js';
import { createNodePropertiesTool } from './node/properties.js';
import { createSignalsTool } from './node/signals.js';
import { createGroupsTool } from './node/groups.js';
import { createAdditionalOpsTool } from './node/additional-ops.js';
import { createCreateScriptTool } from './script/create-script.js';
import { createReadScriptTool } from './script/read-script.js';
import { createModifyScriptTool } from './script/modify-script.js';
import { createAnalyzeScriptTool } from './script/analyze-script.js';
import { createAttachScriptTool } from './script/attach-script.js';
import { createImportAssetTool } from './assets/import-asset.js';
import { createMaterialTool } from './assets/create-material.js';
import { createShaderTool } from './assets/create-shader.js';
import { createTextureTool } from './assets/create-texture.js';
import { createProceduralMeshTool } from './assets/procedural-mesh.js';
import { createCSGOpsTool } from './3d/csg-ops.js';
import { createMeshInstanceTool } from './3d/mesh-instance.js';
import { createLightingTool } from './3d/lighting.js';
import { createEnvironmentTool } from './3d/environment.js';
import { createNavigationTool } from './3d/navigation.js';
import { createPhysics3DTool } from './3d/physics3d.js';
import { createCamera3DTool } from './3d/camera3d.js';
import { createSkeletonTool } from './3d/skeleton.js';
import { createVoxelGITool } from './3d/voxelgi.js';
import { createGridmapTool } from './3d/gridmap.js';
import { createMultimeshTool } from './3d/multimesh.js';
import { createPath3DTool } from './3d/path3d.js';
import { createParticles3DTool } from './3d/particles3d.js';
import { createTilemapTool } from './2d/tilemap.js';
import { createSprite2DTool } from './2d/sprite2d.js';
import { createPhysics2DTool } from './2d/physics2d.js';
import { createParallaxTool } from './2d/parallax.js';
import { createReflectionProbeTool } from './3d/reflection-probe.js';
import { createViewportTool } from './3d/viewport.js';
import { createCanvasTool } from './2d/canvas.js';
import { createLight2DTool } from './2d/light2d.js';
import { createPath2DTool } from './2d/path2d.js';
import { createPolygonTool } from './2d/polygon.js';
import { createSkeleton2DTool } from './2d/skeleton2d.js';
import { createParticles2DTool } from './2d/particles2d.js';
import { createTilesetEditorTool } from './2d/tileset-editor.js';
import { createNavigation2DTool } from './2d/navigation2d.js';
import { createAnimationPlayerTool } from './animation/animation-player.js';
import { createAnimationTreeTool } from './animation/animation-tree.js';
import { createTweeningTool } from './animation/tweening.js';
import { createSkeletonIKTool } from './animation/skeleton-ik.js';
import { createBlendSpacesTool } from './animation/blend-spaces.js';
import { createProceduralAnimationTool } from './animation/procedural-animation.js';
import { createEvalTool } from './runtime/eval.js';
import { createSimulateInputTool } from './runtime/input-simulation.js';
import { createScreenshotTool } from './runtime/screenshot.js';
import { createDebugInfoTool } from './runtime/debug.js';
import { createGameStateTool } from './runtime/state.js';
import { createLaunchEditorTool } from './editor/launch-editor.js';
import { createRunProjectTool } from './editor/run-project.js';
import { createEditorStateTool } from './editor/editor-state.js';
import { createFilesystemTool } from './editor/filesystem.js';
import { createControlTool } from './ui/controls.js';
import { createThemeTool, createApplyThemeTool } from './ui/theme.js';
import { createLayoutTool, createArrangeTool } from './ui/layout.js';
import { createPopupTool } from './ui/popup.js';
import { createTreeItemListTool } from './ui/tree-itemlist.js';
import { createTabMenuTool } from './ui/tab-menu.js';
import { createTextRangeTool } from './ui/text-range.js';
import { createGraphCustomTool } from './ui/graph-custom.js';
import { createAudioPlayerTool, createAudioBusTool } from './audio/playback.js';
import { createAudioEffectTool } from './audio/effects.js';
import { createSpatialStreamTool } from './audio/spatial-stream.js';
import { createHttpRequestTool, createWebSocketTool } from './networking/http.js';
import { createMultiplayerTool } from './networking/multiplayer.js';
import { createRPCPacketTool } from './networking/rpc-packet.js';
import { createExportPresetTool, createBuildProjectTool } from './build/export.js';
import { createScriptResourceTool, createSceneResourceTool, createProjectResourceTool } from './resources/mcp-resources.js';
import { createDocsResourceTool } from './resources/docs-resource.js';

export function registerAllTools(registry: ToolRegistry, transport: Transport): void {
  // Project tools
  registry.registerTool(createCreateProjectTool(transport));
  registry.registerTool(createInputMapTool(transport));
  registry.registerTool(createAutoloadsTool(transport));
  registry.registerTool(createPluginsTool(transport));
  registry.registerTool(createTranslationsTool(transport));
  
  // Scene tools
  registry.registerTool(createCreateSceneTool(transport));
  registry.registerTool(createReadSceneTool(transport));
  registry.registerTool(createModifySceneTool(transport));
  registry.registerTool(createSaveSceneTool(transport));
  registry.registerTool(createSceneTreeTool(transport));
  registry.registerTool(createBatchOperationsTool(transport));
  
  // Node tools
  registry.registerTool(createCreateNodeTool(transport));
  registry.registerTool(createModifyNodeTool(transport));
  registry.registerTool(createDeleteNodeTool(transport));
  registry.registerTool(createNodePropertiesTool(transport));
  registry.registerTool(createSignalsTool(transport));
  registry.registerTool(createGroupsTool(transport));
  registry.registerTool(createAdditionalOpsTool(transport));
  
  // Script tools
  registry.registerTool(createCreateScriptTool(transport));
  registry.registerTool(createReadScriptTool(transport));
  registry.registerTool(createModifyScriptTool(transport));
  registry.registerTool(createAnalyzeScriptTool(transport));
  registry.registerTool(createAttachScriptTool(transport));
  
  // Asset tools
  registry.registerTool(createImportAssetTool(transport));
  registry.registerTool(createMaterialTool(transport));
  registry.registerTool(createShaderTool(transport));
  registry.registerTool(createTextureTool(transport));
  registry.registerTool(createProceduralMeshTool(transport));
  
  // 3D tools
  registry.registerTool(createCSGOpsTool(transport));
  registry.registerTool(createMeshInstanceTool(transport));
  registry.registerTool(createLightingTool(transport));
  registry.registerTool(createEnvironmentTool(transport));
  registry.registerTool(createNavigationTool(transport));
  registry.registerTool(createPhysics3DTool(transport));
  registry.registerTool(createCamera3DTool(transport));
  registry.registerTool(createSkeletonTool(transport));
  registry.registerTool(createVoxelGITool(transport));
  registry.registerTool(createGridmapTool(transport));
  registry.registerTool(createMultimeshTool(transport));
  registry.registerTool(createPath3DTool(transport));
  registry.registerTool(createParticles3DTool(transport));
  
  // 2D tools
  registry.registerTool(createTilemapTool(transport));
  registry.registerTool(createSprite2DTool(transport));
  registry.registerTool(createPhysics2DTool(transport));
  registry.registerTool(createParallaxTool(transport));
  registry.registerTool(createCanvasTool(transport));
  registry.registerTool(createLight2DTool(transport));
  registry.registerTool(createPath2DTool(transport));
  registry.registerTool(createPolygonTool(transport));
  registry.registerTool(createSkeleton2DTool(transport));
  registry.registerTool(createParticles2DTool(transport));
  registry.registerTool(createTilesetEditorTool(transport));
  registry.registerTool(createNavigation2DTool(transport));
  
  // 3D additional tools
  registry.registerTool(createReflectionProbeTool(transport));
  registry.registerTool(createViewportTool(transport));
  
  // Animation tools
  registry.registerTool(createAnimationPlayerTool(transport));
  registry.registerTool(createAnimationTreeTool(transport));
  registry.registerTool(createTweeningTool(transport));
  registry.registerTool(createSkeletonIKTool(transport));
  registry.registerTool(createBlendSpacesTool(transport));
  registry.registerTool(createProceduralAnimationTool(transport));
  
  // Runtime tools
  registry.registerTool(createEvalTool(transport));
  registry.registerTool(createSimulateInputTool(transport));
  registry.registerTool(createScreenshotTool(transport));
  registry.registerTool(createDebugInfoTool(transport));
  registry.registerTool(createGameStateTool(transport));
  
  // Editor tools
  registry.registerTool(createLaunchEditorTool(transport));
  registry.registerTool(createRunProjectTool(transport));
  registry.registerTool(createEditorStateTool(transport));
  registry.registerTool(createFilesystemTool(transport));
  
  // UI tools
  registry.registerTool(createControlTool(transport));
  registry.registerTool(createThemeTool(transport));
  registry.registerTool(createApplyThemeTool(transport));
  registry.registerTool(createLayoutTool(transport));
  registry.registerTool(createArrangeTool(transport));
  registry.registerTool(createPopupTool(transport));
  registry.registerTool(createTreeItemListTool(transport));
  registry.registerTool(createTabMenuTool(transport));
  registry.registerTool(createTextRangeTool(transport));
  registry.registerTool(createGraphCustomTool(transport));
  
  // Audio tools
  registry.registerTool(createAudioPlayerTool(transport));
  registry.registerTool(createAudioBusTool(transport));
  registry.registerTool(createAudioEffectTool(transport));
  registry.registerTool(createSpatialStreamTool(transport));
  
  // Networking tools
  registry.registerTool(createHttpRequestTool(transport));
  registry.registerTool(createWebSocketTool(transport));
  registry.registerTool(createMultiplayerTool(transport));
  registry.registerTool(createRPCPacketTool(transport));
  
  // Build tools
  registry.registerTool(createExportPresetTool(transport));
  registry.registerTool(createBuildProjectTool(transport));
  
  // Resource tools
  registry.registerTool(createScriptResourceTool(transport));
  registry.registerTool(createSceneResourceTool(transport));
  registry.registerTool(createProjectResourceTool(transport));
  registry.registerTool(createDocsResourceTool(transport));
}