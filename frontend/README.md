# AttendSync - Smart Attendance Management (Frontend)

This is the frontend Vite React application for the AttendSync management system.

## Setup and Development

1. Run `npm install` to install dependencies.
2. Setup your Environment Variables (see below).
3. Run `npm run dev` to start the development server.

## Environment Variables & Security

> **CRITICAL SECURITY NOTICE:** This frontend connects directly to Supabase.
> To protect your database, you must **NEVER** commit your `.env` file to version control. Let `.gitignore` do its job.

1. Copy the `.env.example` file to a new file named `.env`.
2. Fill in the values for your Supabase project in `.env`.
3. In your **Vercel Project Settings**, add exactly the same environment variables so the production build can connect to your database.

### Database Security

Since you are using a custom authentication scheme (`profiles` table instead of Supabase Auth), native Supabase Row Level Security (RLS) policies relying on `auth.uid()` cannot be used. The application must use `supabaseAdmin.js` for all data fetching. Ensure your `VITE_SUPABASE_SERVICE_ROLE_KEY` is kept strictly within the `.env` file and securely deployed as an environment variable in Vercel to protect your database.
