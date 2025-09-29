# kWh Calculator

The kWh Calculator is a React web application that helps homeowners translate a single utility bill into a long-term projection and compare it with a Sunrun solar plan. Users can toggle between supported utilities, calculate their current price per kWh, model escalations over up to twenty years, and export sharable summaries that capture both monthly bills and rate trajectories.

## Getting started

```bash
npm install
npm start
```

The project uses the standard Create React App toolchain, so `npm start` launches a hot-reloading development server, `npm test` runs the Jest-based test watcher, and `npm run build` creates a production bundle in the `build` directory.

## Core workflow

1. **Pick a utility** – The shell renders either the Southern California Edison or LADWP experience, swaps the theme accent colors, and injects that choice into the URL so the page can be refreshed or bookmarked.
2. **Enter today’s bill** – The form asks for the latest monthly charge, matching usage in kWh, and annual usage so the calculator can derive both a monthly and yearly baseline. Inputs are validated against configurable ranges with contextual helper messages.
3. **Project the utility path** – After validation, the app divides the bill by usage to determine the live kWh rate, annualizes usage, and applies the first-year escalation percentage the user specifies. That yields a projected average monthly bill that seeds the utility projection.
4. **Compare a Sunrun offer** – Providing a Sunrun monthly cost plus an escalation cap allows the calculator to build a second set of projected bills and flag whether the comparison is valid. Status feedback guides the user if more inputs are required.
5. **Review charts and summaries** – Recharts-powered visuals plot the Sunrun and utility bills together, highlight savings deltas, and surface per-kWh rates in the tooltip. A synchronized yearly breakdown powers the summary cards, the cumulative savings total, and the break-even message.

## How the projection is calculated

1. **Usage normalization** – Annual usage is parsed, validated, and converted to a monthly kWh baseline so downstream rate calculations stay realistic.
2. **Current rate discovery** – The calculator divides monthly charges by kWh usage, rounds to two decimals, and stores the result for display.
3. **First-year utility estimate** – Using the user-provided escalation percentage, the app multiplies the current annualized bill by that increase to estimate next year’s average monthly utility bill.
4. **Projection engine** – `computeProjectedBills` grows the utility bill by the first-year increase, then by an ongoing baseline rate, while the Sunrun plan compounds by its escalation percentage. Each sequence continues for the chosen horizon (default 10 years, clamped between 5 and 20). When usage data is available, the function also derives per-kWh rates and year-over-year rate changes for the tooltip and summary callouts.
5. **Savings math** – The yearly breakdown multiplies each monthly bill by 12, accumulates the difference between utility and Sunrun spend, and finds milestones such as the break-even year, peak savings, and total savings over the projection window. Those metrics feed the headline tiles, summary copy, and download export.

## Sharing and exports

- **URL state** – All meaningful form values (including projection length) are serialized into a `calculator` query parameter, enabling sharable, bookmarkable scenarios. Debounced updates prevent unnecessary history churn.
- **Clipboard helpers** – Users can copy a plain-text summary of the key metrics or copy the current share URL directly from the projection actions bar.
- **Downloadable report** – A helper builds a timestamped text file that lists headline numbers followed by the full year-by-year comparison table and triggers a client-side download.

## UI highlights

- **Responsive layout and themes** – The app tracks viewport width to adjust the layout, and it exposes a manual light/dark switch that honors stored preferences and OS defaults. The theme choice is persisted in local storage.
- **Contextual storytelling** – Animated hero copy, customizable badges, and icon-rich cards adapt their messaging based on the utility being modeled and the projection results (e.g., savings vs. added cost).

## Project structure

```
src/
├── App.js                # Shell that manages theming and utility selection
├── App.css / index.css   # Global styling
└── Components/
    └── Calculator/
        ├── calculator.js # Core calculator logic, chart rendering, sharing helpers
        └── styles.css    # Component-specific styling tokens
```

Refer to `calculator.js` for the latest business rules or when extending the projection math, because the helper utilities (constraints, defaults, serialization) live alongside the UI.
