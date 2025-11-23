# Math Class Booking System

A modern booking system for online math classes with automatic Zoom meeting generation.

## Features
- 📅 Weekly schedule (Monday-Sunday, 8 AM - 10 PM)
- 👨‍🏫 Instructor dashboard to manage availability
- 👨‍🎓 Student booking interface
- 🎥 Automatic Zoom meeting link generation
- 📧 Email confirmation with meeting details
- 📱 Responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

Create a `.env` file with:
```
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
```

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!
```

---

## 📋 **COMPLETE FOLDER STRUCTURE**

After creating all files, your folder should look like this:
```
math-class-booking/
├── api/
│   └── create-zoom-meeting.js
├── src/
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.js