import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const addInputActionSchema = z.object({
  actionName: z.string().describe('Name of the input action (e.g., "ui_accept", "move_left")'),
  events: z.array(z.object({
    type: z.enum(['key', 'mouse_button', 'joy_button', 'joy_axis', 'touch']),
    value: z.any().describe('Event value (keycode, button index, axis value, etc.)'),
    device: z.number().optional().default(0).describe('Input device index (0 for all devices)'),
  })).optional().describe('Input events to trigger this action'),
  deadzone: z.number().min(0).max(1).optional().default(0.5).describe('Deadzone for analog inputs'),
});

const removeInputActionSchema = z.object({
  actionName: z.string().describe('Name of the input action to remove'),
});

const listInputActionsSchema = z.object({});

const modifyInputActionSchema = z.object({
  actionName: z.string().describe('Name of the input action to modify'),
  addEvents: z.array(z.object({
    type: z.enum(['key', 'mouse_button', 'joy_button', 'joy_axis', 'touch']),
    value: z.any(),
    device: z.number().optional().default(0),
  })).optional().describe('Events to add to the action'),
  removeEvents: z.array(z.object({
    type: z.enum(['key', 'mouse_button', 'joy_button', 'joy_axis', 'touch']),
    value: z.any(),
    device: z.number().optional().default(0),
  })).optional().describe('Events to remove from the action'),
  deadzone: z.number().min(0).max(1).optional().describe('New deadzone value'),
});

export function createAddInputActionTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_add_input_action',
    name: 'Add Input Action',
    description: 'Add a new input action to the project input map',
    category: 'project',
    inputSchema: addInputActionSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'input',
          key: args.actionName,
          value: {
            deadzone: args.deadzone,
            events: args.events || [],
          },
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add input action');
      }

      return {
        actionName: args.actionName,
        deadzone: args.deadzone,
        eventCount: args.events?.length || 0,
        message: `Added input action "${args.actionName}" with ${args.events?.length || 0} events`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createRemoveInputActionTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_remove_input_action',
    name: 'Remove Input Action',
    description: 'Remove an input action from the project input map',
    category: 'project',
    inputSchema: removeInputActionSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'remove_project_setting',
        params: {
          section: 'input',
          key: args.actionName,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove input action');
      }

      return {
        actionName: args.actionName,
        message: `Removed input action "${args.actionName}"`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListInputActionsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_input_actions',
    name: 'List Input Actions',
    description: 'List all input actions in the project input map',
    category: 'project',
    inputSchema: listInputActionsSchema,
    handler: async () => {
      const operation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'input',
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read input actions');
      }

      const inputActions = result.data || {};
      const actions = Object.keys(inputActions).map(actionName => ({
        name: actionName,
        deadzone: inputActions[actionName]?.deadzone || 0.5,
        eventCount: Array.isArray(inputActions[actionName]?.events) ? inputActions[actionName].events.length : 0,
      }));

      return {
        actions,
        count: actions.length,
        message: `Found ${actions.length} input actions`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createModifyInputActionTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_modify_input_action',
    name: 'Modify Input Action',
    description: 'Modify an existing input action in the project input map',
    category: 'project',
    inputSchema: modifyInputActionSchema,
    handler: async (args) => {
      // First, read the current action
      const readOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'input',
          key: args.actionName,
        },
      };

      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success) {
        throw new Error(`Input action "${args.actionName}" not found`);
      }

      const currentAction = readResult.data || { events: [], deadzone: 0.5 };
      let events = Array.isArray(currentAction.events) ? [...currentAction.events] : [];
      let deadzone = args.deadzone !== undefined ? args.deadzone : currentAction.deadzone;

      // Add events
      if (args.addEvents && args.addEvents.length > 0) {
        events.push(...args.addEvents);
      }

      // Remove events
      if (args.removeEvents && args.removeEvents.length > 0) {
        events = events.filter(event => {
          return !args.removeEvents!.some((removeEvent: any) => 
            removeEvent.type === event.type &&
            removeEvent.value === event.value &&
            (removeEvent.device || 0) === (event.device || 0)
          );
        });
      }

      // Update the action
      const updateOperation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'input',
          key: args.actionName,
          value: {
            deadzone,
            events,
          },
        },
      };

      const updateResult = await transport.execute(updateOperation);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to modify input action');
      }

      return {
        actionName: args.actionName,
        deadzone,
        eventCount: events.length,
        addedEvents: args.addEvents?.length || 0,
        removedEvents: args.removeEvents?.length || 0,
        message: `Modified input action "${args.actionName}" (${events.length} events, deadzone: ${deadzone})`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}