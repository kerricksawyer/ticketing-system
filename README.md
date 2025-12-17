# Theater Ticketing System

A complete ticketing platform for theater and performing arts. Parents can log in, select seats, and get confirmation emails with QR codes for check-in.

## Features

- **Email-based parent login** (no password needed)
- **Admin panel** to create shows and configure seating
- **Seat selection interface** with real-time availability
- **Email confirmations** with QR codes using SendGrid
- **Check-in system** by scanning QR codes
- **Double-booking prevention** with database transactions
- **Responsive design** that works on mobile and desktop

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, React Router
- **Email**: SendGrid
- **Hosting**: Render

## Setup Instructions

### Prerequisites

- Node.js 14+
- PostgreSQL database
- SendGrid account (free tier available)
- GitHub account
- Render account

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository called `ticketing-system`
3. Clone it to your computer:
   ```bash
   git clone https://github.com/kerricksawyer/ticketing-system.git
   cd ticketing-system
   ```

### Step 2: Set Up Local Environment

#### Backend Setup

1. Navigate to backend folder and create `.env` file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/ticketing_db
   SENDGRID_API_KEY=your_sendgrid_api_key
   JWT_SECRET=your_super_secret_key_change_me
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ADMIN_PASSWORD=change_me_to_something_secure
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

#### Frontend Setup

1. In a new terminal, navigate to frontend:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `.env`:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the app:
   ```bash
   npm start
   ```
   App will open at `http://localhost:3000`

### Step 3: Set Up SendGrid

1. Go to [sendgrid.com](https://sendgrid.com) and sign up for free
2. In Settings > API Keys, create a new API key
3. Copy the key to your backend `.env` file as `SENDGRID_API_KEY`
4. Set up a sender email:
   - Go to Settings > Sender Authentication
   - Add your domain or use SendGrid's single sender verification
   - Set the email in your `.env` as `SENDGRID_FROM_EMAIL`

### Step 4: Set Up PostgreSQL Database

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   createdb ticketing_db
   ```
3. Update `DATABASE_URL` in `.env` with your credentials

#### Option B: Use a cloud database
1. Create a database on [Render.com](https://render.com) or [Heroku](https://www.heroku.com)
2. Copy the connection string to `DATABASE_URL` in `.env`

### Step 5: Initialize the Database

The database tables will be created automatically when you start the backend server for the first time.

### Step 6: Test Locally

1. Create a show through the admin API using curl or Postman:
   ```bash
   curl -X POST http://localhost:5000/api/admin/shows \
     -H "Content-Type: application/json" \
     -H "x-admin-password: change_me_to_something_secure" \
     -d '{
       "name": "School Play",
       "description": "Annual school performance",
       "date": "2024-03-15T19:00:00Z"
     }'
   ```
   Note the show ID from the response.

2. Create seats for the show:
   ```bash
   curl -X POST http://localhost:5000/api/admin/shows/1/seats \
     -H "Content-Type: application/json" \
     -H "x-admin-password: change_me_to_something_secure" \
     -d '{
       "rows": [
         { "rowName": "A", "seatCount": 10 },
         { "rowName": "B", "seatCount": 10 },
         { "rowName": "C", "seatCount": 10 }
       ]
     }'
   ```

3. Open `http://localhost:3000` and test the flow:
   - Click "Log In"
   - Enter your email
   - Check your email for login link
   - Select a show and book a seat
   - Confirm booking

### Step 7: Deploy to Render

#### Backend Deployment

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [render.com](https://render.com) and sign in with GitHub
3. Click "New +" and select "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `ticketing-backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to you

6. Add environment variables in Render dashboard:
   - `DATABASE_URL`: (create PostgreSQL database on Render first)
   - `SENDGRID_API_KEY`
   - `JWT_SECRET`
   - `FRONTEND_URL`: (will be your frontend Render URL)
   - `ADMIN_PASSWORD`
   - `SENDGRID_FROM_EMAIL`

7. Click "Create Web Service"

#### Frontend Deployment

1. Update your frontend `.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   ```

2. In Render, create a new Static Site:
   - Connect your GitHub repo
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

3. Click "Create Static Site"

4. Update your backend's `FRONTEND_URL` environment variable to your frontend's Render URL

### Step 8: Create the PostgreSQL Database on Render

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Give it a name
3. Copy the connection string
4. Add it as `DATABASE_URL` in your backend's environment variables
5. The tables will be created automatically when the backend first starts

## Using the Admin Panel

### Create a Show
```bash
curl -X POST https://your-backend.onrender.com/api/admin/shows \
  -H "Content-Type: application/json" \
  -H "x-admin-password: your_admin_password" \
  -d '{
    "name": "School Concert",
    "description": "Annual holiday concert",
    "date": "2024-12-20T18:00:00Z"
  }'
```

### Create Seats
```bash
curl -X POST https://your-backend.onrender.com/api/admin/shows/1/seats \
  -H "Content-Type: application/json" \
  -H "x-admin-password: your_admin_password" \
  -d '{
    "rows": [
      { "rowName": "A", "seatCount": 15 },
      { "rowName": "B", "seatCount": 15 },
      { "rowName": "C", "seatCount": 15 }
    ]
  }'
```

### Get Show Bookings
```bash
curl -X GET https://your-backend.onrender.com/api/admin/shows/1/bookings \
  -H "x-admin-password: your_admin_password"
```

## Security Notes

- **Change all default passwords** in production
- Use HTTPS (Render provides this automatically)
- Store sensitive data in environment variables only
- The admin password should be strong and unique
- Consider implementing proper JWT token refresh in production

## Troubleshooting

### Emails not sending
- Check SendGrid API key is correct
- Verify sender email is authenticated in SendGrid
- Check spam folder
- Look at backend logs for SendGrid errors

### Database connection issues
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check PostgreSQL is running
- Ensure database exists

### QR code not working
- QR code links to check-in page - make sure frontend URL is correct
- Test QR code by scanning with phone camera
- Check browser console for errors

### Seats showing as booked but no booking
- Database transaction may have failed
- Check backend logs
- Refresh the page

## Next Steps for Production

1. Add proper user authentication/roles
2. Implement email templates
3. Add payment processing
4. Create admin dashboard UI
5. Add export functionality for reporting
6. Implement seat maps with better visuals
7. Add multi-language support
8. Set up SSL certificates

## Support

For issues or questions, check the code comments or test locally first before deploying.

Good luck with your ticketing system!
