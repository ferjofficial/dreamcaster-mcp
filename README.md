# dreamcaster-mcp

Bridge personal AI assistants to [Dreamcaster](https://dreamcaster.xyz), the human-verified, privacy-first lucid dreaming platform for sovereign individuals. Document dreams, receive interpretations, generate visuals, track recurring patterns, and more.

Tell your assistant about last night's dream. It runs Dreamcaster's proprietary interpretation engine, renders 5 candidate dreamscapes for you to choose from, lets you finalize the title and choose **Private** or **Public** before publishing, and searches your past dreams for recurring patterns.

## What you need

- An active Dreamcaster membership. The $5/month fee keeps the archive human: every dream in it comes from a paying person, not a bot.
- An agent key. Create one at [dreamcaster.xyz/settings](https://dreamcaster.xyz/settings) under Agent Bridge. It starts with `dc_live_`.
- Node.js 18 or later.

## Claude Desktop

Open `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows) and add:

```json
{
  "mcpServers": {
    "dreamcaster": {
      "command": "npx",
      "args": ["-y", "dreamcaster-mcp"],
      "env": {
        "DREAMCASTER_API_KEY": "dc_live_your_key_here"
      }
    }
  }
}
```

Restart Claude Desktop.

## Cursor

Add the same `dreamcaster` block to `~/.cursor/mcp.json`.

## Tools

| Tool | What it does |
| --- | --- |
| `interpret_human_dream` | Runs Dreamcaster's proprietary interpretation engine on a dream narrative and suggests a poetic title |
| `create_dreamcast_draft` | Renders 5 candidate dreamscapes via Dreamcaster's visual engine for you to choose from |
| `publish_dreamcast` | Finalizes your chosen artwork, title, and explicit privacy choice (**Private** vault vs **Public** dreamcast), and returns the Dreamcast card + permalink |
| `query_subconscious_memory` | Searches your journal by keyword, symbol or mood, and returns your top recurring motifs |

Interpretation and image renders share the same daily limit as the Dreamcaster app.

## Privacy

This package is a small bridge. It forwards each message to `https://dreamcaster.xyz/api/mcp` with your key and prints the response. It stores nothing and has no dependencies.

- **Dreamcaster's pledge:** When you publish with `isPrivate: true`, your dream is hidden from public feeds, isolated to your account, and never sold or used to train models.
- **External AI host vs. Native Dreamcaster:** When you talk to an external assistant (Claude, ChatGPT, Grok, Muse, Dot), that provider processes and stores whatever dream text you type or speak into their chat under their own privacy and training policy. When you want **zero external AI chat middlemen**, hardware-backed **Passkey Vault** isolation, and **Local Offline Vault** storage, log sensitive dreams directly inside the [Dreamcaster app](https://dreamcaster.xyz).

To revoke agent access at any time, delete the key in Dreamcaster settings. See [PRIVACY_ARCHITECTURE.md](./PRIVACY_ARCHITECTURE.md) for full details on token hashing, stealth addresses, and privacy boundaries.

## Options

| Variable | Default | Purpose |
| --- | --- | --- |
| `DREAMCASTER_API_KEY` | none | Your `dc_live_` agent key |
| `DREAMCASTER_MCP_URL` | `https://dreamcaster.xyz/api/mcp` | Override for local development (`http://localhost:3000/api/mcp`) |
