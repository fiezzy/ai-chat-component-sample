# Hilbi IQ chat

A streaming AI chat for the Hilbi AI Frontend Engineer assignment: an assistant that explains health information, built with Next.js and the Vercel AI SDK.

## Run

```bash
pnpm install
pnpm dev
```

- http://localhost:3000 — the chat.
- http://localhost:3000/?demo=1 — the chat with a panel that forces a scenario.

## What you can try

- **Suggestions** on the empty screen each lead to a different answer: a lab result, a preparation checklist, a safety notice and a refusal.
- **Slash commands.** Type `/` in the input to play a scenario: `/slow`, `/dropped`, `/mid_stream_error`, `/rate_limited`, `/unavailable`, `/empty`.
- **Recovery.** After a broken answer, "Try again" continues it from where it stopped.
- **Personal data.** Type an email, phone or birth number: the input warns, and the message is masked before sending.
- **Stop** an answer while it streams, and **follow-up questions** after a finished one.

## Commands

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Dev server                         |
| `pnpm build`     | Production build                   |
| `pnpm start`     | Serve the production build         |
| `pnpm test`      | Unit and component tests           |
| `pnpm typecheck` | TypeScript check                   |
| `pnpm lint`      | ESLint                             |
| `pnpm format`    | Prettier                           |
| `pnpm icons`     | Generate icon components from SVGs |

## Structure

```
src/
  app/          Routes. app/iq/route.ts serves POST /iq.
  features/
    Chat/       The chat: useChat from the AI SDK, messages, input, generative UI.
    Layout/     The frame every page shares: header and main area.
    DemoPanel/  The chat with mock scenario controls.
  shared/
    api/        The /iq contract and the chat transport.
    constants/  API routes, links, demo scenarios.
    lib/        Shared logic, such as privacy masking.
    ui/         UI primitives and generated icons.
    assets/     Styles, design tokens and icon SVGs.
  server/       Mock /iq gateway: streamText over a mock model.
  __tests__/    Tests.
```

Each component folder can hold its own `components/`, `hooks/`, `lib/` and `constants/`. Code lives at the level of the component that uses it, and child components are imported through `components/index.ts`.

Icons are SVG files in `shared/assets/icons`; run `pnpm icons` after adding one.
