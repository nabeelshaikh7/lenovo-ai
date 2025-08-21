// Test script for the Job Search & Resume Customization API
const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
const testData = {
  userId: '614a0e3c-be96-45bf-91c7-017a910c230a',
  jobName: 'Software Engineer',
  jobLocation: 'San Francisco, CA',
  jobType: 'Full-time',
  jobDescription: 'We are seeking a talented Software Engineer with experience in JavaScript, React, and Node.js. The ideal candidate will have 3+ years of experience building scalable web applications.',
  resumeData: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    summary: 'Experienced software developer with 2 years of experience in web development.',
    skills: ['JavaScript', 'HTML', 'CSS', 'Python'],
    experience: [
      {
        title: 'Junior Developer',
        company: 'Tech Startup',
        duration: '2022-2024',
        description: 'Developed web applications using JavaScript and React.'
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of Technology',
        year: '2022'
      }
    ]
  }
};

async function testEndpoints() {
  console.log('🧪 Testing Job Search & Resume Customization API\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 1.5: Database connection check
    console.log('1.5. Testing database connection...');
    try {
      const dbResponse = await axios.get(`${BASE_URL}/api/debug-db`);
      console.log('✅ Database connection check:', dbResponse.data);
    } catch (error) {
      console.log('⚠️  Database connection check failed:', error.response?.data || error.message);
    }
    console.log('');

    // Test 2: Main endpoint (job search + resume customization)
    console.log('2. Testing main endpoint (/api/job-search-resume)...');
    try {
      const mainResponse = await axios.post(`${BASE_URL}/api/job-search-resume`, {
        userId: testData.userId,
        jobName: testData.jobName,
        jobLocation: testData.jobLocation,
        jobType: testData.jobType
      });
      console.log('✅ Main endpoint response received');
      console.log('   - Job links found:', mainResponse.data.data.jobLinks.length);
      console.log('   - Job descriptions scraped:', mainResponse.data.data.jobDescriptions?.length || 0);
      console.log('   - Resume suggestions received:', !!mainResponse.data.data.resumeSuggestions);
    } catch (error) {
      console.log('⚠️  Main endpoint test failed (expected if no resume data):', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Resume suggestions endpoint
    console.log('3. Testing resume suggestions endpoint (/api/resume-suggestions)...');
    try {
      const suggestionsResponse = await axios.post(`${BASE_URL}/api/resume-suggestions`, {
        userId: testData.userId,
        jobDescription: testData.jobDescription,
        jobName: testData.jobName,
        jobLocation: testData.jobLocation,
        jobType: testData.jobType
      });
      console.log('✅ Resume suggestions endpoint response received');
      console.log('   - Suggestions count:', suggestionsResponse.data.data.suggestions?.length || 0);
    } catch (error) {
      console.log('⚠️  Resume suggestions test failed (expected if no resume data):', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Job links search endpoint
    console.log('4. Testing job links search endpoint (/api/search-job-links)...');
    const jobLinksResponse = await axios.post(`${BASE_URL}/api/search-job-links`, {
      jobName: testData.jobName,
      jobLocation: testData.jobLocation,
      jobType: testData.jobType
    });
    console.log('✅ Job links search endpoint response received');
    console.log('   - Job links found:', jobLinksResponse.data.jobLinks.length);
    console.log('');

    // Test 5: Resume customization endpoint
    console.log('5. Testing resume customization endpoint (/api/customize-resume)...');
    const customizeResponse = await axios.post(`${BASE_URL}/api/customize-resume`, {
      jobDescription: testData.jobDescription,
      resumeData: testData.resumeData
    });
    console.log('✅ Resume customization endpoint response received');
    console.log('   - Suggestions received:', !!customizeResponse.data.suggestions);
    console.log('');

    // Test 6: Resume fetch test endpoint
    console.log('6. Testing resume fetch endpoint (/api/test-resume-fetch)...');
    try {
      const resumeResponse = await axios.post(`${BASE_URL}/api/test-resume-fetch`, {
        userId: testData.userId
      });
      console.log('✅ Resume fetch test endpoint response received');
      console.log('   - Resume data found:', !!resumeResponse.data.data.resume);
      console.log('   - Resume title:', resumeResponse.data.data.title);
      if (resumeResponse.data.data.resume) {
        console.log('   - Skills count:', resumeResponse.data.data.resume.skills?.length || 0);
        console.log('   - Work experience count:', resumeResponse.data.data.resume.workExperience?.length || 0);
      }
    } catch (error) {
      console.log('⚠️  Resume fetch test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Web scraping endpoint
    console.log('7. Testing web scraping endpoint (/api/scrape)...');
    try {
      const scrapeResponse = await axios.post(`${BASE_URL}/api/scrape`, {
        url: 'https://example.com'
      });
      console.log('✅ Web scraping endpoint response received');
      console.log('   - Title extracted:', !!scrapeResponse.data.title);
      console.log('   - Description extracted:', !!scrapeResponse.data.description);
    } catch (error) {
      console.log('⚠️  Web scraping test failed (expected for example.com):', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\n📝 Notes:');
    console.log('- Some tests may fail if environment variables are not set up');
    console.log('- Resume-related tests will fail if no resume data exists for the test user');
    console.log('- Web scraping test may fail for certain URLs due to anti-bot measures');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the server is running on port 8000');
      console.log('   Run: npm start');
    }
  }
}

// Run tests
testEndpoints();
