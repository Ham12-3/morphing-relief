@echo off
REM This script sets up the correct Node.js path and starts the dev server
REM It uses nvm's Node.js version instead of the system-wide installation

REM Check if nvm is available
if exist "C:\Users\mobol\AppData\Roaming\nvm\v22.14.0\node.exe" (
    echo Using nvm Node.js v22.14.0
    set "PATH=C:\Users\mobol\AppData\Roaming\nvm\v22.14.0;%PATH%"
    
    REM Remove old Node.js from PATH for this session
    set "PATH=%PATH:C:\Program Files\nodejs\;=%"
    
    REM Verify Node version
    node --version
    
    REM Start dev server
    npm run dev
) else (
    echo ERROR: nvm Node.js v22.14.0 not found!
    echo Please make sure nvm is installed and Node.js 22.14.0 is installed via nvm
    pause
)

