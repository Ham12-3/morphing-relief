# Fixing Node.js PATH Issue

## Problem
Windows is using the old Node.js (v20.10.0) from `C:\Program Files\nodejs\` instead of nvm's version (v22.14.0).

## Quick Fix: Use the Startup Script

I've created a batch script that temporarily fixes the PATH for your terminal session.

### Option 1: Use the Batch Script (Easiest)

Simply run:
```bash
start-dev.bat
```

This will:
- Use nvm's Node.js v22.14.0
- Remove the old Node.js from PATH for this session
- Start your dev server

---

## Permanent Fix: Edit Windows PATH

### Step 1: Open Environment Variables

1. Press `Windows Key + R`
2. Type: `sysdm.cpl` and press Enter
3. Click the **"Advanced"** tab
4. Click **"Environment Variables"** button

### Step 2: Edit PATH

1. Under **"User variables"** or **"System variables"**, find and select **"Path"**
2. Click **"Edit"**

### Step 3: Remove Old Node.js Path

1. Look for this entry:
   ```
   C:\Program Files\nodejs\
   ```
2. Select it and click **"Delete"**

### Step 4: Add nvm Path (Optional but Recommended)

1. Click **"New"**
2. Add this path (adjust username if needed):
   ```
   C:\Users\mobol\AppData\Roaming\nvm\v22.14.0
   ```
3. Click **"Move Up"** to move it to the top

### Step 5: Save and Restart

1. Click **"OK"** on all dialogs
2. **Close ALL terminal windows** (including VS Code terminal)
3. **Reopen your terminal**
4. Run: `node -v` (should show v22.14.0)
5. Run: `npm run dev`

---

## Alternative: Uninstall Old Node.js

If you want to completely remove the old Node.js:

1. Go to **Control Panel** > **Programs** > **Uninstall a program**
2. Find **"Node.js"** (should show version 20.10.0)
3. Right-click and select **"Uninstall"**

---

## Verify It's Working

After making changes, verify:

```bash
node --version
# Should show: v22.14.0

npm run dev
# Should start without the crypto.hash error
```

---

## Troubleshooting

If it still doesn't work:

1. Make sure you closed and reopened ALL terminal windows
2. Check if nvm path is correct: `C:\Users\mobol\AppData\Roaming\nvm\v22.14.0`
3. Verify nvm has Node.js 22.14.0: `nvm list`
4. Switch to it: `nvm use 22.14.0`

