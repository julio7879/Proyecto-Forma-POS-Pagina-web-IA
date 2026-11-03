# Workspace Connections and Integrations

Discover, classify, and activate GitHub, API-key, and OAuth integrations in a Stitch Loop workspace.

## 1. Discover and Classify the Integration

1. Verify the target workspace with `stitch get workspace <WORKSPACE_ID>` (or rely on `.stitch.json` / `STITCH_WORKSPACE`).
2. Search the provider catalog with `stitch find connections --filter 'displayName="*<TARGET>*"'` (or list available integrations with `stitch connect --list`).
3. Route to one of three provider classes:
   - **Native VCS (`github`)**: Loop's first-class source control platform (not in the third-party catalog), managed via GitHub App / OAuth permissions at the account and workspace levels.
   - **Built-in Zero-Auth & Custom MCP Providers**: built-in providers that require no browser consent (`authType: "NONE"` or `"LOAS"`, such as `stitch`, `web_search`, and internal Google MCP servers) plus custom workspace MCP servers configured via `serverUri` and optional `apiKey` or `authHeaders`.
   - **Browser OAuth & Third-Party Catalog Integrations (`type: "COMPOSIO"` or `authType: "OAUTH"`)**: third-party Composio catalog toolkits (`SLACK`, `JIRA`, `LINEAR`, `NOTION`, `ASANA`) and OAuth MCP providers requiring browser consent.

## 2. Activate by Provider Class

### Branch A: Native VCS (`github`)

1. Check account authentication and linked repositories with `stitch github status --json`, inspecting `authenticated` and `repositoriesCount`. If disconnected, guide the user to run `stitch github install`.
2. Inspect `data.repositories[]` in `stitch get workspace <WORKSPACE_ID>`.
3. If the repository is not yet paired, bind it with `stitch edit workspace <WORKSPACE_ID> --add-repo <OWNER>/<REPO> --json`.
4. Done when `stitch github status --json` reports `authenticated: true` and the target repository appears in `data.repositories[]`.

### Branch B: API Key Providers (`authType: "API_KEY"`)

1. Locate the API key in `STITCH_API_KEY`, `.stitch.json`, or `~/.gemini/.env`.
2. Upsert the connection using ambient key resolution (`stitch create connection --json '{"providerId": "stitch"}'`) or explicit credential injection (`stitch create connection --json '{"providerId": "<PROVIDER_ID>", "apiKey": "<API_KEY>"}'`).
3. Done when the response returns `success: true` and `data.state: "ACTIVE"`.

### Branch C: OAuth Providers (`authType: "OAUTH"`)

1. Initiate the connection with `stitch create connection --json '{"providerId": "<PROVIDER_ID>"}'`.
2. Inspect the response for `authorizationUrl` (for catalog toolkits, a `https://connect.composio.dev/link/<LINK_ID>` URL) and `state: "AUTH_PENDING"`. `AUTH_PENDING` only describes this response: the link was created and is waiting for sign-in. `stitch find connections` and `stitch get connection` keep showing the provider as `UNAUTHENTICATED` until consent is done.
3. Share `authorizationUrl` with the user and ask them to open it in their browser, select their team or workspace, and click **Allow**.
4. After the user completes consent, run `stitch find connections --filter 'providerId="<PROVIDER_ID>"'` and confirm `state` updated from `UNAUTHENTICATED` to `ACTIVE`.
