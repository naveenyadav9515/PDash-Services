# Phase 5: File Storage & Media Management (Backend)

> Handling file uploads (e.g., receipts, avatars) via Cloud Storage.

---

## Epic 18.1: File Upload Infrastructure

### Feature 18.1.1: Multer Setup
- [ ] Configure `multer` middleware for multipart/form-data parsing
- [ ] Add file validation (size limits, allowed mime types like jpg/png/pdf)

### Feature 18.1.2: Cloud Storage Integration
- [ ] Create `services/storage.service.js`
- [ ] Integrate with Cloud Provider (AWS S3, Google Cloud Storage, or Cloudinary)
- [ ] Implement file upload, retrieval, and secure deletion functions

### Feature 18.1.3: Upload API
- [ ] `POST /api/v1/media/upload` — Generic endpoint returning a public URL
- [ ] Link uploaded file URLs to user profiles or specific module data (e.g., attaching a receipt to an expense)
