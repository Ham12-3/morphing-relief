#!/bin/bash

# This script sets up the correct Node.js path and starts the dev server for Git Bash
# It uses nvm's Node.js version instead of the system-wide installation

# Check if nvm is available
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    # Source nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Use Node.js 22.14.0
    nvm use 22.14.0
    
    # Verify Node version
    echo "Using Node.js version:"
    node --version
    
    # Start dev server
    npm run dev
elif [ -d "$HOME/AppData/Roaming/nvm/v22.14.0" ]; then
    # Windows nvm-windows path
    export PATH="$HOME/AppData/Roaming/nvm/v22.14.0:$PATH"
    
    # Remove old Node.js from PATH
    export PATH=$(echo $PATH | tr ':' '\n' | grep -v "Program Files/nodejs" | tr '\n' ':' | sed 's/:$//')
    
    echo "Using Node.js version:"
    node --version
    
    # Start dev server
    npm run dev
else
    echo "ERROR: nvm not found or Node.js 22.14.0 not installed!"
    echo "Please make sure nvm is installed and Node.js 22.14.0 is installed via nvm"
    echo "Run: nvm install 22.14.0"
    exit 1
fi

