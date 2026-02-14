# GLM (Zhipu AI) Streaming - RESOLVED

## Overview

The GLM provider (Zhipu AI / Z.AI) previously experienced HTTP/2 protocol errors when streaming responses through Cloudflare Workers. This issue has been **resolved** by implementing a custom SSE parser that handles the stream correctly.

**Status**: RESOLVED - Streaming now works with reasoning support
**Last Updated**: 2026-02-13
**Affected Provider**: GLM (Z.AI)
**Resolution**: Custom SSE streaming implementation with `thinking` parameter support

---

## Original Problem (Historical)

### Error Message
```
Stream error: h2: The following field is invalid: Entry
```

When using `stream: true` with the GLM API through Cloudflare Workers, an HTTP/2 protocol-level error occurred. The SSE stream from GLM contained data that triggered an H2 parsing error in the Workers runtime.

---

## Resolution

The GLM provider was rewritten to use **streaming mode** with a custom SSE parser instead of relying on the default EventSource/fetch streaming behavior that triggered H2 issues.

### Key Changes

1. **Streaming enabled**: `stream: true` with `stream_options: { include_usage: true }`
2. **Reasoning/thinking support**: Added `thinking: { type: 'enabled' }` for thinking-capable models (glm-4.5, glm-4.5v, glm-4.6, glm-4.6v, glm-4.7, glm-5)
3. **Custom SSE parsing**: Manual line-by-line SSE parsing that extracts both `delta.reasoning_content` and `delta.content`
4. **Dynamic max output tokens**: Uses `getMaxOutputTokens(model)` for per-model output limits instead of a hardcoded cap

### Thinking-Capable Models

The following GLM models support the `thinking` parameter for chain-of-thought reasoning:

| Model | Thinking Support |
|-------|-----------------|
| glm-4.5 | Yes |
| glm-4.5v | Yes |
| glm-4.6 | Yes |
| glm-4.6v | Yes |
| glm-4.7 | Yes |
| glm-5 | Yes |
| glm-4.7-flash | No |
| glm-4.5-flash | No |

### Response Format

GLM streaming uses the OpenAI-compatible SSE format:

```
data: {"choices":[{"delta":{"reasoning_content":"thinking..."}}]}
data: {"choices":[{"delta":{"content":"response..."}}]}
data: {"choices":[{"finish_reason":"stop"}],"usage":{...}}
data: [DONE]
```

- `delta.reasoning_content` — Model's chain-of-thought reasoning (streamed first)
- `delta.content` — Main response content (streamed after reasoning)

---

## Debugging GLM Issues

Enhanced debug logging is available with prefix `[GLM]`:

**Request logging**:
- Endpoint URL
- Model being used
- API key (first 8 characters only)
- Message count and stream mode

**Error logging**:
- HTTP status and status text
- Raw error body
- Parsed error JSON with full details
- API error code (GLM-specific)

### Common GLM Error Patterns

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "insufficient balance" / "not enough tokens" | Account has no credits for paid models | Use free models (glm-4.7-flash, glm-4.5-flash) or add credits |
| "invalid api key" | Incorrect or expired API key | Regenerate key at z.ai |
| "model not found" | Invalid model name | Check supported models list |
| HTTP 429 | Rate limited | Wait and retry, or reduce request frequency |

---

## Related Files

| File | Description |
|------|-------------|
| [src/lib/llm/providers/glm.ts](../src/lib/llm/providers/glm.ts) | GLM provider implementation (streaming with reasoning) |
| [src/lib/llm/types.ts](../src/lib/llm/types.ts) | Provider type definitions (StreamChunk with reasoning field) |
| [src/lib/llm/reasoning-utils.ts](../src/lib/llm/reasoning-utils.ts) | `<think>` tag extraction fallback utility |
| [src/lib/llm/token-counter.ts](../src/lib/llm/token-counter.ts) | Token estimation and max output tokens per model |

---

## References

- [GLM API Documentation](https://docs.z.ai/guides/develop/http/introduction)
- [Cloudflare Workers Streaming](https://developers.cloudflare.com/workers/learning/how-workers-works/)
