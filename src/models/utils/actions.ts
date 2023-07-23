export interface BaseActionResponse {
  action: string
  payload: object
}

export interface ClarificationActionResponse extends BaseActionResponse {
  action: 'clarification'
  payload: {
    message: string
  }
}

export interface ErrorActionResponse extends BaseActionResponse {
  action: 'error'
  payload: {
    message: string
    error: object
  }
}

export interface RoutingActionResponse extends BaseActionResponse {
  action: 'routing'
  payload: {
    route: string
    input: string
  }
}

export interface SearchActionResponse extends BaseActionResponse {
  action: 'search'
  payload: {
    keywords: string[]
    authors?: string[]
    tags?: string[]
    years?: {
      from: number
      to: number
    }
  }
}

export interface QAActionResponse extends BaseActionResponse {
  action: 'qa'
  payload: {
    answer: string
    sources: string[]
  }
}

export interface ExecutorActionResponse extends BaseActionResponse {
  action: 'search' | 'qa'
  payload: {
    widget: 'MARKDOWN' | 'SEARCH_RESULTS' | 'QA_RESPONSE'
    input: object
  }
}
