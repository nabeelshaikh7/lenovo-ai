// In server.js
require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabase, getSupabaseClient } = require('./supabaseClient');
const amqp = require('amqplib');
const authMiddleware = require('./authMiddleware');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 8000; // Use port from .env or default to 8000

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    message: 'Please try again later. Rate limit: 100 requests per 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to accept JSON data

// Apply rate limiting to all API routes
app.use('/api', limiter);

// A simple test route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Async function to search for job links using Brave Search
async function searchForJobLinks(jobName, jobLocation, jobType) {
  try {
    // Check if Brave API key is available
    if (!process.env.BRAVE_API_KEY) {
      console.warn('BRAVE_API_KEY not found in environment variables');
      // Return mock data for testing
      return [
        {
          url: 'https://example.com/job1',
          title: 'Software Engineer at Example Corp',
          description: 'We are looking for a talented software engineer...'
        },
        {
          url: 'https://example.com/job2',
          title: 'Full Stack Developer',
          description: 'Join our team as a full stack developer...'
        }
      ];
    }

    // Construct search query
    const searchQuery = `${jobName} ${jobType} jobs ${jobLocation}`;
    
    // Brave Search API endpoint
    const braveSearchUrl = 'https://api.search.brave.com/res/v1/web/search';
    
    // Make request to Brave Search API
    const response = await axios.get(braveSearchUrl, {
      params: {
        q: searchQuery,
        count: 20, // Get more results to filter from
        search_lang: 'en_US'
      },
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      },
      timeout: 10000 // 10 second timeout
    });

    // Extract URLs from search results
    const searchResults = response.data.web?.results || [];
    
    // Filter and return top 10 relevant URLs
    const relevantUrls = searchResults
      .filter(result => {
        const url = result.url?.toLowerCase() || '';
        const title = result.title?.toLowerCase() || '';
        
        // Filter for job-related domains and content
        const jobKeywords = ['indeed', 'linkedin', 'glassdoor', 'monster', 'careerbuilder', 'ziprecruiter', 'simplyhired', 'dice', 'angel', 'stackoverflow', 'remote', 'job', 'career', 'position', 'opening'];
        
        return jobKeywords.some(keyword => 
          url.includes(keyword) || title.includes(keyword)
        );
      })
      .slice(0, 10) // Get top 10
      .map(result => ({
        url: result.url,
        title: result.title,
        description: result.description
      }));

    return relevantUrls;
    
  } catch (error) {
    console.error('Error searching for job links:', error.response?.data || error.message);
    
    // Return mock data if API fails
    console.log('Returning mock job data due to API error');
    return [
      {
        url: 'https://example.com/job1',
        title: 'Software Engineer at Example Corp',
        description: 'We are looking for a talented software engineer...'
      },
      {
        url: 'https://example.com/job2',
        title: 'Full Stack Developer',
        description: 'Join our team as a full stack developer...'
      }
    ];
  }
}

// Function to fetch resume data by user ID
async function fetchResumeByUserId(userId, authToken = null) {
  try {
    const supabaseClient = getSupabaseClient(authToken);
    
    const { data, error } = await supabaseClient
      .from('resumes')
      .select('data, title')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }

    return data.data; // Return the JSONB data field
  } catch (error) {
    console.error('Error fetching resume:', error);
    throw error;
  }
}

