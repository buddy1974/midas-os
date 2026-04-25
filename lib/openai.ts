// OpenAI pricing reference (as of 2026):
// gpt-4o-mini: $0.15/1M input, $0.60/1M output  ← use for content/copywriting
// gpt-4o: $2.50/1M input, $10.00/1M output       ← use for legal/financial docs
// Typical usage: ~99% on mini, ~1% on gpt-4o

import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set. Add it to .env.local')
  }
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

export function hasOpenAI(): boolean {
  return !!process.env.OPENAI_API_KEY
}
