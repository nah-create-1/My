import { FileService } from './FileService'

interface CursorRule {
  pattern: string
  action: 'suggest' | 'enforce' | 'warn' | 'ignore'
  description: string
  priority: number
}

interface CursorRulesConfig {
  general: {
    codeStyle: 'functional' | 'oop' | 'mixed'
    preferredLanguages: string[]
    excludePatterns: string[]
    maxSuggestionLength: number
  }
  rules: CursorRule[]
  customPrompts: {
    [key: string]: string
  }
  contextSettings: {
    includeImports: boolean
    includeComments: boolean
    contextRadius: number
  }
}

class CursorRulesServiceClass {
  private config: CursorRulesConfig | null = null
  private lastLoaded: number = 0
  private readonly CACHE_DURATION = 5000 // 5 seconds

  async loadRules(): Promise<CursorRulesConfig> {
    const now = Date.now()
    
    // Return cached config if still valid
    if (this.config && now - this.lastLoaded < this.CACHE_DURATION) {
      return this.config
    }

    try {
      // Try to load .cursorrules file
      const rulesContent = await FileService.getFileContent('.cursorrules')
      this.config = this.parseRulesFile(rulesContent.content)
      this.lastLoaded = now
      return this.config
    } catch (error) {
      // If .cursorrules doesn't exist, return default config
      this.config = this.getDefaultConfig()
      this.lastLoaded = now
      return this.config
    }
  }

  private parseRulesFile(content: string): CursorRulesConfig {
    try {
      // Handle different formats: YAML-like, JSON, or plain text
      if (content.trim().startsWith('{')) {
        // JSON format
        return JSON.parse(content)
      } else {
        // Parse YAML-like or plain text format
        return this.parseTextRules(content)
      }
    } catch (error) {
      console.warn('Failed to parse .cursorrules file, using defaults:', error)
      return this.getDefaultConfig()
    }
  }

