import { z } from 'zod';
import { RegisteredTool } from '../registry.js';
import { Transport, TransportOperation } from '../../transports/transport.js';

const addTranslationSchema = z.object({
  locale: z.string().describe('Locale code (e.g., "en", "fr", "es", "ja")'),
  poFilePath: z.string().describe('Path to the .po translation file'),
  fallback: z.boolean().default(false).describe('Whether this is the fallback locale'),
});

const removeTranslationSchema = z.object({
  locale: z.string().describe('Locale code to remove'),
});

const listTranslationsSchema = z.object({});

const addTranslationStringSchema = z.object({
  locale: z.string().describe('Locale code'),
  msgid: z.string().describe('Message ID (original string)'),
  msgstr: z.string().describe('Translated string'),
  context: z.string().optional().describe('Translation context (optional)'),
});

const generatePotSchema = z.object({
  potFilePath: z.string().describe('Path where to save the .pot template file'),
  includePaths: z.array(z.string()).optional().default(['res://']).describe('Paths to scan for translatable strings'),
  excludePaths: z.array(z.string()).optional().default([]).describe('Paths to exclude from scanning'),
});

export function createAddTranslationTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_add_translation',
    name: 'Add Translation',
    description: 'Add a translation locale to the project',
    category: 'project',
    inputSchema: addTranslationSchema,
    handler: async (args) => {
      // Check if translation file exists
      const checkOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: args.poFilePath },
      };

      const checkResult = await transport.execute(checkOperation);
      
      if (!checkResult.success) {
        throw new Error(`Translation file not found: ${args.poFilePath}`);
      }

      // Add translation to project settings
      const operation: TransportOperation = {
        operation: 'modify_project_settings',
        params: {
          section: 'locale',
          key: `translations/${args.locale}`,
          value: args.poFilePath,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add translation');
      }

      // Set as fallback if specified
      if (args.fallback) {
        const fallbackOperation: TransportOperation = {
          operation: 'modify_project_settings',
          params: {
            section: 'locale',
            key: 'fallback',
            value: args.locale,
          },
        };

        await transport.execute(fallbackOperation);
      }

      return {
        locale: args.locale,
        poFilePath: args.poFilePath,
        fallback: args.fallback,
        message: `Added ${args.locale} translation${args.fallback ? ' (fallback)' : ''} from ${args.poFilePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createRemoveTranslationTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_remove_translation',
    name: 'Remove Translation',
    description: 'Remove a translation locale from the project',
    category: 'project',
    inputSchema: removeTranslationSchema,
    handler: async (args) => {
      const operation: TransportOperation = {
        operation: 'remove_project_setting',
        params: {
          section: 'locale',
          key: `translations/${args.locale}`,
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove translation');
      }

      // Check if this was the fallback locale
      const fallbackOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'locale',
          key: 'fallback',
        },
      };

      const fallbackResult = await transport.execute(fallbackOperation);
      
      if (fallbackResult.success && fallbackResult.data === args.locale) {
        // Remove fallback setting
        const removeFallbackOp: TransportOperation = {
          operation: 'remove_project_setting',
          params: {
            section: 'locale',
            key: 'fallback',
          },
        };
        
        await transport.execute(removeFallbackOp);
      }

      return {
        locale: args.locale,
        message: `Removed ${args.locale} translation`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createListTranslationsTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_list_translations',
    name: 'List Translations',
    description: 'List all translation locales in the project',
    category: 'project',
    inputSchema: listTranslationsSchema,
    handler: async () => {
      const operation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'locale',
        },
      };

      const result = await transport.execute(operation);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to read translations');
      }

      const localeSettings = result.data || {};
      const translations: Array<{locale: string, poFilePath: string, isFallback: boolean}> = [];
      let fallbackLocale = '';

      // Extract translations and fallback
      for (const [key, value] of Object.entries(localeSettings)) {
        if (key.startsWith('translations/')) {
          const locale = key.substring('translations/'.length);
          translations.push({
            locale,
            poFilePath: value as string,
            isFallback: false, // Will update below
          });
        } else if (key === 'fallback') {
          fallbackLocale = value as string;
        }
      }

      // Mark fallback translation
      translations.forEach(t => {
        t.isFallback = t.locale === fallbackLocale;
      });

      return {
        translations,
        fallbackLocale,
        count: translations.length,
        message: `Found ${translations.length} translation${translations.length !== 1 ? 's' : ''}${fallbackLocale ? ` (fallback: ${fallbackLocale})` : ''}`,
        readOnlyHint: true,
      };
    },
    destructiveHint: false,
    idempotentHint: true,
  };
}

export function createAddTranslationStringTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_add_translation_string',
    name: 'Add Translation String',
    description: 'Add a translated string to a translation file',
    category: 'project',
    inputSchema: addTranslationStringSchema,
    handler: async (args) => {
      // First, get the translation file path for the locale
      const readOperation: TransportOperation = {
        operation: 'read_project_settings',
        params: {
          section: 'locale',
          key: `translations/${args.locale}`,
        },
      };

      const readResult = await transport.execute(readOperation);
      
      if (!readResult.success || !readResult.data) {
        throw new Error(`No translation file found for locale: ${args.locale}`);
      }

      const poFilePath = readResult.data as string;
      
      // Read the current PO file
      const readFileOperation: TransportOperation = {
        operation: 'read_file',
        params: { path: poFilePath },
      };

      const fileResult = await transport.execute(readFileOperation);
      
      if (!fileResult.success || !fileResult.data?.content) {
        throw new Error(`Could not read translation file: ${poFilePath}`);
      }

      let poContent = fileResult.data.content;
      
      // Check if translation already exists
      const searchPattern = args.context 
        ? `msgctxt "${args.context}"\nmsgid "${args.msgid}"`
        : `msgid "${args.msgid}"`;
      
      if (poContent.includes(searchPattern)) {
        // Update existing translation
        const updatePattern = new RegExp(
          `(${searchPattern}\\s*\\nmsgstr ")[^"]*(")`,
          'm'
        );
        
        if (updatePattern.test(poContent)) {
          poContent = poContent.replace(updatePattern, `$1${args.msgstr}$2`);
        } else {
          throw new Error(`Could not update existing translation for: ${args.msgid}`);
        }
      } else {
        // Add new translation
        const newEntry = args.context
          ? `\n\nmsgctxt "${args.context}"\nmsgid "${args.msgid}"\nmsgstr "${args.msgstr}"`
          : `\n\nmsgid "${args.msgid}"\nmsgstr "${args.msgstr}"`;
        
        poContent += newEntry;
      }

      // Write updated PO file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: poFilePath,
          content: poContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to update translation file: ${writeResult.error}`);
      }

      return {
        locale: args.locale,
        poFilePath,
        msgid: args.msgid,
        msgstr: args.msgstr,
        context: args.context,
        message: `Added translation for "${args.msgid}" in ${args.locale}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: true,
  };
}

