import { Check, X } from "lucide-react";
import {
  AGENCY_COMPARISON_ROWS,
  AGENCY_HOME_COPY,
} from "./agency-homepage.content";
import {
  getLocalizedValue,
  type AgencyLandingLanguage,
} from "./agency-homepage.logic";

export function AgencyComparisonSection({
  language,
}: {
  language: AgencyLandingLanguage;
}) {
  return (
    <section className="border-y border-border bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {getLocalizedValue(AGENCY_HOME_COPY.comparison.eyebrow, language)}
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {getLocalizedValue(AGENCY_HOME_COPY.comparison.title, language)}
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {getLocalizedValue(AGENCY_HOME_COPY.comparison.lead, language)}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:hidden">
          {AGENCY_COMPARISON_ROWS.map((row) => (
            <article
              key={row.label.en}
              className="rounded-lg border border-border bg-card p-5 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)]"
            >
              <h3 className="font-display text-base font-semibold leading-6 text-foreground">
                {getLocalizedValue(row.label, language)}
              </h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg bg-muted/45 p-4">
                  <p className="font-display text-sm font-medium text-muted-foreground">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.comparison.manualLabel,
                      language,
                    )}
                  </p>
                  <span className="mt-2 inline-flex items-start gap-3 text-sm font-medium leading-6 text-muted-foreground">
                    <X
                      className="mt-1 h-[18px] w-[18px] shrink-0 text-[oklch(0.55_0.02_250)]"
                      aria-hidden="true"
                    />
                    <span>{getLocalizedValue(row.manual, language)}</span>
                  </span>
                </div>
                <div className="rounded-lg border border-primary/15 bg-primary/8 p-4">
                  <p className="font-display text-sm font-bold text-primary">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.comparison.webhealthLabel,
                      language,
                    )}
                  </p>
                  <span className="mt-2 inline-flex items-start gap-3 text-sm font-semibold leading-6 text-foreground">
                    <Check
                      className="mt-1 h-[18px] w-[18px] shrink-0 text-foreground"
                      aria-hidden="true"
                    />
                    <span>{getLocalizedValue(row.webhealth, language)}</span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 hidden overflow-hidden rounded-lg border border-border bg-card shadow-[0_10px_30px_-18px_rgba(15,23,42,0.18)] sm:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/45">
                  <th className="w-[28%] px-6 py-5 text-left" />
                  <th className="px-6 py-5 text-left font-display text-[15px] font-medium text-muted-foreground">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.comparison.manualLabel,
                      language,
                    )}
                  </th>
                  <th className="px-6 py-5 text-left font-display text-[15px] font-bold text-primary">
                    {getLocalizedValue(
                      AGENCY_HOME_COPY.comparison.webhealthLabel,
                      language,
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {AGENCY_COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.label.en}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-6 py-5 align-top text-[15px] font-semibold leading-7 text-foreground">
                      {getLocalizedValue(row.label, language)}
                    </td>
                    <td className="px-6 py-5 align-top text-[15px] leading-7 text-muted-foreground">
                      <span className="inline-flex items-start gap-3 font-medium">
                        <X
                          className="mt-1 h-[18px] w-[18px] shrink-0 text-[oklch(0.55_0.02_250)]"
                          aria-hidden="true"
                        />
                        <span>{getLocalizedValue(row.manual, language)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top text-[15px] leading-7 text-foreground">
                      <span className="inline-flex items-start gap-3 font-semibold">
                        <Check
                          className="mt-1 h-[18px] w-[18px] shrink-0 text-foreground"
                          aria-hidden="true"
                        />
                        <span>{getLocalizedValue(row.webhealth, language)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
