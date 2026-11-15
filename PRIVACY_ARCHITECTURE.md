# Dreamcaster Privacy & Verification Architecture

This document outlines the verifiable privacy boundaries of Dreamcaster and the `dreamcaster-mcp` bridge while keeping Dreamcaster's proprietary interpretation engine, visual synthesis models, and anti-abuse heuristics closed-source.

---

## 1. Zero-Dependency MCP Bridge (`bin/dreamcaster-mcp.mjs`)

- **Auditable in ~120 lines:** `bin/dreamcaster-mcp.mjs` has **zero runtime npm dependencies**.
- **Stateless forwarding:** It reads JSON-RPC messages from `stdin`, forwards them over TLS (`HTTPS`) to `https://dreamcaster.xyz/api/mcp` with your `Authorization: Bearer dc_live_...` header, and writes the JSON-RPC response to `stdout`.
- **Zero local telemetry or persistence:** The bridge writes nothing to disk and phones home to no third party.

---

## 2. Scoped, Non-Custodial Agent Keys (`dc_live_`)

When you generate an Agent Bridge key at [dreamcaster.xyz/settings](https://dreamcaster.xyz/settings):

1. **One-time display & SHA-256 storage:** The raw `dc_live_...` token is shown once at creation. Dreamcaster's database stores only its `SHA-256` digest (`crypto.createHash('sha256').update(token).digest('hex')`) alongside a short prefix for display.
2. **Zero wallet key exposure:** An agent token cannot sign blockchain transactions, access your wallet keys, or modify billing settings.
3. **Instant revocation:** Deleting or rotating a key in Settings immediately invalidates the `SHA-256` hash on every `/api/mcp` and `/api/agents/v1/*` request.

---

## 3. Private vs. Public Dreamcasts (`isPrivate`)

Every dream published through `publish_dreamcast` requires an explicit `isPrivate: boolean` choice from the dreamer:

| Setting | Database & Feed Visibility | Blockchain / IPFS | Data Pledge |
| :--- | :--- | :--- | :--- |
| **`isPrivate: true`** | Hidden from all public feeds (`is_private: true, is_hidden: true`). Non-owners receive HTTP `404`. | **Never** minted onchain; **never** uploaded to IPFS. | Never sold; never used to train models. |
| **`isPrivate: false`** | Visible on the Dreamcaster stream and your profile. | Preserved gas-free on **Base Mainnet** as a soulbound `ERC-1155` token to a unique **stealth address**. | Never sold; never used to train models. |

---

## 4. External AI Assistants vs. Native Dreamcaster App

- **Using an External AI Assistant (Claude, ChatGPT, Grok, Muse, Dot):**
  - When you dictate or type a dream into a third-party AI assistant, that provider processes your chat messages under their own privacy and data-retention policies before calling the Dreamcaster MCP bridge.
- **Using the Native Dreamcaster App ([dreamcaster.xyz](https://dreamcaster.xyz)):**
  - **Zero External AI Chat Middleman:** Your journal is not stored inside a consumer chatbot's conversation history.
  - **Hardware-Backed Passkey Vault:** Lock your archive behind Face ID / Touch ID (`WebAuthn` platform authenticator inside your device's Secure Enclave).
  - **Local Offline Vault:** Record dreams offline directly into local device storage (`IndexedDB`) before syncing.
  - **PII Scrubbing:** Email addresses and phone numbers are automatically stripped before dream text is sent for AI inference.

---

## 5. Onchain Pseudonymity (Base Mainnet Soulbound Stealth Mints)

For dreams you explicitly choose to make **Public** (`isPrivate: false`):

- **Soulbound (`ERC-1155`):** Tokens are non-transferable (`safeTransferFrom` reverts onchain) and cannot be traded or financialized.
- **Unlinkable Stealth Addresses:** Each public dream mint derives a fresh, one-time stealth address so public dream NFTs cannot be linked onchain to your primary wallet or Farcaster identity (`FID`).
- **1-Click Walkaway Export:** You can export your entire archive (markdown, raw audio, interpretations, and your private stealth-address recovery index) as a ZIP bundle anytime from Settings.
