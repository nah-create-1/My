import axios from 'axios'
import { 
  CompletionRequest, 
  CompletionResponse, 
  ChatMessage, 
  AIModelConfig,
  TrainingConfig,
  ModelPerformance 
} from '../types'

class AIServiceClass {
  private baseURL = '/api'
  private wsConnection: WebSocket | null = null

  async getCodeCompletions(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/completions`, request)
      return response.data
    } catch (error) {
      console.error('Failed to get code completions:', error)
      throw error
    }
  }

  async sendChatMessage(message: string, context?: string): Promise<ChatMessage> {
    try {
      const response = await axios.post(`${this.baseURL}/chat`, {
        message,
        context,
        timestamp: new Date().toISOString()
      })
      return response.data
    } catch (error) {
      console.error('Failed to send chat message:', error)
      throw error
    }
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const response = await axios.get(`${this.baseURL}/chat/history`)
      return response.data
    } catch (error) {
      console.error('Failed to get chat history:', error)
      return []
    }
  }

  async getModelConfig(): Promise<AIModelConfig> {
    try {
      const response = await axios.get(`${this.baseURL}/model/config`)
      return response.data
    } catch (error) {
      console.error('Failed to get model config:', error)
      throw error
    }
  }

  async updateModelConfig(config: Partial<AIModelConfig>): Promise<AIModelConfig> {
    try {
      const response = await axios.put(`${this.baseURL}/model/config`, config)
      return response.data
    } catch (error) {
      console.error('Failed to update model config:', error)
      throw error
    }
  }

  async startTraining(config: TrainingConfig): Promise<{ jobId: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/training/start`, config)
      return response.data
    } catch (error) {
      console.error('Failed to start training:', error)
      throw error
    }
  }

  async getTrainingStatus(jobId: string): Promise<{ status: string; progress: number }> {
    try {
      const response = await axios.get(`${this.baseURL}/training/status/${jobId}`)
      return response.data
    } catch (error) {
      console.error('Failed to get training status:', error)
      throw error
    }
  }

  async getModelPerformance(): Promise<ModelPerformance> {
    try {
      const response = await axios.get(`${this.baseURL}/model/performance`)
      return response.data
    } catch (error) {
      console.error('Failed to get model performance:', error)
      throw error
    }
  }

  async makeSensorless(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/model/make-sensorless`)
      return response.data
    } catch (error) {
      console.error('Failed to make model sensorless:', error)
      throw error
    }
  }

  connectWebSocket(onMessage: (data: any) => void): void {
    const wsUrl = `ws://localhost:8000/ws`
    this.wsConnection = new WebSocket(wsUrl)

    this.wsConnection.onopen = () => {
      console.log('WebSocket connected')
    }

    this.wsConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.wsConnection.onclose = () => {
      console.log('WebSocket disconnected')
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        this.connectWebSocket(onMessage)
      }, 3000)
    }

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  sendWebSocketMessage(data: any): void {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(data))
    }
  }

  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close()
      this.wsConnection = null
    }
  }

  // Enhanced Cursor-specific AI methods

  async getInlineSuggestion(request: {
    code: string
    language: string
    position: { line: number; character: number }
    context: { beforeCursor: string; afterCursor: string; fileName: string }
  }): Promise<{ text: string; confidence: number } | null> {
    try {
      const response = await axios.post(`${this.baseURL}/inline-suggestion`, request)
      return response.data
    } catch (error) {
      console.error('Failed to get inline suggestion:', error)
      return null
    }
  }

  async planComposerChanges(request: {
    prompt: string
    selectedFiles: string[]
    codebaseContext: any
  }): Promise<{ tasks: any[] }> {
    try {
      const response = await axios.post(`${this.baseURL}/composer/plan`, request)
      return response.data
    } catch (error) {
      console.error('Failed to plan composer changes:', error)
      throw error
    }
  }

  async generateCode(request: {
    prompt: string
    language?: string
    context?: string
    style?: 'functional' | 'oop' | 'minimal'
  }): Promise<{ code: string; explanation: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/generate`, request)
      return response.data
    } catch (error) {
      console.error('Failed to generate code:', error)
      throw error
    }
  }

  async refactorCode(request: {
    code: string
    language: string
    intent: string
    preserveComments?: boolean
  }): Promise<{ code: string; changes: string[] }> {
    try {
      const response = await axios.post(`${this.baseURL}/refactor`, request)
      return response.data
    } catch (error) {
      console.error('Failed to refactor code:', error)
      throw error
    }
  }

  async explainCode(request: {
    code: string
    language: string
    level?: 'beginner' | 'intermediate' | 'expert'
  }): Promise<{ explanation: string; keyPoints: string[] }> {
    try {
      const response = await axios.post(`${this.baseURL}/explain`, request)
      return response.data
    } catch (error) {
      console.error('Failed to explain code:', error)
      throw error
    }
  }

  async fixCode(request: {
    code: string
    language: string
    error?: string
    context?: string
  }): Promise<{ fixedCode: string; issues: Array<{ type: string; description: string; fix: string }> }> {
    try {
      const response = await axios.post(`${this.baseURL}/fix`, request)
      return response.data
    } catch (error) {
      console.error('Failed to fix code:', error)
      throw error
    }
  }

  async optimizeCode(request: {
    code: string
    language: string
    target?: 'performance' | 'memory' | 'readability'
  }): Promise<{ optimizedCode: string; optimizations: string[] }> {
    try {
      const response = await axios.post(`${this.baseURL}/optimize`, request)
      return response.data
    } catch (error) {
      console.error('Failed to optimize code:', error)
      throw error
    }
  }

  async generateTests(request: {
    code: string
    language: string
    framework?: string
    coverage?: 'basic' | 'comprehensive'
  }): Promise<{ testCode: string; testCases: Array<{ name: string; description: string }> }> {
    try {
      const response = await axios.post(`${this.baseURL}/generate-tests`, request)
      return response.data
    } catch (error) {
      console.error('Failed to generate tests:', error)
      throw error
    }
  }

  async searchCodebase(request: {
    query: string
    fileTypes?: string[]
    includeTests?: boolean
  }): Promise<Array<{ file: string; matches: Array<{ line: number; content: string; context: string }> }>> {
    try {
      const response = await axios.post(`${this.baseURL}/search`, request)
      return response.data
    } catch (error) {
      console.error('Failed to search codebase:', error)
      return []
    }
  }

  async generateCommitMessage(request: {
    diff: string
    files: string[]
    type?: 'conventional' | 'descriptive'
  }): Promise<{ title: string; description?: string }> {
    try {
      const response = await axios.post(`${this.baseURL}/commit-message`, request)
      return response.data
    } catch (error) {
      console.error('Failed to generate commit message:', error)
      throw error
    }
  }

  async analyzeCodebase(): Promise<{
    overview: string
    technologies: string[]
    architecture: string
    suggestions: string[]
  }> {
    try {
      const response = await axios.get(`${this.baseURL}/analyze-codebase`)
      return response.data
    } catch (error) {
      console.error('Failed to analyze codebase:', error)
      throw error
    }
  }
}

export const AIService = new AIServiceClass()