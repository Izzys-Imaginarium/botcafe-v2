# GLM (Zhipu AI) Streaming Issue

## Overview

The GLM provider (Zhipu AI / Z.AI) experiences HTTP/2 protocol errors when streaming responses through Cloudflare Workers. This document explains the issue, current workaround, and potential future solutions.

**Status**: Workaround implemented (non-streaming mode)
**Last Updated**: 2026-02-03
**Affected Provider**: GLM (Z.AI)
**Impact**: GLM responses appear all at once instead of streaming token-by-token

---

## The Problem

### Error Message
```
Stream error: h2: The following field is invalid: Entry
```

### Technical Details

When using `stream: true` with the GLM API through Cloudflare Workers, the following error occurs:

```json
{
  "cause": {
    "type": "internal",
    "error": "Stream error: h2: The following field is invalid: Entry"
  }
}
```

This is an **HTTP/2 (H2) protocol-level error** that occurs when Cloudflare Workers attempts to process the Server-Sent Events (SSE) stream from GLM's API.

### Root Cause Analysis

1. **GLM API Format**: GLM uses the standard OpenAI-compatible SSE streaming format
2. **Cloudflare Workers H2**: Cloudflare Workers' HTTP/2 implementation has specific constraints on how streaming responses are handled
3. **Protocol Mismatch**: The SSE stream from GLM contains data that triggers an H2 parsing error in the Workers runtime

The error occurs at the network/protocol layer, not in our application code. The `h2: The following field is invalid: Entry` message indicates the HTTP/2 stream parser encountered a header or field it couldn't process.

---

## Current Workaround

We switched the GLM provider to **non-streaming mode** (`stream: false`):

```typescript
// In src/lib/llm/providers/glm.ts
const body = {
  model: params.model || this.defaultModel,
  messages: params.messages.map((m) => ({
    role: m.role,
    content: m.content,
  })),
  stream: false, // Disabled streaming due to CF Workers H2 issues
  // ... other params
}
```

### Implications

| Aspect | With Streaming | Without Streaming (Current) |
|--------|---------------|----------------------------|
| Response appearance | Token-by-token | All at once |
| Perceived latency | Lower (immediate feedback) | Higher (wait for full response) |
| User experience | Real-time typing effect | Response appears after generation |
| Error handling | Can fail mid-stream | Cleaner success/fail boundary |
| Other providers | Unaffected | Unaffected |

---

## Potential Future Solutions

### 1. GLM API Updates
**Probability**: Medium
**Effort**: None (on our end)
**Description**: Zhipu AI may update their SSE implementation to be more compatible with Cloudflare Workers' H2 constraints.

**Action**: Monitor GLM API changelog and test streaming periodically.

### 2. Cloudflare Workers Updates
**Probability**: Medium
**Effort**: None (on our end)
**Description**: Cloudflare may improve their Workers runtime's H2 streaming compatibility.

**Action**: Monitor Cloudflare Workers changelog and test after runtime updates.

### 3. Proxy Service
**Probability**: High (if implemented)
**Effort**: Medium-High
**Description**: Route GLM API calls through a proxy service that handles the H2 streaming and re-emits via HTTP/1.1 or WebSocket.

**Options**:
- Dedicated Cloudflare Worker that acts as a streaming proxy
- External proxy service (increases latency)
- Edge function on another platform (Vercel Edge, Deno Deploy)

**Trade-offs**:
- Additional latency
- More infrastructure to maintain
- Additional costs

### 4. Client-Side Pseudo-Streaming
**Probability**: High (if implemented)
**Effort**: Low-Medium
**Description**: Implement a "typewriter effect" on the client that simulates streaming by progressively revealing the complete response.

**Implementation**:
```typescript
// Pseudo-code for client-side typewriter effect
function simulateStreaming(fullText: string, onChunk: (text: string) => void) {
  let index = 0;
  const chunkSize = 3; // characters per "tick"
  const interval = setInterval(() => {
    if (index >= fullText.length) {
      clearInterval(interval);
      return;
    }
    index += chunkSize;
    onChunk(fullText.slice(0, index));
  }, 30); // 30ms per chunk
}
```

**Trade-offs**:
- Full response still loaded at once (no early visibility of issues)
- Not "real" streaming - content is already generated
- Better perceived user experience

