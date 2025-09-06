/**
 * Example environment configuration
 * Copy this file to env.ts and update with your actual values
 */

export const ENV_EXAMPLE = {
  OPENAI_API_KEY: "your_openai_api_key_here",
  OPENAI_REALTIME_API_URL:
    "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
} as const;

// Instructions:
// 1. Get your OpenAI API key from: https://platform.openai.com/api-keys
// 2. Copy this file to env.ts
// 3. Update the values with your actual API key
// 4. Make sure to add env.ts to your .gitignore file
