export function SpeculationRules() {
  const rules = {
    prerender: [
      {
        where: { selector_matches: "a[data-speculation='prerender']" },
        eagerness: "moderate",
      },
    ],
    prefetch: [
      {
        where: { selector_matches: "a[data-speculation='prefetch']" },
        eagerness: "moderate",
      },
    ],
  }

  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(rules) }}
    />
  )
}
