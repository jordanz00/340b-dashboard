# How to Connect the Mobile Dashboard to the Data Warehouse

**Who this is for:** Anyone setting up the live data connection — you do not need to be a data engineer.

**What this does:** Right now, the mobile dashboard reads numbers from a local file (`state-data.js`). This guide explains how to switch it to pull data automatically from the HAP data warehouse, so numbers update without anyone editing code.

---

## Step 1: Confirm you have a JSON API endpoint

Before connecting the dashboard, IT needs to publish a **JSON API endpoint** — a URL that returns the dashboard's data in a format the app understands.

**What to ask IT:**

> "Can you publish a read-only JSON endpoint that returns the same data shape as our `state-data.js` file? It should include STATE_340B (state law data), STATE_NAMES, and CONFIG objects. We need it refreshed on a schedule — ideally every 15 minutes from the Gold layer."

The endpoint URL will look something like:
```
https://api.haponline.org/340b/dashboard-data.json
```

---

## Step 2: Add one line to connect

Once IT gives you the endpoint URL, add this one line of JavaScript anywhere after the page loads. The easiest place is in a `<script>` tag at the bottom of `340b-mobile.html`:

```html
<script>
  DataLayer.connectAPI("https://api.haponline.org/340b/dashboard-data.json");
</script>
```

Replace the URL with the real one from IT.

**What this does:**
- Switches the dashboard from "Static File" mode to "Live — Warehouse API" mode
- Immediately fetches fresh data from the endpoint
- Sets up automatic polling every 15 minutes
- The green dot on the "Data Connection" card in the More tab will light up

---

## Step 3: Verify the connection

1. Open the mobile dashboard on your phone or in a browser
2. Scroll to the **More** tab
3. Look for the **Data Connection** card
4. It should show:
   - **Green dot** (instead of gray)
   - **"Live — Warehouse API"** (instead of "Static File")
   - **Last updated** timestamp that matches the current time

---

## Step 4 (Optional): Power BI Embedded Reports

If your team wants to embed interactive Power BI reports directly into the dashboard:

1. IT provides a Power BI embed configuration (report ID, embed URL, and access token)
2. Add this call instead of (or in addition to) the API connection:

```html
<script>
  DataLayer.connectPowerBI({
    type: "report",
    id: "your-report-id-here",
    embedUrl: "https://app.powerbi.com/reportEmbed?reportId=...",
    accessToken: "your-token-here"
  });
</script>
```

**Note:** This also requires loading Microsoft's Power BI JavaScript SDK. IT can help with that.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Gray dot, still says "Static File" | The `connectAPI()` line isn't running. Check that it's after `data-layer.js` loads. |
| Green dot but numbers look wrong | The JSON endpoint isn't returning the expected format. Compare its output to `state-data.js`. |
| Numbers not updating | Check that the endpoint is being refreshed by IT's pipeline. The dashboard polls every 15 minutes. |
| "Power BI JS SDK not loaded" message | The PBI SDK script tag needs to be added to the HTML. Ask IT for the correct `<script>` tag. |

---

## Related documents

- [DATA-DICTIONARY.md](DATA-DICTIONARY.md) — what every field means and where it maps in Power BI
- [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) — full Power BI readiness steps
- [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) — technical field-to-column mapping
