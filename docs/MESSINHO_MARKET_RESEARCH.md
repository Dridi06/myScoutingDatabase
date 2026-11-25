# MESSINHO external market research

## Implemented design
- Server-side Tavily search plus OpenAI evidence analysis; MESSINHO's deterministic scoring and learning remain provider-independent.
- Search results are deduplicated, HTTPS-only, source-attributed, and bounded.
- FUSSBALL.DE URLs are explicitly excluded until written rights and official API access are granted.
- Officially published market value is separated from MESSINHO's own estimated range.
- A model-generated range is suppressed unless at least three distinct comparable players have explicit numeric EUR values tied to supplied source URLs.
- Transfer fees, salaries, asking prices and release clauses must not be mislabeled as market values.
- No data is automatically persisted to player records or training tables by this endpoint.

## Endpoint
POST /api/messinho/research/market-value
Authenticated admin/scout only. Input: name (required), optional club, league, position, birthYear. Rate limited.
Secrets: TAVILY_API_KEY, OPENAI_API_KEY, optional OPENAI_MODEL. Server only; never VITE-prefixed.

## Limitations
This endpoint performs on-demand research, not a licensed FUSSBALL.DE feed. Public search snippets may be incomplete or stale. A scout must open and verify sources before relying on any reported value. No guaranteed coverage of all German divisions.
