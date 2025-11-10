# Claude API Setup Guide

## Quick Fix for "Connection error"

### Step 1: Check your .env file

1. Open the `.env` file in the root directory of this project
2. Make sure it contains:
   ```
   VITE_ANTHROPIC_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with your actual Anthropic API key

### Step 2: Get your API Key

If you don't have an API key:
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

### Step 3: Restart the Development Server

After updating the `.env` file:
1. Stop the current dev server (Ctrl+C or Cmd+C)
2. Restart it with: `npm run dev`
3. The new environment variables will be loaded

### Step 4: Verify the API Key is Loaded

1. Open browser console (F12)
2. Look for: `✅ Anthropic API key found (length: XX characters)`
3. If you see: `❌ Anthropic API key not found`, the .env file is not being read

### Common Issues:

**Issue: "Connection error"**
- Check your internet connection
- Verify the API key is correct in `.env`
- Make sure you restarted the dev server after adding the API key
- Check browser console for detailed error messages

**Issue: "Authentication error"**
- Your API key might be invalid or expired
- Generate a new API key from Anthropic console
- Make sure there are no extra spaces in the `.env` file

**Issue: "Rate limit exceeded"**
- You've hit the API rate limit
- Wait a few minutes and try again
- Check your Anthropic account usage

### File Structure:

```
ISD_generator/
├── .env              ← Your API key goes here
├── .env.example      ← Example file (don't use this)
├── package.json
└── ...
```

### Example .env file:

```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** 
- Never commit your `.env` file to git
- The `.env` file should already be in `.gitignore`
- Keep your API key secret and secure

