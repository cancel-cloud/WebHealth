# WebHealth agent-readiness notes

WebHealth exposes low-risk public discovery metadata for marketing pages only:

- `/robots.txt` includes Content Signals for search and AI grounding, while reserving AI training.
- `/llms.txt` summarizes the public product positioning and links only to public marketing/legal pages.
- localized public marketing pages can return Markdown when `Accept: text/markdown` is preferred over HTML.

WebHealth does not currently expose a stable public third-party API catalog. The product has protected dashboard, customer, authentication, property, admin, and API routes, but those are not public discovery surfaces. For that reason `/.well-known/api-catalog` intentionally returns `404` instead of an empty or fake catalog.

OAuth discovery endpoints and WebMCP should wait until WebHealth has a stable third-party agent or API use case.
