# JobCraft - Resume Builder with Supabase Auth

A modern resume builder application with authentication powered by Supabase.

## Features

- ✅ User authentication (Sign up, Sign in, Sign out)
- ✅ Protected routes for authenticated users
- ✅ Resume building interface
- ✅ Job preferences management
- ✅ Dashboard for authenticated users
- ✅ Responsive design with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be set up
3. Go to Settings > API
4. Copy your project URL and anon public key

### 3. Configure Environment Variables

Create a `.env` file in the root directory of your project and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the placeholder values with your actual Supabase project URL and anon key.

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Access the Application

- Open your browser and go to `http://localhost:5173`
- Public pages (like Home) are accessible to all users
- Protected pages (Dashboard, Resume Builder, Job Preferences) require authentication
- Click "Sign In" to access the authentication page

## Authentication Flow

1. **Sign Up**: Create a new account with email and password
2. **Email Verification**: Check your email and verify your account
3. **Sign In**: Use your credentials to sign in
4. **Protected Access**: Access protected routes after authentication
5. **Sign Out**: Use the logout button to sign out

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── LoginForm.tsx   # Login form component
│   ├── SignupForm.tsx  # Signup form component
│   ├── Navbar.tsx      # Navigation bar with auth status
│   └── ProtectedRoute.tsx # Route protection wrapper
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context provider
├── lib/               # Utility libraries
│   └── supabase.ts    # Supabase client configuration
├── pages/             # Page components
│   ├── Auth.tsx       # Authentication page
│   ├── Dashboard.tsx  # User dashboard
│   ├── HomePage.tsx   # Public home page
│   └── ResumeBuilder.tsx # Resume builder interface
└── App.tsx           # Main application component
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
