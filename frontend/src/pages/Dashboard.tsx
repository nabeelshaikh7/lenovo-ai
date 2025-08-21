import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { JobApplication, Job } from '../types/job';
import { get } from '../lib/apiClient';
import { JobCard } from '../components/JobCard';
import { JobDetailsModal } from '../components/JobDetailsModal';

// Mock data for demonstration
const mockApplications: JobApplication[] = [
  {
    id: '1',
    jobId: 'job1',
    job: {
      id: 'job1',
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      type: 'Full-time',
      description: 'We are looking for a senior frontend developer...',
      requirements: ['React', 'TypeScript', '5+ years experience'],
      postedDate: '2024-01-15',
      status: 'applied'
    },
    appliedDate: '2024-01-16',
    status: 'interview'
  },
  {
    id: '2',
    jobId: 'job2',
    job: {
      id: 'job2',
      title: 'Full Stack Engineer',
      company: 'StartupXYZ',
      location: 'Remote',
      salary: '$100,000 - $130,000',
      type: 'Full-time',
      description: 'Join our growing team as a full stack engineer...',
      requirements: ['Node.js', 'React', 'MongoDB'],
      postedDate: '2024-01-10',
      status: 'applied'
    },
    appliedDate: '2024-01-12',
    status: 'pending'
  },
  {
    id: '3',
    jobId: 'job3',
    job: {
      id: 'job3',
      title: 'UI/UX Designer',
      company: 'Design Studio',
      location: 'New York, NY',
      salary: '$80,000 - $100,000',
      type: 'Full-time',
      description: 'Creative UI/UX designer needed...',
      requirements: ['Figma', 'Adobe Creative Suite', '3+ years experience'],
      postedDate: '2024-01-08',
      status: 'applied'
    },
    appliedDate: '2024-01-09',
    status: 'rejected'
  }
];

const mockRecommendedJobs: Job[] = [
  {
    id: 'rec1',
    title: 'React Developer',
    company: 'InnovateTech',
    location: 'Austin, TX',
    salary: '$90,000 - $120,000',
    type: 'Full-time',
    description: 'We are seeking a passionate React developer to join our growing team. You will be responsible for building and maintaining high-quality web applications using modern React practices. The ideal candidate should have strong JavaScript fundamentals and experience with state management libraries.\n\nKey responsibilities include:\n• Developing new user-facing features using React\n• Building reusable code and libraries for future use\n• Ensuring the technical feasibility of UI/UX designs\n• Optimizing applications for maximum speed and scalability\n• Collaborating with other team members and stakeholders',
    requirements: ['React', 'JavaScript', 'CSS', 'Git', 'REST APIs'],
    postedDate: '2024-01-18',
    status: 'applied',
    url: 'https://example.com/jobs/react-developer',
    ai_suggestions: {
      suggestions: [
        'Highlight your React experience in the first paragraph of your resume',
        'Include specific metrics about performance improvements you\'ve made',
        'Mention any experience with state management libraries like Redux or Zustand',
        'Emphasize your experience with modern React patterns (hooks, functional components)',
        'Include examples of responsive design work in your portfolio'
      ]
    }
  },
  {
    id: 'rec2',
    title: 'Frontend Engineer',
    company: 'WebSolutions',
    location: 'Remote',
    salary: '$95,000 - $125,000',
    type: 'Full-time',
    description: 'Join our remote team as a Frontend Engineer where you\'ll work on cutting-edge web applications. We\'re looking for someone who is passionate about creating exceptional user experiences and has a strong foundation in modern frontend technologies.\n\nIn this role, you will:\n• Develop and maintain web applications using Vue.js and TypeScript\n• Work closely with designers to implement pixel-perfect UI components\n• Write clean, maintainable, and well-documented code\n• Participate in code reviews and contribute to team best practices\n• Collaborate with backend developers to integrate APIs',
    requirements: ['Vue.js', 'TypeScript', 'Tailwind CSS', 'Vuex', 'Jest'],
    postedDate: '2024-01-17',
    status: 'applied',
    url: 'https://example.com/jobs/frontend-engineer',
    ai_suggestions: {
      suggestions: [
        'Start your cover letter by mentioning your Vue.js expertise',
        'Include specific examples of TypeScript projects you\'ve worked on',
        'Highlight any experience with testing frameworks like Jest',
        'Mention your experience with CSS frameworks and responsive design',
        'Include links to live projects in your application'
      ]
    }
  }
];

export const Dashboard: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchJobs = async () => {
    try {
      setError(null);
      const response = await get('/api/jobs');
      
      // Assuming the API returns an object with applications and recommendedJobs
      if (response.applications) {
        setApplications(response.applications);
      }
      if (response.recommendedJobs) {
        setRecommendedJobs(response.recommendedJobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      
      // Fallback to mock data if API fails
      setApplications(mockApplications);
      setRecommendedJobs(mockRecommendedJobs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch when component mounts
    fetchJobs();

    // Set up interval to fetch every 5 seconds
    const interval = setInterval(fetchJobs, 5000);

    // Cleanup interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'interview':
        return <Star className="w-5 h-5 text-blue-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'offered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCustomizeResume = (jobId: string) => {
    // Navigate to resume builder with job context
    window.location.href = `/resume-builder?jobId=${jobId}`;
  };

  const handleJobCardClick = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleStatusUpdate = (jobId: string, newStatus: string) => {
    // Update the job status in the recommended jobs list
    setRecommendedJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, status: newStatus as 'applied' | 'interview' | 'rejected' | 'offered' }
          : job
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Track your applications and discover new opportunities</p>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                <p className="text-gray-600 text-sm">Total Applications</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
                <p className="text-gray-600 text-sm">Pending</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'interview').length}
                </p>
                <p className="text-gray-600 text-sm">Interviews</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {applications.filter(app => app.status === 'offered').length}
                </p>
                <p className="text-gray-600 text-sm">Offers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">My Applications</h2>
              </div>
              <div className="divide-y">
                {isLoading ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading applications...
                  </div>
                ) : applications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No applications found
                  </div>
                ) : (
                  applications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {application.job.title}
                        </h3>
                        <p className="text-gray-600">{application.job.company}</p>
                        <p className="text-sm text-gray-500">
                          {application.job.location} • {application.job.salary}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(application.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Applied on {new Date(application.appliedDate).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCustomizeResume(application.jobId)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md text-sm flex items-center space-x-1 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Customize Resume</span>
                        </button>
                        <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm flex items-center space-x-1 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span>View Job</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>

          {/* Recommended Jobs */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recommended Jobs</h2>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center text-gray-500">
                    Loading recommended jobs...
                  </div>
                ) : recommendedJobs.length === 0 ? (
                  <div className="text-center text-gray-500">
                    No recommended jobs found
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {recommendedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onClick={handleJobCardClick}
                        showApplyButton={true}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t">
                <Link
                  to="/job-preferences"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Update job preferences →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};