export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
  modified?: string
}

export interface CodeCompletion {
  text: string
  range: {
    startLineNumber: number
    startColumn: number
    endLineNumber: number
    endColumn: number
  }
  kind: string
  detail?: string
  documentation?: string
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  fileContext?: string
}

export interface AIModelConfig {
  modelName: string
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface CompletionRequest {
  code: string
  language: string
  position: {
    line: number
    character: number
  }
  context?: string
}

export interface CompletionResponse {
  completions: CodeCompletion[]
  processingTime: number
}

export interface TrainingConfig {
  datasetPath: string
  outputDir: string
  epochs: number
  batchSize: number
  learningRate: number
  maxLength: number
  warmupSteps: number
  loggingSteps: number
  saveSteps: number
  evaluationStrategy: string
}

export interface ModelPerformance {
  perplexity: number
  accuracy: number
  bleuScore: number
  codeExecutionSuccess: number
}

export interface FileContent {
  path: string
  content: string
  language: string
  lastModified: Date
}