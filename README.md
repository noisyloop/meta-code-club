# Code Club Hub

A web app for running a coding club: keep track of members, weekly challenges, member projects and
meetups, all in one place. Built with [Astryx](https://astryx.atmeta.com), Meta's open source design
system, on React 19, Vite and TypeScript.

> No backend needed. Data is saved in your browser's `localStorage` and comes pre-loaded with demo
> content (12 members, 6 challenges, 20 submissions, 8 projects, 4 meetups).

## Features

| Page | What you can do |
| --- | --- |
| **Dashboard** | See the next meetup, active members, open challenges and shipped projects at a glance, plus an "Upcoming" list of meetups and challenge deadlines. |
| **Members** | Sort and filter (name, skill level, language). Open a member to see their projects, submissions, attendance streak and mentor. Add, edit and delete members. |
| **Challenges** | Table with difficulty badges, due dates and submission counts. Each challenge shows its prompt, hints that reveal one at a time on click, and who has completed it. |
| **Projects** | Card or table view with a status filter (idea, building, shipped). Detail pages link to the repo and live demo and list the tech stack. |
| **Meetups** | Upcoming and past meetups, a 3-step scheduling wizard (date and topic, host and agenda, review), and a check-in view for marking attendance. |

Every list has add, edit and delete with validation, empty states, and loading skeletons. The app works
on a phone, supports light, dark and system color modes, and uses Astryx's built-in accessibility
(keyboard support, labelled controls, focus handling on navigation).

## Getting started

Requires Node.js 22 or newer.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other commands:

```bash
npm test             # unit tests
npm run build        # typecheck + production build into dist/
npm run preview      # serve the production build
npm run astryx -- component --list   # browse Astryx components, templates and docs
```

To reset the demo data, use the "Reset demo data" button on the error screen, or clear the site's
`localStorage` and reload.

## How it's built

- **UI:** `@astryxdesign/core` (canary) with the `neutral` theme. Astryx ships prebuilt CSS; imports go in
  the order `reset.css`, `astryx.css`, then the theme (see `src/main.tsx`).
- **Styling of our own code:** StyleX via `@stylexjs/unplugin` (compiles only `src/`).
- **Routing:** React Router. `LinkProvider` plus `src/components/RouterLink.tsx` make Astryx links and
  nav items navigate client-side.
- **Dark mode:** `<Theme mode>` with a Light / System / Dark toggle, remembered in `localStorage`.
- **Data layer:** `src/data/store.ts` is the only code that touches `localStorage`. Pages talk to a small
  async `Store` interface (`list`, `get`, `create`, `update`, `remove`), so it can be swapped for a real
  backend by changing `getStore()`. Rows read back from storage are shape-checked (`src/data/guards.ts`).
- **Validation:** pure functions in `src/data/validation.ts`, shared by every form and unit-tested.
- **Performance:** every page is lazy-loaded, so the heavy Markdown renderer only loads on a challenge page.

## Project structure

```
src/
  App.tsx                 app shell, navigation, routes
  data/                   types, seed data, store, guards, validation, hooks, selectors
  components/             shared pieces (page layout, badges, loading and error states, link adapter)
  lib/                    small helpers (dates, safe URLs)
  pages/                  dashboard/ members/ challenges/ projects/ meetups/
docs/security-review.md   security review notes
```

## Data model

- **Member:** name, skill level (beginner, intermediate, advanced), languages, joined date,
  attendance streak, optional mentor.
- **Challenge:** title, prompt (Markdown), difficulty (easy, medium, hard), due date, hints.
- **Submission:** challenge, member, repo URL, submitted date.
- **Project:** owner, title, description, tech stack, repo URL, optional demo URL,
  status (idea, building, shipped).
- **Meetup:** date, topic, host, agenda, attendees.

Deleting a member also deletes their projects and submissions. Deleting a challenge deletes its
submissions. A member who hosts a meetup can't be deleted until the host is changed.

## Security

The app has no server, accounts or secrets. User text is rendered through React, links are limited to
http(s), stored data is validated on read, and the production build ships a Content Security Policy.
Details and known trade-offs are in [docs/security-review.md](docs/security-review.md).

## License

MIT. See [LICENSE](LICENSE).