// Function to get AI suggestions for resume customization
async function getResumeSuggestions(jobDescription, resumeData, jobName, jobLocation, jobType) {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      // Return mock suggestions for testing
      return {
        suggestions: [
          {
            category: "skills",
            suggestion: "Add React.js and Node.js to your skills section",
            priority: "high"
          },
          {
            category: "experience",
            suggestion: "Quantify your achievements with specific metrics",
            priority: "medium"
          }
        ],
        resume_updates: {
          summary: "Experienced software developer with strong technical skills",
          skills: ["React.js", "Node.js", "JavaScript"],
          experience_highlights: ["Led development of web applications"]
        },
        keywords_to_include: ["React", "Node.js", "JavaScript", "API"],
        overall_assessment: "Your resume shows good experience but needs more specific technical skills."
      };
    }

    const prompt = `
You are an expert resume consultant. Based on the following job description and the user's current resume, provide specific, actionable suggestions to tailor the resume for this position.

**Job Details:**
- Position: ${jobName}
- Location: ${jobLocation}
- Type: ${jobType}

**Job Description:**
${jobDescription}

**User's Current Resume:**
${JSON.stringify(resumeData, null, 2)}

Please provide your response in the following JSON format:
{
  "suggestions": [
    {
      "category": "skills",
      "suggestion": "Add specific technical skills mentioned in the job description",
      "priority": "high"
    },
    {
      "category": "experience",
      "suggestion": "Reformat experience section to highlight relevant achievements",
      "priority": "medium"
    }
  ],
  "resume_updates": {
    "summary": "Updated professional summary focusing on relevant experience",
    "skills": ["skill1", "skill2", "skill3"],
    "experience_highlights": ["highlight1", "highlight2"]
  },
  "keywords_to_include": ["keyword1", "keyword2", "keyword3"],
  "overall_assessment": "Brief assessment of resume-job fit"
}

Focus on:
1. Identifying missing skills or experiences that are mentioned in the job description
2. Suggesting specific keywords to include
3. Recommending how to rephrase existing content to better match the job requirements
4. Providing actionable, specific suggestions rather than general advice
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the AI's response as JSON
    try {
      const suggestions = JSON.parse(text);
      return suggestions;
    } catch (parseError) {
      // If JSON parsing fails, return a structured response
      return {
        suggestions: [
          {
            category: "general",
            suggestion: text,
            priority: "medium"
          }
        ],
        resume_updates: {},
        keywords_to_include: [],
        overall_assessment: "AI analysis completed"
      };
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Return mock suggestions if API fails
    console.log('Returning mock suggestions due to API error');
    return {
      suggestions: [
        {
          category: "skills",
          suggestion: "Add React.js and Node.js to your skills section",
          priority: "high"
        },
        {
          category: "experience",
          suggestion: "Quantify your achievements with specific metrics",
          priority: "medium"
        }
      ],
      resume_updates: {
        summary: "Experienced software developer with strong technical skills",
        skills: ["React.js", "Node.js", "JavaScript"],
        experience_highlights: ["Led development of web applications"]
      },
      keywords_to_include: ["React", "Node.js", "JavaScript", "API"],
      overall_assessment: "Your resume shows good experience but needs more specific technical skills."
    };
  }
}

// Main endpoint for job search and resume customization
app.post('/api/job-search-resume', async (req, res) => {
  const { userId, jobName, jobLocation, jobType } = req.body;

  // Validate required fields
  if (!userId || !jobName || !jobLocation || !jobType) {
    return res.status(400).json({ 
      error: 'userId, jobName, jobLocation, and jobType are required.' 
    });
  }

  // Extract auth token from headers
  const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

  try {
    // Step 1: Fetch user's resume data
    let resumeData;
    try {
      resumeData = await fetchResumeByUserId(userId, authToken);
    } catch (error) {
      return res.status(404).json({ 
        error: 'Resume not found for this user. Please upload a resume first.' 
      });
    }

    // Step 2: Search for job links
    const jobLinks = await searchForJobLinks(jobName, jobLocation, jobType);

    // Step 3: Scrape job descriptions from the first few job links
    const jobDescriptions = [];
    const maxScrapes = Math.min(3, jobLinks.length); // Scrape up to 3 job descriptions

    for (let i = 0; i < maxScrapes; i++) {
      try {
        const scrapedData = await scrapeJobDescription(jobLinks[i].url);
        if (scrapedData.title && scrapedData.description) {
          jobDescriptions.push({
            url: jobLinks[i].url,
            title: scrapedData.title,
            description: scrapedData.description,
            originalTitle: jobLinks[i].title
          });
        }
      } catch (error) {
        console.log(`Failed to scrape ${jobLinks[i].url}:`, error.message);
        // Continue with other links even if one fails
      }
    }

    // Step 4: Get AI suggestions for resume customization based on scraped job descriptions
    let aiSuggestions = null;
    if (jobDescriptions.length > 0) {
      // Use the first successfully scraped job description for AI analysis
      const primaryJobDescription = jobDescriptions[0];
      aiSuggestions = await getResumeSuggestions(
        primaryJobDescription.description, 
        resumeData, 
        jobName, 
        jobLocation, 
        jobType
      );
    } else {
      // Fallback to a generic description if scraping fails
      const fallbackDescription = `We are looking for a ${jobName} to join our team in ${jobLocation}. This is a ${jobType} position that requires strong technical skills and experience in the field.`;
      aiSuggestions = await getResumeSuggestions(
        fallbackDescription, 
        resumeData, 
        jobName, 
        jobLocation, 
        jobType
      );
    }

    // Step 5: Return comprehensive response
    res.json({
      success: true,
      data: {
        jobLinks: jobLinks,
        jobDescriptions: jobDescriptions,
        resumeSuggestions: aiSuggestions,
        searchQuery: `${jobName} ${jobType} jobs ${jobLocation}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in job-search-resume endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to process job search and resume customization.',
      details: error.message 
    });
  }
});

