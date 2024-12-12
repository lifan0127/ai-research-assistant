import React from 'react'

export interface StepInput {
  id: string
  timestamp: string
  status: 'IN_PROGRESS' | 'COMPLETED'
}