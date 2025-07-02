#!/bin/sh

# Docker entrypoint script for DeliciousFoodMap-Web
# This script substitutes environment variables in config.json at runtime

set -e

echo "Starting DeliciousFoodMap-Web container..."

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to substitute environment variables in config.json
substitute_config() {
    log "Substituting environment variables in config.json..."
    
    # Check if template exists
    if [ ! -f "/usr/share/nginx/html/config.json.template" ]; then
        log "ERROR: config.json.template not found!"
        exit 1
    fi
    
    # Create config.json from template with environment variable substitution
    envsubst < /usr/share/nginx/html/config.json.template > /usr/share/nginx/html/config.json
    
    # Verify the generated config.json is valid JSON
    if ! cat /usr/share/nginx/html/config.json | jq empty > /dev/null 2>&1; then
        log "WARNING: Generated config.json is not valid JSON. Checking with basic validation..."
        
        # Basic validation - check if it starts with { and ends with }
        if [ "$(head -c 1 /usr/share/nginx/html/config.json)" != "{" ] || [ "$(tail -c 2 /usr/share/nginx/html/config.json | head -c 1)" != "}" ]; then
            log "ERROR: Generated config.json appears to be malformed!"
            log "Content preview:"
            head -n 10 /usr/share/nginx/html/config.json
            exit 1
        fi
    fi
    
    log "Environment variable substitution completed successfully"
    
    # Log configuration summary (without sensitive data)
    log "Configuration summary:"
    cat /usr/share/nginx/html/config.json | sed 's/"[^"]*KEY[^"]*":\s*"[^"]*"/"***KEY***": "***"/g' | sed 's/"[^"]*DSN[^"]*":\s*"[^"]*"/"***DSN***": "***"/g'
}

# Function to validate required environment variables
validate_env() {
    log "Validating environment variables..."
    
    # Check required variables
    if [ -z "$API_BASE_URL" ]; then
        log "WARNING: API_BASE_URL is not set!"
    fi
    
    if [ -z "$AMAP_KEY" ]; then
        log "WARNING: AMAP_KEY is not set - map functionality may not work!"
    fi
    
    log "Environment validation completed"
}

# Function to setup nginx
setup_nginx() {
    log "Setting up Nginx..."
    
    # Test nginx configuration
    if ! nginx -t; then
        log "ERROR: Nginx configuration test failed!"
        exit 1
    fi
    
    log "Nginx configuration is valid"
}

# Main execution
main() {
    log "Initializing container..."
    
    # Validate environment variables
    validate_env
    
    # Substitute environment variables in config.json
    substitute_config
    
    # Setup nginx
    setup_nginx
    
    log "Container initialization completed successfully"
    
    # Execute the main command
    exec "$@"
}

# Run main function with all arguments
main "$@"