// Endpoint to search for job links (existing, kept for backward compatibility)
app.post('/api/search-job-links', async (req, res) => {
  const { jobName, jobLocation, jobType } = req.body;

  if (!jobName || !jobLocation || !jobType) {
    return res.status(400).json({ 
      error: 'jobName, jobLocation, and jobType are required.' 
    });
  }

  try {
    const jobLinks = await searchForJobLinks(jobName, jobLocation, jobType);
    res.json({ jobLinks });
  } catch (error) {
    console.error('Error in search-job-links endpoint:', error);
    res.status(500).json({ error: 'Failed to search for job links.' });
  }
});

// Endpoint for AI customization (existing, kept for backward compatibility)
app.post('/api/customize-resume', async (req, res) => {
    const { jobDescription, resumeData } = req.body;

    if (!jobDescription || !resumeData) {
        return res.status(400).json({ error: 'Job description and resume data are required.' });
    }

    try {
        const suggestions = await getResumeSuggestions(jobDescription, resumeData, "Unknown", "Unknown", "Unknown");
        res.json(suggestions);
    } catch (error) {
        console.error('Gemini API error:', error);
        res.status(500).json({ error: 'Failed to get suggestions from AI.' });
    }
});

// Endpoint to get resume suggestions for a specific job (new)
app.post('/api/resume-suggestions', async (req, res) => {
  const { userId, jobDescription, jobName, jobLocation, jobType } = req.body;

  if (!userId || !jobDescription) {
    return res.status(400).json({ 
      error: 'userId and jobDescription are required.' 
    });
  }

  // Extract auth token from headers
  const authToken = req.headers.authorization?.replace('Bearer ', '') || null;

  try {
    // Fetch user's resume
    const resumeData = await fetchResumeByUserId(userId, authToken);
    
    // Get AI suggestions
    const suggestions = await getResumeSuggestions(
      jobDescription, 
      resumeData, 
      jobName || "Unknown", 
      jobLocation || "Unknown", 
      jobType || "Unknown"
    );

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error in resume-suggestions endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to get resume suggestions.',
      details: error.message 
    });
  }
});

// Endpoint to start job search and queue it for processing
app.post('/api/start-job-search', authMiddleware, async (req, res) => {
  const { jobName, jobLocation, jobType } = req.body;
  const userId = req.user.id; // Get userId from authenticated user

  if (!jobName || !jobLocation || !jobType) {
    return res.status(400).json({ 
      error: 'jobName, jobLocation, and jobType are required.' 
    });
  }

  try {
    // Connect to RabbitMQ server
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    
    // Assert the job queue
    await channel.assertQueue('job_queue', {
      durable: true // Make queue persistent
    });

    // Create message object with job data
    const message = {
      jobName,
      jobLocation,
      jobType,
      userId,
      timestamp: new Date().toISOString()
    };

    // Send message to the queue
    await channel.sendToQueue('job_queue', Buffer.from(JSON.stringify(message)), {
      persistent: true // Make message persistent
    });

    // Close the connection
    await channel.close();
    await connection.close();

    // Respond to client with 202 Accepted status
    res.status(202).json({ 
      message: 'Job search has been queued.',
      jobId: `${userId}-${Date.now()}` // Optional: provide a job identifier
    });

  } catch (error) {
    console.error('Error in start-job-search endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to queue job search.',
      details: error.message 
    });
  }
});

