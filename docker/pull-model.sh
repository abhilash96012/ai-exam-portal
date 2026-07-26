#!/bin/sh

OLLAMA_HOST="${OLLAMA_HOST:-http://ollama:11434}"
MODEL="${OLLAMA_MODEL:-llama3}"

echo "🤖 Starting Ollama model initialization..."
echo "📍 Target Ollama host: $OLLAMA_HOST"
echo "📦 Target model: $MODEL"

# Wait for Ollama service to respond
echo "⏳ Waiting for Ollama daemon to become ready..."
until curl -s "$OLLAMA_HOST/api/tags" > /dev/null; do
  echo "Sleeping 5 seconds awaiting Ollama service..."
  sleep 5
done

echo "✅ Ollama daemon is ready!"

# Check if model is already pulled
if curl -s "$OLLAMA_HOST/api/tags" | grep -q "$MODEL"; then
  echo "🎉 Model '$MODEL' is already available in Ollama."
else
  echo "📥 Model '$MODEL' not found. Triggering download..."
  curl -X POST "$OLLAMA_HOST/api/pull" -H "Content-Type: application/json" -d "{\"name\": \"$MODEL\", \"stream\": false}"
  echo "✅ Model '$MODEL' successfully pulled!"
fi

echo "🚀 Ollama setup complete. AI Exam system is ready!"
