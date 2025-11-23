export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { day, time, studentName, startDateTime } = req.body;
    
    // Get Zoom access token
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // Create Zoom meeting
    const meetingResponse = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: `Math Class - ${studentName} (${day} ${time})`,
        type: 2,
        start_time: startDateTime,
        duration: 45,
        timezone: 'Europe/Istanbul',
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          waiting_room: true,
          mute_upon_entry: false,
          auto_recording: 'cloud'
        }
      })
    });
    
    const meeting = await meetingResponse.json();
    
    if (meeting.code) {
      throw new Error(meeting.message);
    }
    
    return res.status(200).json({
      joinUrl: meeting.join_url,
      meetingId: meeting.id.toString(),
      password: meeting.password
    });
    
  } catch (error) {
    console.error('Zoom API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to create meeting',
      details: error.message 
    });
  }
}
```

---

#### **FILE 7: `.gitignore`**
**Location:** Root folder (`math-class-booking/.gitignore`)
```
# Dependencies
node_modules/

# Build output
dist/
.vite/

# Environment variables
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*