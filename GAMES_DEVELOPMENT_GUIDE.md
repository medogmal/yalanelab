# YallaNelab Games Development Guide

This guide provides comprehensive best practices and standards for developing high-quality games within the YallaNelab platform.

## 1. Visual & Graphics Standards

### Professional Asset Usage
*   **No Primitive Shapes:** Avoid using basic HTML/CSS shapes (circles/squares) for game entities. Use SVGs, custom images, or complex CSS compositions.
*   **Iconography:** Use high-quality icon libraries (e.g., Lucide React) or custom 3D assets.
    *   *Bad:* `<div>🎲</div>` (Emoji)
    *   *Good:* `<Dice3D value={6} />` (Component with proper assets)
*   **Avatars:** Use high-resolution avatar services (e.g., DiceBear) or allow custom uploads. Always frame avatars with professional borders.

### Animations & Transitions
*   **Framer Motion:** Use `framer-motion` for all UI transitions (modals, buttons, page changes).
*   **Game Physics:** For game objects (cards, tokens), use smooth spring animations (`type: "spring"`).
*   **Feedback:** Every interaction (click, score, win) must have visual feedback (particles, shake, glow).

### Theming & Skins
*   **Centralized Config:** All game visuals must be driven by the Global Store (`usePlatformStore`).
*   **Dynamic Styling:** Use utility functions (e.g., `getSkinColors(skin)`) to switch themes instantly.
*   **Asset Loading:** Preload heavy assets for skins to avoid flickering.

## 2. Performance Optimization

### Rendering
*   **React Memo:** Wrap heavy game board components with `React.memo` to prevent re-renders on timer ticks.
*   **Canvas vs DOM:** For simple 2D games (Ludo, Domino), DOM/CSS is fine. For high-particle effects, consider a Canvas overlay.
*   **Asset Optimization:** Use SVG for scalability and small file size.

### State Management
*   **Zustand:** Use `zustand` for global state (user, inventory).
*   **Refs:** Use `useRef` for high-frequency game logic (timers, game loop) to avoid React render cycles.
*   **Batched Updates:** Batch state updates where possible to minimize commit phases.

## 3. Code Quality & Architecture

### TypeScript Strictness
*   **No `any`:** Avoid `any` types. Define interfaces for all Game States and Props.
*   **Enums/Unions:** Use string unions (`"red" | "blue"`) instead of magic strings.

### Game Logic Separation
*   **Logic vs View:** Keep game rules in pure TypeScript classes (`lib/game/logic.ts`) and UI in React components (`components/game/Board.tsx`).
*   **Mocking:** Ensure game logic can run without UI for testing and bot simulation.

### Internationalization (i18n)
*   **RTL Support:** All games MUST support RTL layouts (`dir="rtl"`).
*   **Translations:** Use the central `TRANSLATIONS` object. Never hardcode text.

## 4. Networking & Multiplayer (Future Proofing)

### Architecture
*   **Authoritative Server:** The client should be a "dumb terminal". Game logic runs on the server.
*   **Optimistic UI:** Show moves immediately locally, then correct if server rejects (prevents lag feeling).
*   **Reconnection:** Handle socket disconnects gracefully with a "Reconnecting..." overlay.

## 5. Accessibility & UX

### Sound Design
*   **SFX:** Add subtle sounds for moves, turns, and wins.
*   **Toggle:** Always provide a mute button.

### Mobile First
*   **Touch Targets:** Buttons must be large enough for thumbs (min 44px).
*   **Responsive:** Game boards must scale to fit mobile screens without scrolling (`max-w-full aspect-square`).

---

**Checklist for New Features:**
- [ ] Is it localized (Ar/En)?
- [ ] Does it have animations?
- [ ] Is it responsive?
- [ ] Are assets professional (no emojis)?
- [ ] Is state managed correctly?
