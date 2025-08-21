# Job Search & Resume Customization Backend API

A Node.js backend API that combines job search functionality with AI-powered resume customization using Google's Gemini API and Brave Search.

## Features

- **Job Search**: Search for job listings using Brave Search API
- **Resume Customization**: AI-powered suggestions for tailoring resumes to specific job descriptions
- **User Management**: Fetch user resumes from Supabase database
- **Web Scraping**: Extract job descriptions from job posting URLs
- **Comprehensive Analysis**: Get detailed suggestions including keywords, skills, and experience highlights

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and database
- Google Gemini API key
- Brave Search API key

### Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
BRAVE_API_KEY=your_brave_search_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:8000` (or the port specified in your .env file).

## API Endpoints

### 1. Main Job Search & Resume Customization Endpoint

**POST** `/api/job-search-resume`

This is the primary endpoint that combines job search with resume customization. It automatically scrapes job descriptions from the found job links and uses them to generate personalized resume suggestions.

**Request Body:**
```json
{
  "userId": "user123",
  "jobName": "Software Engineer",
  "jobLocation": "San Francisco, CA",
  "jobType": "Full-time"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobLinks": [
      {
        "url": "https://example.com/job1",
        "title": "Software Engineer at Tech Corp",
        "description": "We are looking for a talented software engineer..."
      }
    ],
    "jobDescriptions": [
      {
        "url": "https://example.com/job1",
        "title": "Senior Software Engineer",
        "description": "We are seeking a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies. The ideal candidate will have strong problem-solving skills and experience with scalable web applications...",
        "originalTitle": "Software Engineer at Tech Corp"
      }
    ],
    "resumeSuggestions": {
      "suggestions": [
        {
          "category": "skills",
          "suggestion": "Add React.js and Node.js to your skills section",
          "priority": "high"
        }
      ],
      "resume_updates": {
        "summary": "Updated professional summary...",
        "skills": ["React.js", "Node.js", "JavaScript"],
        "experience_highlights": ["Led development of web applications..."]
      },
      "keywords_to_include": ["React", "Node.js", "JavaScript", "API"],
      "overall_assessment": "Your resume shows good experience but needs more specific technical skills."
    },
    "searchQuery": "Software Engineer Full-time jobs San Francisco, CA",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Resume Suggestions for Specific Job

**POST** `/api/resume-suggestions`

Get AI-powered resume suggestions for a specific job description.

**Request Body:**
```json
{
  "userId": "user123",
  "jobDescription": "We are seeking a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies...",
  "jobName": "Senior Software Engineer",
  "jobLocation": "Remote",
  "jobType": "Full-time"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "category": "experience",
        "suggestion": "Quantify your achievements with specific metrics",
        "priority": "high"
      }
    ],
    "resume_updates": {
      "summary": "Senior Software Engineer with 5+ years...",
      "skills": ["React", "Node.js", "AWS", "Docker"],
      "experience_highlights": ["Reduced API response time by 40%..."]
    },
    "keywords_to_include": ["Senior", "React", "Node.js", "Cloud", "API"],
    "overall_assessment": "Strong technical background, focus on leadership experience."
  }
}
```

### 3. Job Links Search (Legacy)

**POST** `/api/search-job-links`

Search for job links only (without resume customization).

**Request Body:**
```json
{
  "jobName": "Data Scientist",
  "jobLocation": "New York, NY",
  "jobType": "Remote"
}
```

### 4. Resume Customization (Legacy)

**POST** `/api/customize-resume`

Get resume suggestions for a job description (without user ID).

**Request Body:**
```json
{
  "jobDescription": "Job description text here...",
  "resumeData": {
    "name": "John Doe",
    "experience": [...],
    "skills": [...]
  }
}
```

### 5. Web Scraping

**POST** `/api/scrape`

Extract job information from a job posting URL.

**Request Body:**
```json
{
  "url": "https://example.com/job-posting"
}
```

**Response:**
```json
{
  "title": "Software Engineer",
  "description": "Job description extracted from the webpage..."
}
```

## Database Schema

The API expects a Supabase database with a `resumes` table:

```sql
-- Ensure required extension for gen_random_uuid
create extension if not exists pgcrypto;

-- Create resumes table
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Resume',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- Create index on updated_at for sorting
create index if not exists resumes_updated_at_idx on public.resumes(updated_at desc);

-- Enable Row Level Security (RLS)
alter table public.resumes enable row level security;

-- Policies: users can only access their own rows
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- Trigger to automatically update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_resumes_updated_at on public.resumes;
create trigger update_resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.update_updated_at_column();
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing required fields)
- `404`: Not Found (user resume not found)
- `500`: Internal Server Error

Error responses include a descriptive message:
```json
{
  "error": "Error description",
  "details": "Additional error details (if available)"
}
```

## Usage Examples

### Frontend Integration

```javascript
// Example: Using the main endpoint
const response = await fetch('/api/job-search-resume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user123',
    jobName: 'Frontend Developer',
    jobLocation: 'Los Angeles, CA',
    jobType: 'Full-time'
  })
});

const data = await response.json();
console.log('Job links:', data.data.jobLinks);
console.log('Resume suggestions:', data.data.resumeSuggestions);
```

### Environment Variables

Make sure to set up these environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `BRAVE_API_KEY`: Your Brave Search API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PORT`: Server port (optional, defaults to 8000)

## Dependencies

- `express`: Web framework
- `@google/generative-ai`: Google Gemini AI API
- `@supabase/supabase-js`: Supabase client
- `axios`: HTTP client
- `cheerio`: HTML parsing
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

## Development

To run in development mode with auto-restart:
```bash
npm start
```

The server uses nodemon for automatic restarts during development.

## License

ISC