### 5. WebSocket Alternative
**Probability**: Medium
**Effort**: High
**Description**: Replace SSE with WebSocket connections for GLM, which may avoid the H2 issues.

**Trade-offs**:
- Significant refactoring required
- WebSocket connection management complexity
- May not be supported by GLM API

### 6. HTTP/1.1 Fallback
**Probability**: Low
**Effort**: Medium
**Description**: Force HTTP/1.1 for GLM API calls to avoid H2 entirely.

**Challenges**:
- Cloudflare Workers may not allow protocol selection
- May require custom fetch implementation
- GLM API may require H2

---

## Testing Protocol

When testing streaming fixes:

1. **Create test conversation** with a GLM API key
2. **Send a message** that requires a substantial response (50+ tokens)
3. **Observe network tab** for SSE events or error responses
4. **Check Cloudflare logs** for H2/streaming errors
5. **Compare with other providers** (OpenAI, Anthropic) which stream correctly

### Test Endpoints

```bash
# GLM API endpoint
https://api.z.ai/api/paas/v4/chat/completions

# Test with curl (non-streaming)
curl -X POST "https://api.z.ai/api/paas/v4/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "glm-4.7-flash",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

---

## Debugging GLM Issues

Enhanced debug logging was added on 2026-02-03 to help troubleshoot GLM API issues. When errors occur, the following information is logged:

### GLM Provider Logs (glm.ts)

**Request logging** (prefix: `[GLM]`):
- Endpoint URL
- Model being used
- API key (first 8 characters only)
- Message count and stream mode
- Request body preview

**Error logging** (prefix: `[GLM]`):
- HTTP status and status text
- Raw error body (before parsing)
- Parsed error JSON with full details
- Extracted error message
- API error code (GLM-specific)

### Context Builder Logs (context-builder.ts)

**Prompt construction** (prefix: `[Context Builder]`):
- Conversation ID, bot, persona, user details
- System prompt length at each stage
- Lore activation results (count, types, methods, token budget)
- Memory retrieval results (count, importance levels, emotional contexts)
- Final message breakdown with role and content preview

### Chat Stream Logs (route.ts)

**Request summary** (prefix: `[Chat Stream]`):
- Provider and model
- API key ID
- Context stats (system prompt length, lore count, memory count, token estimate)

**Error details** (prefix: `[Chat Stream]`):
- Full error object with type, message, code, status code, and details

### Common GLM Error Patterns

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "insufficient balance" / "not enough tokens" | Account has no credits for paid models | Use free models (glm-4.7-flash, glm-4.5-flash) or add credits |
| "invalid api key" | Incorrect or expired API key | Regenerate key at z.ai |
| "model not found" | Invalid model name | Check supported models list |
| HTTP 429 | Rate limited | Wait and retry, or reduce request frequency |

---

## Investigation Backlog

### Short-Term (Next Sprint)
- [ ] Test client-side pseudo-streaming implementation
- [ ] Document exact H2 frame causing the error (if possible via Cloudflare logs)

### Medium-Term (1-2 Months)
- [ ] Prototype streaming proxy Worker
- [ ] Test GLM API updates (check monthly)
- [ ] Test Cloudflare Workers updates (check monthly)

### Long-Term
- [ ] Evaluate WebSocket alternative if other solutions fail
- [ ] Consider multi-provider abstraction for streaming vs non-streaming

---

## Related Files

| File | Description |
|------|-------------|
| [src/lib/llm/providers/glm.ts](../src/lib/llm/providers/glm.ts) | GLM provider implementation (non-streaming) |
| [src/lib/llm/types.ts](../src/lib/llm/types.ts) | Provider type definitions |
| [src/lib/llm/index.ts](../src/lib/llm/index.ts) | Provider registry |
| [src/lib/llm/token-counter.ts](../src/lib/llm/token-counter.ts) | Token estimation (includes GLM context windows) |

---

## References

- [GLM API Documentation](https://docs.z.ai/guides/develop/http/introduction)
- [Cloudflare Workers Streaming](https://developers.cloudflare.com/workers/learning/how-workers-works/)
- [HTTP/2 Specification](https://httpwg.org/specs/rfc7540.html)