export function createGeneratePotTool(transport: Transport): RegisteredTool {
  return {
    id: 'godot_generate_pot',
    name: 'Generate POT Template',
    description: 'Generate a .pot template file from translatable strings in the project',
    category: 'project',
    inputSchema: generatePotSchema,
    handler: async (args) => {
      // This would typically involve scanning the project for tr() calls
      // For now, we'll create a basic POT template structure
      
      const potHeader = `# Translation template for Godot project
# Copyright (c) ${new Date().getFullYear()} Your Name
# FIRST AUTHOR <EMAIL@ADDRESS>, ${new Date().getFullYear()}.
#
msgid ""
msgstr ""
"Project-Id-Version: Godot Project\\n"
"POT-Creation-Date: ${new Date().toISOString()}\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=2; plural=(n != 1);\\n"

`;

      // In a real implementation, we would:
      // 1. Scan .gd files for tr() calls
      // 2. Scan .tscn files for text properties
      // 3. Extract translatable strings
      
      const potContent = potHeader + '# Add your translatable strings here\n';
      
      // Write the POT file
      const writeOperation: TransportOperation = {
        operation: 'write_file',
        params: {
          path: args.potFilePath,
          content: potContent,
        },
      };

      const writeResult = await transport.execute(writeOperation);
      
      if (!writeResult.success) {
        throw new Error(`Failed to generate POT file: ${writeResult.error}`);
      }

      return {
        potFilePath: args.potFilePath,
        includePaths: args.includePaths,
        excludePaths: args.excludePaths,
        message: `Generated POT template at ${args.potFilePath}`,
        readOnlyHint: false,
      };
    },
    destructiveHint: true,
    idempotentHint: false,
  };
}