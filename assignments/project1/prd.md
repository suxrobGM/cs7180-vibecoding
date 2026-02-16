# Vibe Playlist — Product Requirements Document

**Version:** 1.0
**Last Updated:** February 15, 2026
**Status:** Draft
**Author:** Engineering Team

---

## 1. Executive Summary

Vibe Playlist is a mood-driven music discovery web application that translates natural language emotional descriptions into curated song recommendations. Users describe how they want to feel — "rainy Sunday morning with coffee and a good book" or "electric energy before a big presentation" — and the app returns 8–12 contextually matched songs, each with a human-readable explanation of why it fits. Recommendations link directly to Spotify for instant playback.

The product closes the gap between how people _feel_ music and how existing platforms _categorize_ it. By using an LLM (Claude AI) as the intelligence layer, Vibe Playlist maps rich emotional and situational context to musical attributes that genre tags and collaborative filtering cannot capture.

---

## 2. Problem Statement

Music listeners frequently know how they want to feel but cannot translate that into effective search queries on existing platforms. Current music discovery tools rely on genre labels, artist similarity, and listening history — none of which capture the rich emotional and situational context that defines what someone actually wants to hear.

**The result:**

- Users waste time scrolling through generic playlists that don't match their current state of mind.
- Listeners fall into repetitive loops, hearing the same recommendations on repeat.
- Contextually perfect music exists but is never surfaced because there's no emotional search interface.

---

## 3. Target Users

| Persona               | Description                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **The Mood Listener** | Chooses music based on feeling, not genre. Searches for "chill vibes" or "angry workout music" and is frustrated by literal keyword results. |
| **The Explorer**      | Wants to break out of algorithmic bubbles and discover new artists, but needs a low-effort entry point.                                      |
| **The Curator**       | Builds playlists around themes or moments (road trips, dinner parties, study sessions) and values intentional selection over shuffle.        |

---

## 4. Product Goals & Success Metrics

### 4.1 Goals

1. Deliver emotionally resonant music recommendations from a single natural language input.
2. Build user trust through transparent, per-song reasoning.
3. Provide a frictionless path from discovery to playback via Spotify deep links.
4. Create a persistent, revisitable library of mood-based playlists.

### 4.2 Key Metrics

| Metric                              | Target                       |
| ----------------------------------- | ---------------------------- |
| Average recommendations per session | ≥ 1.5 queries                |
| Spotify link click-through rate     | ≥ 40% of displayed songs     |
| Playlist save/bookmark rate         | ≥ 25% of generated playlists |
| Return user rate (7-day)            | ≥ 30%                        |

---

## 5. Feature Specifications

### 5.1 Core: Mood-to-Music Input (P0)

**Description:** A prominent text input that accepts free-form natural language descriptions of mood, situation, energy, or atmosphere.

**Requirements:**

- Single text input field with placeholder examples that rotate or inspire (e.g., _"Describe your vibe… 'late night drive through the city'"_).
- Supports descriptions ranging from a few words to 2–3 sentences.
- Submit via button click or Enter key.
- Input validation: minimum 3 characters, maximum 500 characters.
- Loading state with animated indicator while the LLM processes.
- Graceful error handling with retry capability.

### 5.2 Core: Song Recommendations Display (P0)

**Description:** A visually rich list of 8–12 song recommendations returned per query.

**Requirements:**

- Each song card displays: song title, artist name, and a 1–2 sentence contextual explanation of why it matches the described mood.
- Each card includes a "Listen on Spotify" button/link that opens the corresponding Spotify track page (via `https://open.spotify.com/search/{encoded_query}` as a fallback when direct track URIs are unavailable).
- Cards are displayed in a scrollable, vertically stacked layout on mobile and a responsive grid/list on desktop.
- The original mood description is displayed as a header/label above the results.
- Empty state if the LLM returns no results, with a prompt to try a different description.

### 5.3 Core: LLM Integration — Claude AI (P0)

**Description:** The intelligence layer that maps emotional language to musical attributes and generates recommendations.

**Requirements:**

- Uses the Anthropic Messages API (`claude-sonnet-4-20250514` model) via the in-artifact API capability.
- System prompt is curated to: interpret emotional/situational language, map it to musical dimensions (tempo, energy, valence, instrumentation, lyrical themes, genre tendencies), return structured JSON with song title, artist, and mood-match explanation.
- Response format is strictly enforced via prompt engineering (JSON-only output).
- Handles ambiguous or very short inputs gracefully by inferring reasonable musical context.
- Rate limiting awareness: queue or throttle requests if needed.

**Prompt Design Principles:**

