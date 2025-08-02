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
}

export const AIService = new AIServiceClass()