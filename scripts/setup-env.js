#!/usr/bin/env node

/**
 * Setup script for environment variables
 * Run this script to set up your OpenAI API key
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🔑 OpenAI API Key Setup");
console.log("======================");
console.log("");
console.log("1. Go to: https://platform.openai.com/api-keys");
console.log("2. Create a new secret key");
console.log("3. Copy the key (starts with sk-)");
console.log("");

rl.question("Enter your OpenAI API key: ", (apiKey) => {
  if (!apiKey || !apiKey.startsWith("sk-")) {
    console.log('❌ Invalid API key format. Key should start with "sk-"');
    rl.close();
    return;
  }

  // Update the env.ts file
  const envPath = path.join(__dirname, "..", "config", "env.ts");

  try {
    let envContent = fs.readFileSync(envPath, "utf8");

    // Replace the placeholder with the actual API key
    envContent = envContent.replace(
      /OPENAI_API_KEY: process\.env\.OPENAI_API_KEY \|\| '[^']*'/,
      `OPENAI_API_KEY: process.env.OPENAI_API_KEY || '${apiKey}'`
    );

    fs.writeFileSync(envPath, envContent);

    console.log("✅ API key configured successfully!");
    console.log("📁 Updated: config/env.ts");
    console.log("");
    console.log("🚀 You can now run your app and test the WebRTC connection!");
  } catch (error) {
    console.log("❌ Error updating configuration:", error.message);
  }

  rl.close();
});