- The system prompt establishes Claude as a music curator with deep knowledge across genres, decades, and cultures.
- Recommendations should span a range of popularity levels — not just mainstream hits.
- The explanation for each song must reference specific musical or lyrical qualities, not generic filler.
- Diversity: avoid recommending more than 2 songs by the same artist per query.

### 5.4 Playlist History — Persistent Storage (P0)

**Description:** Full history of past mood searches and their generated playlists, persisted across sessions.

**Requirements:**

- Every generated playlist is automatically saved with: the mood description (as title), timestamp, and the full list of recommended songs.
- History view accessible from the main navigation, displayed in reverse chronological order.
- Each saved entry is tappable/clickable to revisit and view the full playlist.
- Users can delete individual entries from history.
- Storage via the artifact persistent storage API (`window.storage`).
- Storage key schema: `playlist:{timestamp_id}` for individual playlists, `playlist_index` for the ordered list of all playlist IDs.

### 5.5 Genre/Artist Preference Filters (P1)

**Description:** Optional filters that let users bias recommendations toward or away from specific genres or artists.

**Requirements:**

- Accessible via a collapsible "Preferences" panel below the main input or as a settings section.
- Users can add preferred genres from a predefined list (e.g., Indie, Electronic, Hip-Hop, Jazz, Classical, R&B, Rock, Pop, Latin, Ambient, Folk, Metal).
- Users can add up to 5 "favorite artists" as text input (used as style anchors in the LLM prompt).
- Users can add up to 5 "excluded artists" (artists they don't want recommended).
- Preferences are persisted in storage (`user_preferences` key) and injected into the LLM prompt context.
- Preferences are optional — the app works without any preferences set.

### 5.6 Playlist Naming (P1)

**Description:** Users can rename saved playlists with a custom title instead of using the raw mood description.

**Requirements:**

- Each playlist defaults to using the mood description as its title upon creation.
- In the history view and the playlist detail view, the title is editable via an inline edit interaction (tap/click the title to edit).
- Title max length: 80 characters.
- If the user clears the custom title, it reverts to the original mood description.
- The original mood description is always preserved and displayed as secondary text beneath the custom title.
- Renamed playlists update in storage immediately.

### 5.7 Shareable Playlist Links (P1)

**Description:** Users can share a generated playlist with others via a copyable link.

**Requirements:**

- Each playlist has a "Share" button that encodes the playlist data (mood description + song list) into a URL-safe format.
- Shared data is encoded into the URL hash/query parameters (base64 encoded JSON) so no server is required.
- When a user opens a shared link, the app renders the playlist in a read-only view with all song cards and Spotify links intact.
- Share link includes a "Create your own vibe" CTA to encourage new users to try the input.
- Copy-to-clipboard functionality with a brief confirmation toast.

---

## 7. Technical Architecture

### 7.1 Runtime Environment

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| Framework      | React 19 (single-file artifact)                    |
| Styling        | Tailwind CSS v4 (utility classes only)             |
| LLM Backend    | Anthropic Messages API (in-artifact fetch)         |
| Persistence    | Artifact Persistent Storage API (`window.storage`) |
| External Links | Spotify Web URLs (`open.spotify.com`)              |
| Deployment     | Claude Artifact (rendered in claude.ai)            |

### 7.2 Data Model

```
UserPreferences {
  preferred_genres: string[]        // e.g., ["Indie", "Jazz"]
  favorite_artists: string[]        // max 5
  excluded_artists: string[]        // max 5
}

Playlist {
  id: string                        // timestamp-based unique ID
  mood_description: string          // user's original input
  custom_title: string | null       // user-defined name (nullable, defaults to mood_description)
  created_at: string                // ISO timestamp
  songs: Song[]                     // 8-12 items
}

Song {
  title: string
  artist: string
  explanation: string               // 1-2 sentence mood-match reason
  spotify_url: string               // constructed search/track URL
}
```

### 7.3 Storage Key Schema

| Key                | Type                   | Shared | Description                   |
| ------------------ | ---------------------- | ------ | ----------------------------- |
| `playlist_index`   | JSON (string[])        | No     | Ordered array of playlist IDs |
| `playlist:{id}`    | JSON (Playlist)        | No     | Individual playlist data      |
| `user_preferences` | JSON (UserPreferences) | No     | Genre/artist prefs            |

### 7.4 LLM Prompt Architecture

The system prompt will instruct Claude to act as an expert music curator and will include:

- Role definition: emotionally intelligent music curator with encyclopedic knowledge.
- Input interpretation: parse the mood description for emotional tone, energy level, situational context, and temporal qualities.
- Output contract: return only valid JSON matching the Song schema, with 8–12 entries.
- Quality constraints: diverse artists, mix of well-known and deep cuts, no more than 2 songs per artist, explanations must cite specific musical or lyrical qualities.
- Preference injection: dynamically append user preferences (genres, liked/excluded artists) when available.

### 7.5 Spotify Integration

Since the app runs as a client-side artifact without Spotify API credentials, song links will use the Spotify search URL pattern:

```
https://open.spotify.com/search/{encodeURIComponent(songTitle + " " + artistName)}
```

This opens Spotify's search with the song pre-filled, which reliably surfaces the correct track as the top result. No API key, OAuth, or developer app registration is required.

---

## 8. Design Specifications

### 8.1 Visual Identity

- **Theme:** Dark mode, Spotify-inspired aesthetic.
- **Background:** Deep dark tones (`#0a0a0a` to `#121212` range).
- **Primary Accent:** Vibrant green (`#1DB954` — Spotify green) or a unique brand gradient (green → teal).
- **Text:** White (`#FFFFFF`) for primary, muted gray (`#A0A0A0`) for secondary.
- **Cards:** Subtle elevated surfaces (`#1a1a2e` to `#16213e` range) with soft borders or glow effects.
- **Typography:** System font stack, clean sans-serif hierarchy.

### 8.2 Responsive Behavior

| Breakpoint            | Layout                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| Mobile (< 640px)      | Single column, full-width cards, bottom navigation, stacked input + button |
| Tablet (640px–1024px) | Single column with wider cards, side padding                               |
| Desktop (> 1024px)    | Centered max-width container (~720px), comfortable card widths             |

### 8.3 Interaction & Motion

- Smooth loading animation while awaiting LLM response (pulsing waveform or gradient shimmer).
- Song cards animate in with a staggered fade-up on results load.
- Micro-interactions on hover/tap for buttons and cards.
- Toast notifications for share link copy, save confirmation, and error states.

---

## 9. Edge Cases & Error Handling

| Scenario                             | Handling                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Empty or too-short input (< 3 chars) | Inline validation message; disable submit button                           |
| Very long input (> 500 chars)        | Character counter with soft warning; truncate at 500                       |
| LLM returns invalid/unparseable JSON | Retry once automatically; show friendly error with manual retry            |
| LLM API timeout or network failure   | "Something went wrong" message with retry button                           |
| LLM returns fewer than 8 songs       | Display what's returned with a note: "We found a few tracks for this vibe" |
| Shared link contains corrupted data  | Gracefully fall back to home screen with error toast                       |
| Storage quota exceeded               | Prompt user to clear old playlists from history                            |
| Offensive or nonsensical input       | LLM is expected to handle gracefully; no client-side content filter needed |

---

## 10. Scope & Prioritization

### V1 Scope (This Release)

| Priority | Feature                                       | Status   |
| -------- | --------------------------------------------- | -------- |
| P0       | Mood text input & submission                  | In scope |
| P0       | LLM-powered song recommendations (8–12 songs) | In scope |
| P0       | Per-song mood-match explanations              | In scope |
| P0       | Spotify link per song                         | In scope |
| P0       | Responsive dark-mode UI (mobile + desktop)    | In scope |
| P0       | Persistent playlist history with revisit      | In scope |
| P1       | Genre/artist preference filters               | In scope |
| P1       | Playlist naming (editable titles)             | In scope |
| P1       | Shareable playlist links (URL-encoded)        | In scope |

### V2 Candidates (Future)

| Feature                             | Notes                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mood history visualization / trends | Heatmap or timeline of mood patterns over time                                                            |
| Spotify inline preview player       | Embed ~30s previews; blocked by cross-browser CSP issues — revisit when Spotify stabilizes iframe support |
| Playlist export to Spotify          | Requires Spotify OAuth; significant scope increase                                                        |
| Collaborative playlists             | Multiple users contribute moods to a shared playlist                                                      |
| Mood-based ambient backgrounds      | Dynamic visuals/colors that shift with mood                                                               |
| Recommendation feedback loop        | Thumbs up/down on songs to refine future LLM prompts                                                      |

---

## 11. Assumptions & Constraints

- The app runs entirely as a single-file React artifact within Claude's artifact environment.
- No backend server, database, or third-party auth is available.
- Anthropic API is called directly from the artifact (API key handled by the environment).
- Persistent storage is limited to the artifact storage API (`window.storage`) with a 5MB per-key limit.
- Spotify links are search-based (not direct track URIs) since we don't have Spotify API access.
- `localStorage` and `sessionStorage` are **not available** in the artifact environment; all persistence uses `window.storage`.
- Tailwind CSS is limited to pre-defined utility classes (no custom Tailwind config or compiler).

---
