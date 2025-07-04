#!/bin/sh

# Exit on any error
set -e

echo "Starting Docker entrypoint script..."

# Set default values for environment variables if not provided
export APP_AMAP_KEY="${APP_AMAP_KEY:-}"
export APP_BACKEND_URL="${APP_BACKEND_URL:-http://localhost:8081/delicious-food-map}"

echo "Environment variables:"
echo "APP_AMAP_KEY: ${APP_AMAP_KEY:0:10}..." # Only show first 10 chars for security
echo "APP_BACKEND_URL: ${APP_BACKEND_URL}"

# Path to the config files
CONFIG_TEMPLATE="/usr/share/nginx/html/config.json.template"
CONFIG_FILE="/usr/share/nginx/html/config.json"

# Check if config.json.template exists
if [ ! -f "$CONFIG_TEMPLATE" ]; then
    echo "Error: config.json.template not found at $CONFIG_TEMPLATE"
    exit 1
fi

# Copy template to config.json
cp "$CONFIG_TEMPLATE" "$CONFIG_FILE"

echo "Original config.json.template:"
cat "$CONFIG_TEMPLATE"

# Use envsubst to replace environment variable placeholders
echo "Replacing environment variables in config.json..."
envsubst < "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"

echo "Updated config.json:"
cat "$CONFIG_FILE"

# Validate that the JSON is still valid after substitution
if ! cat "$CONFIG_FILE" | grep -q "APP_AMAP_KEY"; then
    echo "Config file processed successfully"
else
    echo "Warning: Some placeholders may not have been replaced"
fi

echo "Starting nginx..."

# Execute the command passed to the script (nginx)
exec "$@"
