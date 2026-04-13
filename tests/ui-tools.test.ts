import { describe, it, expect, beforeEach } from 'vitest';
import { createControlTool } from '../src/tools/ui/controls';
import { createPopupTool } from '../src/tools/ui/popup';
import { createTreeItemListTool } from '../src/tools/ui/tree-itemlist';
import { createTabMenuTool } from '../src/tools/ui/tab-menu';
import { createTextRangeTool } from '../src/tools/ui/text-range';
import { createGraphCustomTool } from '../src/tools/ui/graph-custom';
import { createThemeTool, createApplyThemeTool } from '../src/tools/ui/theme';
import { createLayoutTool, createArrangeTool } from '../src/tools/ui/layout';

// Mock transport
const mockTransport = {
  execute: async () => ({ success: true, data: { path: '/mock/path' } })
};

describe('UI Tools', () => {
  describe('Control Tool', () => {
    const tool = createControlTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_control');
      expect(tool.name).toBe('Create UI Control');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate control schema', async () => {
      const validInput = {
        parentPath: '.',
        controlType: 'Button',
        name: 'TestButton',
        text: 'Click me',
        size: { x: 100, y: 50 }
      };
      
      // This should not throw
      tool.inputSchema.parse(validInput);
    });
    
    it('should reject invalid control type', () => {
      const invalidInput = {
        parentPath: '.',
        controlType: 'InvalidType', // Not in enum
        name: 'Test'
      };
      
      expect(() => tool.inputSchema.parse(invalidInput)).toThrow();
    });
  });
  
  describe('Popup Tool', () => {
    const tool = createPopupTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_popup');
      expect(tool.name).toBe('Create Popup/Dialog');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate popup schema', () => {
      const validInput = {
        parentPath: '.',
        popupType: 'ConfirmationDialog',
        title: 'Confirm Action',
        modal: true,
        buttons: ['OK', 'Cancel']
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should accept FileDialog with filters', () => {
      const validInput = {
        parentPath: '.',
        popupType: 'FileDialog',
        title: 'Open File',
        filters: ['*.png;PNG Images', '*.jpg;JPEG Images']
      };
      
      tool.inputSchema.parse(validInput);
    });
  });
  
  describe('Tree/ItemList Tool', () => {
    const tool = createTreeItemListTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_tree_itemlist');
      expect(tool.name).toBe('Create Tree/ItemList');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate Tree schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'Tree',
        name: 'FileTree',
        columns: 2,
        hideRoot: true,
        selectMode: 'Single'
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should validate ItemList schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'ItemList',
        name: 'ItemList',
        allowReselect: true,
        selectMode: 'Multi'
      };
      
      tool.inputSchema.parse(validInput);
    });
  });
  
  describe('Tab/Menu Tool', () => {
    const tool = createTabMenuTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_tab_menu');
      expect(tool.name).toBe('Create Tab/Menu Controls');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate TabContainer schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'TabContainer',
        name: 'MainTabs',
        tabAlignment: 'Fill',
        currentTab: 0
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should validate MenuBar schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'MenuBar',
        name: 'MainMenu'
      };
      
      tool.inputSchema.parse(validInput);
    });
  });
  
  describe('Text/Range Tool', () => {
    const tool = createTextRangeTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_text_range');
      expect(tool.name).toBe('Create Text/Range Controls');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate RichTextLabel schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'RichTextLabel',
        name: 'RichText',
        text: 'Hello <b>World</b>',
        bbcodeEnabled: true
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should validate Slider schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'HSlider',
        name: 'VolumeSlider',
        minValue: 0,
        maxValue: 100,
        value: 50,
        step: 1,
        tickCount: 5
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should validate ProgressBar schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'ProgressBar',
        name: 'LoadingBar',
        minValue: 0,
        maxValue: 100,
        value: 75,
        showPercentage: true,
        fillMode: 'BeginToEnd'
      };
      
      tool.inputSchema.parse(validInput);
    });
  });
  
  describe('Graph/Custom Tool', () => {
    const tool = createGraphCustomTool(mockTransport as any);
    
    it('should have correct tool metadata', () => {
      expect(tool.id).toBe('godot_create_graph_custom');
      expect(tool.name).toBe('Create Graph/Custom Controls');
      expect(tool.category).toBe('ui');
      expect(tool.readOnlyHint).toBe(false);
      expect(tool.destructiveHint).toBe(true);
      expect(tool.idempotentHint).toBe(false);
    });
    
    it('should validate GraphEdit schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'GraphEdit',
        name: 'VisualScript',
        rightDisconnects: true,
        connectionLinesCurvature: 0.5,
        zoom: 1.0
      };
      
      tool.inputSchema.parse(validInput);
    });
    
    it('should validate GraphNode schema', () => {
      const validInput = {
        parentPath: '.',
        controlType: 'GraphNode',
        name: 'FunctionNode',
        title: 'Process Data',
        showClose: false,
        resizable: true,
        draggable: true
      };
      
      tool.inputSchema.parse(validInput);
    });
  });
  
  describe('Theme Tools', () => {
    const themeTool = createThemeTool(mockTransport as any);
    const applyTool = createApplyThemeTool(mockTransport as any);
    
    it('should have correct theme tool metadata', () => {
      expect(themeTool.id).toBe('godot_create_theme');
      expect(themeTool.name).toBe('Create Theme');
      expect(themeTool.category).toBe('ui');
      expect(themeTool.readOnlyHint).toBe(false);
      expect(themeTool.destructiveHint).toBe(true);
      expect(themeTool.idempotentHint).toBe(false);
    });
    
    it('should have correct apply theme tool metadata', () => {
      expect(applyTool.id).toBe('godot_apply_theme');
      expect(applyTool.name).toBe('Apply Theme');
      expect(applyTool.category).toBe('ui');
      expect(applyTool.readOnlyHint).toBe(false);
      expect(applyTool.destructiveHint).toBe(true);
      expect(applyTool.idempotentHint).toBe(false);
    });
    
    it('should validate theme creation schema', () => {
      const validInput = {
        path: 'res://themes/custom.tres',
        themeType: 'Theme',
        colors: {
          primary: '#3498db',
          secondary: '#2ecc71'
        },
        fonts: {
          default: 'res://fonts/Roboto.ttf'
        }
      };
      
      themeTool.inputSchema.parse(validInput);
    });
    
    it('should validate apply theme schema', () => {
      const validInput = {
        nodePath: './MainPanel',
        themePath: 'res://themes/default.tres',
        property: 'theme_override_fonts/normal_font',
        value: 'res://fonts/Roboto.ttf'
      };

      applyTool.inputSchema.parse(validInput);
    });
  });
  
  describe('Layout Tools', () => {
    const layoutTool = createLayoutTool(mockTransport as any);
    const arrangeTool = createArrangeTool(mockTransport as any);
    
    it('should have correct layout tool metadata', () => {
      expect(layoutTool.id).toBe('godot_create_layout');
      expect(layoutTool.name).toBe('Create Layout Container');
      expect(layoutTool.category).toBe('ui');
      expect(layoutTool.readOnlyHint).toBe(false);
      expect(layoutTool.destructiveHint).toBe(true);
      expect(layoutTool.idempotentHint).toBe(false);
    });
    
    it('should have correct arrange tool metadata', () => {
      expect(arrangeTool.id).toBe('godot_arrange_ui');
      expect(arrangeTool.name).toBe('Arrange UI Elements');
      expect(arrangeTool.category).toBe('ui');
      expect(arrangeTool.readOnlyHint).toBe(false);
      expect(arrangeTool.destructiveHint).toBe(true);
      expect(arrangeTool.idempotentHint).toBe(false);
    });
    
    it('should validate layout creation schema', () => {
      const validInput = {
        parentPath: '.',
        containerType: 'HBoxContainer',
        name: 'MainLayout',
        alignment: 'begin',
        separation: 10
      };

      layoutTool.inputSchema.parse(validInput);
    });
    
    it('should validate arrange controls schema', () => {
      const validInput = {
        containerPath: './MainLayout',
        children: ['./Button1', './Button2', './Button3'],
        arrangement: 'horizontal',
        options: {
          spacing: 20,
          alignment: 'center'
        }
      };

      arrangeTool.inputSchema.parse(validInput);
    });
  });
  
  describe('Tool Execution', () => {
    it('should execute control tool without error', async () => {
      const tool = createControlTool(mockTransport as any);
      const result = await tool.handler({
        parentPath: '.',
        controlType: 'Button',
        name: 'TestButton'
      });
      
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });
    
    it('should execute popup tool without error', async () => {
      const tool = createPopupTool(mockTransport as any);
      const result = await tool.handler({
        parentPath: '.',
        popupType: 'Popup',
        name: 'TestPopup'
      });
      
      expect(result).toHaveProperty('content');
    });
    
    it('should handle tool errors gracefully', async () => {
      const errorTransport = {
        execute: async () => ({ success: false, error: 'Mock error' })
      };
      
      const tool = createControlTool(errorTransport as any);
      const result = await tool.handler({
        parentPath: '.',
        controlType: 'Button',
        name: 'TestButton'
      });
      
      expect(result.content[0].text).toContain('Failed');
    });
  });
});