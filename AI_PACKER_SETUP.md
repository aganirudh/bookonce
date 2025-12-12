# AI Packer Setup Guide

## Issue: API Key Not Working

The service account API key you provided might not have the correct permissions for chat completions.

## Solution Steps:

### 1. **Restart Your Development Server**
Environment variables in Vite only load when the server starts. After adding the `.env` file:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
```

### 2. **Verify API Key Type**
Service account keys (`sk-svcacct-...`) may have limited permissions. You need a key with:
- Chat completion access
- GPT-3.5-turbo model access

### 3. **Get a New API Key**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name (e.g., "Travel App AI Packer")
4. **Important:** Select a key type with chat completion permissions
5. Copy the key (starts with `sk-proj-...` or `sk-...`)

### 4. **Update Your .env File**
Replace the key in `.env`:

```env
VITE_OPENAI_API_KEY=your_new_key_here
```

### 5. **Restart Server Again**
After updating `.env`, restart the dev server to load the new key.

## Testing the AI Packer

1. Navigate to the Travel Utilities page
2. Find the "AI Packer" widget
3. Type a trip description: "3 days beach trip in Bali"
4. Click "Pack"
5. You should see AI-generated packing suggestions

## Troubleshooting

### Error: "Please check your API key"
- Verify the key is correctly copied (no extra spaces)
- Ensure you restarted the dev server
- Check browser console for detailed error messages

### Error: "Insufficient permissions"
- Your API key doesn't have chat completion access
- Create a new key with proper permissions

### Error: "Rate limit exceeded"
- You've hit OpenAI's rate limits
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

## Manual API Key Entry

If environment variables don't work:
1. Click "Set API" in the AI Packer widget
2. Paste your API key directly
3. The key will be stored in browser memory (not saved permanently)

## Security Notes

- Never commit `.env` files to Git (already in `.gitignore`)
- Regenerate any API keys that were exposed
- Use environment variables for production deployments
