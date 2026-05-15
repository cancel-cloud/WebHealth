# Keep the AI report pipeline despite "retired" naming

The modules named `ai-analysis*`, `ai-analysis-runner*`, `ai-run-center*`, `ai-runtime-settings`, and `ai-dashboard-actions`, plus the tables `ai_analysis_runs`, `ai_recommendations`, `ai_runtime_settings`, and `ai_prompt_templates`, look retired by name but are still load-bearing: `live-dashboard.ts` merges AI-tagged rows into the workspace action board, the dashboard `?view=ai-insights` route renders `<AiRunCenterView>`, the admin `ai-prompts` surface edits prompt templates and runtime settings, and `property-refresh-worker.ts` triggers `runAiAnalysisForPropertyWindow` on every refresh. Deleting any of this is therefore not a code purge — it requires four product decisions about the surfaces above. Until those decisions are made, treat these modules and tables as live.

See [PURGE_MANIFEST.md](../notes/2026-05-15-ai-report-pipeline-purge-manifest.md) for the full entanglement audit.
