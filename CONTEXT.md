# WebHealth Context

WebHealth tracks website health workflows, AI-assisted recommendations, language-aware reports, and the operational costs of producing those recommendations.

## Glossary

### Application language

The user's preferred language for product UI, authenticated workflows, settings, onboarding, and future client-facing outputs. WebHealth supports German and English application languages.

### Google-detected language

The language inferred from the user's Google account during sign-in. It can initialize the application language when the user has no saved preference, but it does not override a user-selected application language.

### Snapshot language

The application language captured when a user creates a snapshot or share link. Client-facing snapshot artifacts use the captured snapshot language so the same artifact remains stable over time.

### AI run estimate

The estimated OpenAI cost attributed to one WebHealth AI analysis run from recorded response usage.

Avoid: PostHog billing, actual billing.

### OpenAI billed cost

The provider-reported OpenAI organization cost imported for a day, project, and invoice line item.

Avoid: AI run cost, PostHog cost.

### OpenAI cost reconciliation

The comparison of WebHealth AI run estimates against imported OpenAI billed costs.

Avoid: Cost estimation, analytics tracking.

## Relationships

- An AI run estimate belongs to exactly one AI analysis run.
- An OpenAI billed cost belongs to one provider billing day and may be grouped by project and line item.
- OpenAI cost reconciliation compares many AI run estimates with many OpenAI billed costs.

## Example dialogue

> Dev: "PostHog shows AI cost. Is that the OpenAI bill?"
> Domain expert: "No. PostHog shows the AI run estimate. The OpenAI billed cost comes from OpenAI and is used for reconciliation."

## Flagged ambiguities

- "Billing" was used to mean both AI run estimate and OpenAI billed cost. Resolution: keep those terms distinct everywhere.
