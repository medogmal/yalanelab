# YallaNelab Platform Development Guide

This document outlines the architectural and strategic guidelines for the YallaNelab gaming platform.

## 1. Architecture Overview

### Tech Stack
*   **Framework:** Next.js 14+ (App Router)
*   **Styling:** Tailwind CSS + Framer Motion
*   **State:** Zustand (Client)
*   **Language:** TypeScript (Strict)

### Directory Structure
```
src/
  app/              # Next.js Routes
  components/       # React Components
    platform/       # Shared UI (Hub, Store, Chat)
    [game]/         # Game-specific UI (e.g., baloot/)
  lib/              # Business Logic
    platform/       # Stores, Configs, Utils
    [game]/         # Pure Game Rules
```

## 2. Core Systems

### Authentication & User
*   **Guest Mode:** Always allow guest access for quick play.
*   **Persistent Profile:** Store user progress (XP, Coins) in `localStorage` or Database.
*   **Avatar System:** Use a unified avatar service (e.g., DiceBear) consistent across all games.

### Unified Store & Inventory
*   **Single Source of Truth:** `usePlatformStore` manages all items.
*   **Item Types:** Define clear types (`avatar`, `skin`, `currency`).
*   **Hot-Swapping:** Equipping an item should immediately reflect in all open games.

### Localization (i18n)
*   **Strategy:** Client-side translation using a central dictionary (`translations.ts`).
*   **Direction:** Root layout must toggle `dir="rtl"` based on language state.
*   **Fonts:** Use fonts that support both Latin and Arabic beautifully (e.g., Cairo, Tajawal).

## 3. Scalability & Security

### Security Best Practices
*   **Validation:** Never trust client input for game results. Validate on server.
*   **Rate Limiting:** Protect chat and matchmaking endpoints.
*   **Sanitization:** Sanitize user names and chat messages.

### Performance
*   **Code Splitting:** Next.js does this automatically, but lazy load heavy game components.
*   **Asset CDN:** Serve images and sounds from a CDN/static folder, optimized.

## 4. User Experience (UX)

### Navigation
*   **Hub Centric:** Users should always be able to return to the Platform Hub easily.
*   **Unified Header:** Consistent top bar with Currency, Profile, and Notifications.

### Engagement
*   **Progression:** Visual XP bars and Level Up notifications.
*   **Social:** Integrated Chat and Friend system.
*   **Live:** "Live Now" badges for active tournaments.

## 5. Maintenance

### Code Style
*   **Linting:** Run ESLint before commit.
*   **Components:** Keep components small (< 300 lines). Extract sub-components.
*   **Comments:** Comment complex game logic, but let clean code speak for itself.

---

**Deployment Checklist:**
- [ ] Build succeeds without lint errors.
- [ ] All environment variables are set.
- [ ] Database migrations applied (if any).
- [ ] Smoke test on Critical Paths (Login -> Play -> End).