  private parseTextRules(content: string): CursorRulesConfig {
    const config = this.getDefaultConfig()
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))

    for (const line of lines) {
      this.parseRuleLine(line, config)
    }

    return config
  }

  private parseRuleLine(line: string, config: CursorRulesConfig) {
    // Parse various rule formats
    if (line.includes(':')) {
      const [key, value] = line.split(':').map(s => s.trim())
      
      switch (key.toLowerCase()) {
        case 'code_style':
        case 'codestyle':
          if (['functional', 'oop', 'mixed'].includes(value)) {
            config.general.codeStyle = value as 'functional' | 'oop' | 'mixed'
          }
          break
          
        case 'max_suggestion_length':
        case 'maxsuggestionlength':
          const length = parseInt(value)
          if (!isNaN(length) && length > 0) {
            config.general.maxSuggestionLength = length
          }
          break
          
        case 'preferred_languages':
        case 'preferredlanguages':
          config.general.preferredLanguages = value.split(',').map(s => s.trim())
          break
          
        case 'exclude_patterns':
        case 'excludepatterns':
          config.general.excludePatterns = value.split(',').map(s => s.trim())
          break
          
        case 'include_imports':
        case 'includeimports':
          config.contextSettings.includeImports = value.toLowerCase() === 'true'
          break
          
        case 'include_comments':
        case 'includecomments':
          config.contextSettings.includeComments = value.toLowerCase() === 'true'
          break
          
        case 'context_radius':
        case 'contextradius':
          const radius = parseInt(value)
          if (!isNaN(radius) && radius >= 0) {
            config.contextSettings.contextRadius = radius
          }
          break
      }
    }
    
    // Parse rule definitions
    if (line.includes('->') || line.includes('=>')) {
      const parts = line.split(/->|=>/).map(s => s.trim())
      if (parts.length >= 2) {
        const rule: CursorRule = {
          pattern: parts[0],
          action: this.parseAction(parts[1]),
          description: parts[2] || '',
          priority: 1
        }
        config.rules.push(rule)
      }
    }
  }

  private parseAction(actionStr: string): 'suggest' | 'enforce' | 'warn' | 'ignore' {
    const action = actionStr.toLowerCase()
    if (['suggest', 'enforce', 'warn', 'ignore'].includes(action)) {
      return action as 'suggest' | 'enforce' | 'warn' | 'ignore'
    }
    return 'suggest'
  }

  private getDefaultConfig(): CursorRulesConfig {
    return {
      general: {
        codeStyle: 'mixed',
        preferredLanguages: ['typescript', 'javascript', 'python'],
        excludePatterns: ['node_modules/', '.git/', 'dist/', 'build/'],
        maxSuggestionLength: 200
      },
      rules: [
        {
          pattern: 'console.log',
          action: 'warn',
          description: 'Consider using proper logging instead of console.log',
          priority: 1
        },
        {
          pattern: 'any',
          action: 'warn',
          description: 'Avoid using "any" type in TypeScript',
          priority: 2
        },
        {
          pattern: 'TODO',
          action: 'suggest',
          description: 'Consider creating an issue for TODO items',
          priority: 1
        }
      ],
      customPrompts: {
        'explain': 'Provide a clear, concise explanation focusing on practical understanding.',
        'refactor': 'Improve code readability and maintainability while preserving functionality.',
        'optimize': 'Focus on performance improvements and best practices.',
        'test': 'Generate comprehensive tests with edge cases and good coverage.'
      },
      contextSettings: {
        includeImports: true,
        includeComments: true,
        contextRadius: 10
      }
    }
  }

  async createDefaultRulesFile(): Promise<void> {
    const defaultContent = `# Cursor AI Rules Configuration
# This file customizes how the AI assistant behaves in your project

# General Settings
code_style: mixed
preferred_languages: typescript, javascript, python
max_suggestion_length: 200
exclude_patterns: node_modules/, .git/, dist/, build/

# Context Settings
include_imports: true
include_comments: true
context_radius: 10

# Custom Rules (pattern -> action -> description)
# Actions: suggest, enforce, warn, ignore

console.log -> warn -> Consider using proper logging instead of console.log
any -> warn -> Avoid using "any" type in TypeScript
TODO -> suggest -> Consider creating an issue for TODO items
var -> enforce -> Use let or const instead of var
== -> enforce -> Use strict equality (===) instead of ==

# Custom Prompts
# These override default AI prompts for specific actions
# 
# explain: Provide clear, practical explanations
# refactor: Focus on readability and maintainability
# optimize: Emphasize performance and best practices
# test: Generate comprehensive tests with edge cases
`

    try {
      await FileService.createFile('.cursorrules', defaultContent)
      console.log('Created default .cursorrules file')
    } catch (error) {
      console.error('Failed to create .cursorrules file:', error)
    }
  }

  async applyRulesToPrompt(
    basePrompt: string, 
    action: string, 
    context: { language?: string; fileName?: string }
  ): Promise<string> {
    const config = await this.loadRules()
    
    let enhancedPrompt = basePrompt

    // Apply custom prompt if available
    if (config.customPrompts[action]) {
      enhancedPrompt = `${config.customPrompts[action]}\n\n${enhancedPrompt}`
    }

    // Apply code style preferences
    if (config.general.codeStyle !== 'mixed') {
      enhancedPrompt += `\n\nCode Style: Prefer ${config.general.codeStyle} programming patterns.`
    }

    // Apply language preferences
    if (context.language && config.general.preferredLanguages.includes(context.language)) {
      enhancedPrompt += `\n\nLanguage: This is ${context.language} code, apply ${context.language} best practices.`
    }

    // Apply relevant rules
    const applicableRules = config.rules.filter(rule => 
      basePrompt.toLowerCase().includes(rule.pattern.toLowerCase()) ||
      context.fileName?.includes(rule.pattern)
    )

    if (applicableRules.length > 0) {
      enhancedPrompt += '\n\nRelevant Rules:'
      for (const rule of applicableRules) {
        enhancedPrompt += `\n- ${rule.action.toUpperCase()}: ${rule.description}`
      }
    }

    return enhancedPrompt
  }

  async shouldExcludeFile(filePath: string): Promise<boolean> {
    const config = await this.loadRules()
    
    return config.general.excludePatterns.some(pattern => 
      filePath.includes(pattern)
    )
  }

  async getContextSettings(): Promise<CursorRulesConfig['contextSettings']> {
    const config = await this.loadRules()
    return config.contextSettings
  }

  async validateRule(rule: string): Promise<{ valid: boolean; message?: string }> {
    try {
      // Basic validation of rule syntax
      if (rule.includes('->') || rule.includes('=>')) {
        const parts = rule.split(/->|=>/).map(s => s.trim())
        if (parts.length < 2) {
          return { valid: false, message: 'Rule must have at least pattern and action' }
        }
        
        const action = this.parseAction(parts[1])
        if (!['suggest', 'enforce', 'warn', 'ignore'].includes(action)) {
          return { valid: false, message: 'Action must be one of: suggest, enforce, warn, ignore' }
        }
        
        return { valid: true }
      }
      
      if (rule.includes(':')) {
        return { valid: true }
      }
      
      return { valid: false, message: 'Rule must be in format "pattern -> action" or "setting: value"' }
    } catch (error) {
      return { valid: false, message: `Invalid rule syntax: ${error.message}` }
    }
  }
}

export const CursorRulesService = new CursorRulesServiceClass()