# Quick Start Guide

## What You've Built

A complete theater ticketing system with:
- ✅ Parent email login (no passwords)
- ✅ Admin seat creation
- ✅ Real-time seat selection
- ✅ Confirmation emails with QR codes
- ✅ Check-in scanning
- ✅ Double-booking prevention

## Files Created

```
ticketing-system/
├── backend/
│   ├── server.js              (Main Express server)
│   ├── db.js                  (Database setup)
│   ├── email.js               (SendGrid integration)
│   ├── middleware.js          (Auth middleware)
│   ├── package.json
│   ├── .env.example
│   └── routes/
│       ├── shows.js           (Show endpoints)
│       ├── seats.js           (Seat endpoints)
│       ├── auth.js            (Login endpoints)
│       ├── bookings.js        (Booking endpoints)
│       └── admin.js           (Admin endpoints)
│
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── api.js             (API client)
│   │   └── pages/
│   │       ├── Login.js
│   │       ├── Shows.js
│   │       ├── SeatSelection.js
│   │       ├── MyBookings.js
│   │       ├── CheckIn.js
│   │       └── *.css
│   ├── package.json
│   └── .env.example
│
├── README.md
└── .gitignore
```

## Setup Checklist

- [ ] Create GitHub repo `ticketing-system`
- [ ] Clone to your computer
- [ ] Copy backend files into `backend/` folder
- [ ] Copy frontend files into `frontend/` folder
- [ ] Set up `.env` files in both folders
- [ ] Create SendGrid account and get API key
- [ ] Set up PostgreSQL database locally
- [ ] Test locally (npm install, npm run dev, npm start)
- [ ] Push to GitHub
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Render
- [ ] Create database on Render
- [ ] Test in production

## Key Features

### For Parents
1. Go to login page
2. Enter email and name
3. Click "Send Login Link"
4. Click link in email
5. Select a show
6. Pick a seat
7. Confirm booking
8. Get confirmation email with QR code

### For Admin
1. Create shows via API
2. Configure rows and seats
3. View all bookings
4. Check in attendees by scanning QR code

## Important Notes

1. **Seat locking**: Uses database transactions to prevent double-booking
2. **Email links**: Valid for 24 hours
3. **QR codes**: Can be scanned from confirmation email
4. **No passwords**: Parents only need email
5. **Admin password**: Change in production!

## Common First Steps

```bash
# Initialize backend
cd backend
npm install
npm run dev

# In another terminal, initialize frontend
cd frontend
npm install
npm start

# Test at http://localhost:3000
```

## Environment Variables Needed

**Backend (.env):**
- DATABASE_URL
- SENDGRID_API_KEY
- JWT_SECRET
- FRONTEND_URL
- ADMIN_PASSWORD
- SENDGRID_FROM_EMAIL

**Frontend (.env):**
- REACT_APP_API_URL

## Next: Push to GitHub

```bash
git add .
git commit -m "Initial ticketing system"
git push origin main
```

Then deploy to Render following the README.md instructions!
