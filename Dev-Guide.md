# OneSpaceServices - Backend Development Guide

This is the developer guide for the **OneSpaceServices** API backend. The service is built with Node.js and Express, connecting to MongoDB Atlas using Mongoose.

---

## 🛠️ 1. Local Development Setup

To maintain fast feedback loops, run the dev server locally with hot-reloading using nodemon.

### Prerequisites
* **Node.js**: v20 or v24 (LTS recommended)
* **npm**: v10+

### Step-by-Step Launch
1. Create a local environment file named `.env` in this directory (`OneSpaceServices`). Do **not** commit this file to Git.
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://MrFoxDB:MrFoxDB@mrfox-db.fyatkdt.mongodb.net/OneSpaceDB?retryWrites=true&w=majority&appName=MrFox-DB
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the backend development server:
   ```bash
   npm run dev
   ```
4. Verify the backend is active:
   * **Base check**: `http://localhost:5000/api/hello`
   * **Features endpoint**: `http://localhost:5000/api/features`

### Database Seeding
To populate the database with default sample features, make a `POST` request to:
`http://localhost:5000/api/features/seed`

---

## 🐳 2. Dockerization

To compile the production build inside a container, use the provided `Dockerfile`.

### Build the Docker Image
```bash
docker build -t ghcr.io/naveenyadav9515/OneSpaceServices:latest .
```

### Push the Image to GitHub Container Registry (GHCR)
```bash
docker push ghcr.io/naveenyadav9515/OneSpaceServices:latest
```

---

## 🚀 3. Deployment on Render

When setting up your Web Service on Render:

1. **Source Image**: `ghcr.io/naveenyadav9515/OneSpaceServices:latest`
2. **Environment Variables**:
   * Add **`MONGO_URI`** with your MongoDB Atlas connection string.
3. **Health Check Path**: `/api/hello`

---

## 🔒 4. MongoDB Atlas Network Access (IP Whitelist)
Because Render's hosting servers use dynamic outgoing IPs, MongoDB Atlas will reject connections by default.
* **Fix**: In the MongoDB Atlas dashboard, navigate to **Network Access** -> **Add IP Address** -> Click **Allow Access From Anywhere (0.0.0.0/0)** -> Click **Confirm**.
