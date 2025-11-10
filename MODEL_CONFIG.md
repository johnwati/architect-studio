# Claude Model Configuration

## Configuration Setup

You can configure which Claude model to use by setting the `VITE_CLAUDE_MODEL` environment variable in your `.env` file.

### Current Setup

In your `.env` file:
```bash
VITE_CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### Available Models

**Sonnet Models** (Higher quality, slower):
- `claude-sonnet-3.5-20241022` (Recommended for best quality)
- `claude-sonnet-4-20250514`

**Haiku Models** (Faster, cheaper):
- `claude-haiku-3.5-20241022` (Recommended for speed)
- `claude-3-5-haiku-20241022`

**Opus Models** (Highest quality, slowest):
- `claude-opus-3.0-20240229`
- `claude-3-opus-20240229`

### Default Model

If `VITE_CLAUDE_MODEL` is not set, the app defaults to:
- `claude-sonnet-3.5-20241022` (Good balance of quality and speed)

### How to Change Models

1. Edit your `.env` file
2. Update the `VITE_CLAUDE_MODEL` value
3. Restart your dev server
4. Model will be used for all new generations

### Recommendations

- **Best Quality**: Use Sonnet models
- **Best Speed/Cost**: Use Haiku models
- **Balanced**: Use `claude-sonnet-3.5-20241022` (default)

### Verifying Available Models

You can check which models are available to your API key by running:
```bash
curl https://api.anthropic.com/v1/models \
  --header "x-api-key: $VITE_ANTHROPIC_API_KEY" \
  --header "anthropic-version: 2023-06-01"
```

---

**Your app now supports configurable Claude models! 🎉**


