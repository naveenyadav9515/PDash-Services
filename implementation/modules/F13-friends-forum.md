# Module Plan: Friends & Forum (F13)

## Core Principle
**Strictly Opt-In Social Connectivity.**
The platform is primarily a personal dashboard. All social features (discovery, friends, and forums) are disabled by default to protect privacy. Users must explicitly opt-in to become visible to others.

---

## 1. Social Discovery ("Make Friends")

### Opt-In Mechanism & Granular Privacy
*   **Default State:** Hidden/Private.
*   **Toggle:** `[ ] Allow other users to find me and send friend requests`.
*   **Visibility Controls:** If opted-in, users get granular control over what specific profile elements are visible to the community vs. accepted friends.
*   **Strict Default Visibility:** By default, *only* the user's Name and Bio message are displayed to others in the "Community Directory". All other data (email, stats, workspaces) remains strictly hidden unless explicitly toggled on by the user.

### Friend Request Flow
*   **Directory View:** List of all opted-in users. Includes a search bar.
*   **Actions:**
    *   Send Request
    *   Accept / Decline Request
    *   Block User
*   **Spam Prevention:** Users are hard-capped at a maximum of 20 active "Pending" outbound requests to prevent network abuse.
*   **Connections Model:** Maintains a `Connection` schema tracking `status` (pending, accepted, blocked).

---

## 2. Real-Time Chat

### 1-on-1 Messaging
*   Once a friend request is accepted, users can message each other.
*   **Infrastructure:** Heavily leverages the **Phase 17 WebSocket** implementation for instantaneous, real-time message delivery without refreshing.
*   **Media Capabilities:** Initially restricted to **Text and Emojis only**. The database schema will support image/video payloads, but the UI upload buttons will be disabled by a feature flag until server storage limits are assessed.
*   **UI Elements:**
    *   Chat list with unread indicators.
    *   Active presence (Green dot) showing if the friend is currently online.
    *   Typing indicators.

---

## 3. Community Forum & Posts

### Global Public Feed
*   A centralized space where opted-in users can share articles, tips, or lifestyle updates.
*   **User Capabilities:**
    *   Create a Post (Rich text/Emojis). *Media uploads disabled by default feature flag.*
    *   **Anonymous Posting:** Toggle to post without revealing profile data, enabling safe discussion of sensitive topics (e.g., financial advice).
    *   Like and Comment on posts.
    *   **Community Reporting:** "Report to Admin" button on posts, comments, and user profiles to instantly flag abusive behavior.

### Admin Capabilities
*   **Official Announcements:** Admins can publish posts that are visually distinct (e.g., "Pinned" or marked "Official Info").
*   **Moderation:** Admins can delete posts, lock comments, or ban users from the forum to maintain a healthy community environment.
