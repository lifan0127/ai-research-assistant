export interface BaseActionResponse {
  action: string
  payload: object
}

export interface ClarificationActionResponse extends BaseActionResponse {
  action: 'clarification'
  payload: {
    message: string
    _raw: string
  }
}

export interface ErrorActionResponse extends BaseActionResponse {
  action: 'error'
  payload: {
    error: object
    _raw: string
  }
}

export interface RoutingActionResponse extends BaseActionResponse {
  action: 'routing'
  payload: {
    route: string
    input: string
    _raw: string
  }
}

export interface SearchActionResponse extends BaseActionResponse {
  action: 'search'
  payload: {
    keywords?: string[]
    creators?: string[]
    tags?: string[]
    years?: {
      from: number
      to: number
    }
    _raw: string
  }
}

export interface QAActionResponse extends BaseActionResponse {
  action: 'qa'
  payload: {
    answer: string
    sources: string[]
    _raw: string
  }
}

export interface VisionActionResponse extends BaseActionResponse {
  action: 'vision'
  payload: {
    message: string
    _raw: string
  }
}

export interface ExecutorActionResponse extends BaseActionResponse {
  action: 'search' | 'qa'
  payload: {
    widget: 'MARKDOWN' | 'SEARCH_RESULTS' | 'QA_RESPONSE'
    input: object
    _raw: string
  }
}