// Function to scrape job descriptions from URLs
async function scrapeJobDescription(url) {
  try {
    // 1. Fetch the HTML of the page
    const { data } = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // 3. Try multiple selectors for job title
    let jobTitle = '';
    const titleSelectors = [
      'h1',
      '[data-testid="job-title"]',
      '.job-title',
      '.title',
      'h1[class*="title"]',
      'h1[class*="job"]'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 0) {
        jobTitle = title;
        break;
      }
    }

    // 4. Try multiple selectors for job description
    let jobDescription = '';
    const descriptionSelectors = [
      '[data-testid="job-description"]',
      '.job-description',
      '.description',
      '.content',
      '.job-details',
      '.job-content',
      '[class*="description"]',
      '[class*="content"]',
      'main',
      'article'
    ];

    for (const selector of descriptionSelectors) {
      const description = $(selector).text().trim();
      if (description && description.length > 100) { // Minimum length to be considered a description
        jobDescription = description;
        break;
      }
    }

    // 5. Fallback: if no specific selectors work, try to get meaningful content
    if (!jobTitle || !jobDescription) {
      // Try to get title from any h1-h3 tag
      if (!jobTitle) {
        jobTitle = $('h1, h2, h3').first().text().trim() || 'Job Title Not Found';
      }

      // Try to get description from body text, excluding navigation and footer
      if (!jobDescription) {
        // Remove navigation, header, footer elements
        $('nav, header, footer, .nav, .header, .footer, .sidebar').remove();
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        jobDescription = bodyText.slice(0, 3000); // Limit to 3000 characters
      }
    }

    return { 
      title: jobTitle || 'Job Title Not Found', 
      description: jobDescription || 'Job description could not be extracted' 
    };

  } catch (error) {
    console.error('Scraping error for URL:', url, error.message);
    throw new Error(`Failed to scrape job description from ${url}`);
  }
}

app.post('/api/scrape', async (req, res) => {
    const { url } = req.body; // Get the URL from the request body
  
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
  
    try {
      const scrapedData = await scrapeJobDescription(url);
      res.json(scrapedData);
    } catch (error) {
      console.error('Scraping error:', error);
      res.status(500).json({ error: 'Failed to scrape the website.' });
    }
  });

// Debug endpoint to check database connection
app.get('/api/debug-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      res.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    } else {
      res.json({
        success: true,
        message: 'Database connection successful',
        supabaseUrl: process.env.SUPABASE_URL ? 'Set' : 'Not set',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for development (bypasses authentication)
app.post('/api/test-resume-fetch', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ 
      error: 'userId is required.' 
    });
  }

  try {
    // For testing, we'll use the default client without RLS
    // First, let's check if we have a service role key for admin access
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let supabaseClient = supabase;
    
    // If we have a service role key, use it for admin access
    if (supabaseServiceKey) {
      const { createClient } = require('@supabase/supabase-js');
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    const { data, error } = await supabaseClient
      .from('resumes')
      .select('data, title')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    res.json({
      success: true,
      data: {
        resume: data.data,
        title: data.title
      }
    });

  } catch (error) {
    console.error('Error in test-resume-fetch:', error);
    res.status(500).json({ 
      error: 'Failed to fetch resume data.',
      details: error.message 
    });
  }
});

// GET endpoint to fetch all jobs for the authenticated user
app.get('/api/jobs', authMiddleware, async (req, res) => {
  const userId = req.user.id; // Get userId from authenticated user

  try {
    // Query the jobs table for all jobs belonging to the current user
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch jobs from database.',
        details: error.message 
      });
    }

    // Return the jobs as JSON response
    res.json({
      success: true,
      data: data || [],
      count: data ? data.length : 0
    });

  } catch (error) {
    console.error('Error in /api/jobs endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error while fetching jobs.',
      details: error.message 
    });
  }
});

// PUT endpoint to update job status
app.put('/api/jobs/:jobId/status', authMiddleware, async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.body;
  const userId = req.user.id; // Get userId from authenticated user

  if (!status) {
    return res.status(400).json({ 
      error: 'status is required in request body.' 
    });
  }

  // Validate status values (you can customize these based on your needs)
  const validStatuses = ['applied', 'interviewing', 'offered', 'rejected', 'saved', 'archived'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  try {
    // First, check if the job exists and belongs to the user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      console.error('Error fetching job:', fetchError);
      return res.status(404).json({ 
        error: 'Job not found.' 
      });
    }

    if (existingJob.user_id !== userId) {
      return res.status(403).json({ 
        error: 'You can only update your own jobs.' 
      });
    }

    // Update the job status
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .eq('user_id', userId) // Double-check user ownership
      .select();

    if (error) {
      console.error('Error updating job status:', error);
      return res.status(500).json({ 
        error: 'Failed to update job status.',
        details: error.message 
      });
    }

    res.json({
      success: true,
      message: 'Job status updated successfully.',
      data: data[0]
    });

  } catch (error) {
    console.error('Error in update job status endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to update job status.',
      details: error.message 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});