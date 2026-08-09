# 💖 Duo Chat - Private Real-Time Couple Chat App

A minimal, elegant, mobile-friendly real-time chat web application built specifically for two people. Requires no account registration or login. Users connect using a shared secret room code or invite link.

![Duo Chat Banner](https://img.shields.io/badge/Privacy-End--to--End-pink?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Backend-Supabase%20%2F%20Firebase-emerald?style=for-the-badge)
![Deployment](https://img.shields.io/badge/Deploy-Vercel%20%2F%20Netlify-blue?style=for-the-badge)

---

## ✨ Features

- 🔒 **Zero Registration**: No email, phone number, or password required. Join with just a nickname and a secret room code.
- 🔗 **1-Click Shareable Links**: Share `https://your-app.vercel.app/?room=secret-code` for instant connection.
- ⚡ **Instant Real-Time Messaging**: Messages and photos sync in milliseconds across devices.
- 📸 **Photo Sharing**: High-resolution image uploads with thumbnail preview bar and full-screen Lightbox view.
- 🟢 **Live Online Presence**: Real-time status indicator showing when your partner is Online or Offline.
- 🌙 **Modern Dark Mode Aesthetics**: Glassmorphic UI with animated glowing backgrounds and customizable themes.
- 📦 **100% Free Serverless Architecture**: Easy to deploy for free on Vercel or Netlify with Supabase or Firebase as the backend.

---

## 🛠️ Project Structure

```
duo-chat/
├── index.html        # Clean, semantic HTML5 structure with dark mode UI
├── styles.css        # Vanilla CSS design system (Glassmorphism, flexbox, animations)
├── app.js            # Modular client JS (Supabase Realtime, Storage, Presence, DOM)
├── server.js         # Node.js Express & Socket.io server (for local testing fallback)
├── package.json      # Dependencies and scripts (Vite, Supabase, Firebase)
├── vite.config.js    # Vite build configuration
├── vercel.json       # 1-Click Vercel deployment config
├── netlify.toml      # 1-Click Netlify deployment config
└── README.md         # Full setup and deployment guide
```

---

## 🚀 Step-by-Step Free Backend Setup

### Option A: Supabase (Recommended - 2 Minutes Setup)

1. **Create a Free Account & Project**:
   - Go to [supabase.com](https://supabase.com) and click **Start your project** (Free plan).
   - Enter a Project Name (e.g., `duo-chat-db`) and a database password.

2. **Set Up Image Storage**:
   - In the Supabase Dashboard, click on **Storage** in the left sidebar.
   - Click **Create a new bucket**.
   - Name the bucket: `duo-photos`.
   - Toggle **Public bucket** to **ON** (so photos can be viewed directly).
   - Click **Save**.

3. **Copy API Credentials**:
   - Go to **Project Settings** (gear icon) -> **API**.
   - Copy your **Project URL** (e.g. `https://xyzcompany.supabase.co`).
   - Copy your **anon / public key**.

4. **Connect in Duo Chat**:
   - Open Duo Chat in your browser.
   - Click the **Gear (Settings)** icon in the header.
   - Select **Supabase** as the provider.
   - Paste your **Supabase URL** and **Anon Key**.
   - Click **Save Settings**!

---

### Option B: Firebase (Alternative)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a free project.
2. Click **Add App** -> **Web app (`</>`)**.
3. Enable **Firestore Database** (start in Test mode).
4. Enable **Firebase Storage** (start in Test mode).
5. Copy your `firebaseConfig` object and add it in the Duo Chat Settings modal.

---

## 🌐 How to Deploy for Free

### Option A: Deploy to Vercel (1-Click)

1. Push your `duo-chat` code to a repository on **GitHub** or **GitLab**.
2. Go to [vercel.com](https://vercel.com) and sign in.
3. Click **Add New** -> **Project**.
4. Import your `duo-chat` repository.
5. Vercel will automatically detect `vercel.json` and build your static app.
6. Click **Deploy**. Your app will be live on a free URL like `https://duo-chat.vercel.app`!

### Option B: Deploy to Netlify (1-Click)

1. Sign in to [netlify.com](https://netlify.com).
2. Click **Add new site** -> **Import an existing project**.
3. Connect your GitHub repository.
4. Netlify will detect `netlify.toml` automatically (`Publish directory: dist`, `Build command: npm run build`).
5. Click **Deploy Site**.

---

## 💻 Local Testing & Development

To test the application locally on your computer or home Wi-Fi:

```bash
# Install dependencies
npm install

# Option 1: Run with Vite Dev Server
npm run dev

# Option 2: Run with local Node.js WebSocket server
npm start
```

Then open `http://localhost:3000` in your browser.
