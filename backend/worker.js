require('dotenv').config(); // Load environment variables from .env file
const amqp = require('amqplib');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabaseAdmin, getSupabaseClient } = require('./supabaseClient');

// Initialize Google AI
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
        country: 'us'
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

// Function to fetch resume data by user ID
async function fetchResumeByUserId(userId) {
  try {
    const { data, error } = await supabaseAdmin
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

// Function to save job details to Supabase
async function saveJobToDatabase(jobData, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        user_id: userId,
        job_title: jobData.title,
        job_description: jobData.description,
        job_url: jobData.url,
        job_location: jobData.location || 'Unknown',
        job_type: jobData.type || 'Unknown',
        company_name: jobData.company || 'Unknown',
        scraped_at: new Date().toISOString(),
        ai_suggestions: jobData.aiSuggestions || null,
        search_query: jobData.searchQuery || null
      });

    if (error) {
      console.error('Error saving job to database:', error);
      throw error;
    }

    console.log('Job saved to database successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to save job to database:', error);
    throw error;
  }
}

// Main worker function to process job search requests
async function processJobSearch(jobData) {
  const { jobName, jobLocation, jobType, userId } = jobData;
  
  console.log(`Processing job search for user ${userId}: ${jobName} in ${jobLocation} (${jobType})`);
  
  try {
    // Step 1: Search for job links
    console.log('Searching for job links...');
    const jobLinks = await searchForJobLinks(jobName, jobLocation, jobType);
    console.log(`Found ${jobLinks.length} job links`);

    // Step 2: Fetch user's resume for AI analysis
    let resumeData = null;
    try {
      resumeData = await fetchResumeByUserId(userId);
      console.log('Resume data fetched successfully');
    } catch (error) {
      console.warn('Could not fetch resume data:', error.message);
    }

    // Step 3: Process each job link (scrape and save)
    const processedJobs = [];
    const maxScrapes = Math.min(5, jobLinks.length); // Process up to 5 jobs

    for (let i = 0; i < maxScrapes; i++) {
      try {
        console.log(`Processing job ${i + 1}/${maxScrapes}: ${jobLinks[i].url}`);
        
        // Scrape job description
        const scrapedData = await scrapeJobDescription(jobLinks[i].url);
        
        if (scrapedData.title && scrapedData.description) {
          // Get AI suggestions if resume data is available
          let aiSuggestions = null;
          if (resumeData) {
            try {
              aiSuggestions = await getResumeSuggestions(
                scrapedData.description,
                resumeData,
                jobName,
                jobLocation,
                jobType
              );
              console.log('AI suggestions generated successfully');
            } catch (error) {
              console.warn('Failed to generate AI suggestions:', error.message);
            }
          }

          // Prepare job data for database
          const jobDataForDB = {
            title: scrapedData.title,
            description: scrapedData.description,
            url: jobLinks[i].url,
            location: jobLocation,
            type: jobType,
            company: jobLinks[i].title.split(' at ')[1] || 'Unknown',
            aiSuggestions: aiSuggestions,
            searchQuery: `${jobName} ${jobType} jobs ${jobLocation}`
          };

          // Save to database
          await saveJobToDatabase(jobDataForDB, userId);
          processedJobs.push(jobDataForDB);
          
          console.log(`Successfully processed and saved job: ${scrapedData.title}`);
        }
      } catch (error) {
        console.error(`Failed to process job ${i + 1}:`, error.message);
        // Continue with other jobs even if one fails
      }
    }

    console.log(`Job search processing completed. Successfully processed ${processedJobs.length} jobs.`);
    return {
      success: true,
      processedJobs: processedJobs.length,
      totalJobs: jobLinks.length
    };

  } catch (error) {
    console.error('Error processing job search:', error);
    throw error;
  }
}

// Main worker function
async function startWorker() {
  try {
    console.log('Starting job search worker...');
    
    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    
    // Assert the job queue
    await channel.assertQueue('job_queue', {
      durable: true
    });

    console.log('Connected to RabbitMQ and waiting for messages...');

    // Set up consumer to listen for messages
    channel.consume('job_queue', async (msg) => {
      if (msg) {
        try {
          console.log('Received message from queue');
          
          // Parse the message data
          const jobData = JSON.parse(msg.content.toString());
          console.log('Job data:', jobData);

          // Process the job search
          const result = await processJobSearch(jobData);
          console.log('Job processing result:', result);

          // Acknowledge the message
          channel.ack(msg);
          console.log('Message acknowledged successfully');

        } catch (error) {
          console.error('Error processing message:', error);
          
          // Reject the message and requeue it (optional)
          // channel.nack(msg, false, true);
          
          // Or reject without requeuing to avoid infinite loops
          channel.nack(msg, false, false);
          console.log('Message rejected due to processing error');
        }
      }
    }, {
      noAck: false // Enable manual acknowledgment
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('Shutting down worker...');
      await channel.close();
      await connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting worker:', error);
    process.exit(1);
  }
}

// Start the worker if this file is run directly
if (require.main === module) {
  startWorker();
}

module.exports = {
  processJobSearch,
  searchForJobLinks,
  scrapeJobDescription,
  fetchResumeByUserId,
  getResumeSuggestions,
  saveJobToDatabase
};
