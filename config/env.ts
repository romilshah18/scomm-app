/**
 * Environment configuration for the app
 * Make sure to set these values in your environment or .env file
 */

export const ENV = {
  OPENAI_API_KEY:
    process.env.EXPO_PUBLIC_OPENAI_API_KEY || "your_openai_api_key_here",
  OPENAI_REALTIME_API_URL:
    "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
} as const;

// Validate required environment variables
export const validateEnv = () => {
  if (!ENV.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is required. Please set it in your environment variables."
    );
  }
  return true;
};
