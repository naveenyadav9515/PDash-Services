# Phase 4: Notifications & Real-Time Sync (Backend)

> WebSockets for cross-device syncing and Web Push API for notifications.

---

## Epic 4.1: Real-Time Infrastructure

### Feature 4.1.1: WebSocket Server
- [ ] Install `socket.io` and attach to Express server
- [ ] Implement socket authentication using JWT
- [ ] Manage user rooms (e.g., join room `user_<userId>`) for targeted broadcasting
- [ ] Implement Presence Tracking: update user's `isOnline` status and `lastActive` timestamp upon socket connect/disconnect

### Feature 4.1.2: Event Broadcasting
- [ ] Create `services/event-bus.service.js`
- [ ] Broadcast real-time events on entity mutations (e.g., `MODULE_DATA_UPDATED`) to keep all user devices in sync

---

## Epic 4.2: Notification System

### Feature 4.2.1: Notification Model & API
- [ ] Create `models/notification.model.js` (Fields: userId, title, body, readStatus, type, actionUrl)
- [ ] `GET /api/v1/notifications` (Paginated)
- [ ] `PATCH /api/v1/notifications/mark-read`

### Feature 4.2.2: Admin-to-User Messaging API
- [ ] `POST /api/v1/notifications/admin-send` (Admin only)
- [ ] Allow admin to send real-time chat messages, alerts, or system warnings directly to a specific user or broadcast to all online users via sockets

### Feature 4.2.3: Web Push API
- [ ] Set up VAPID keys for Web Push API
- [ ] Create `models/push-subscription.model.js` to store device endpoints
- [ ] `POST /api/v1/notifications/subscribe`
