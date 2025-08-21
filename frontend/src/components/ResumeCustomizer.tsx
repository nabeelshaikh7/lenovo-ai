import React, { useState, useEffect } from 'react';
import { Download, Wand2, RefreshCw } from 'lucide-react';
import { ResumeData } from '../types/resume';
import { Job } from '../types/job';
import { post } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface ResumeCustomizerProps {
  resumeData: ResumeData;
  jobId?: string;
  onCustomize: (customizedData: ResumeData) => void;
}

// Mock job data for customization
const mockJobData: Record<string, Job> = {
  'job1': {
    id: 'job1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120,000 - $150,000',
    type: 'Full-time',
    description: 'We are looking for a senior frontend developer with expertise in React, TypeScript, and modern web technologies.',
    requirements: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Git', 'Agile', 'Problem Solving'],
    postedDate: '2024-01-15',
    status: 'applied'
  }
};

export const ResumeCustomizer: React.FC<ResumeCustomizerProps> = ({
  resumeData,
  jobId,
  onCustomize
}) => {
  const { user } = useAuth();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizedData, setCustomizedData] = useState<ResumeData>(resumeData);
  const [jobData, setJobData] = useState<Job | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);

  useEffect(() => {
    if (jobId && mockJobData[jobId]) {
      setJobData(mockJobData[jobId]);
    }
  }, [jobId]);

  const handleCustomize = async () => {
    if (!jobData || !user) return;

    setIsCustomizing(true);
    
    try {
      // Call the post function with the API endpoint and payload
      const result = await post('/api/process-job-application', {
        jobName: jobData.title,
        userId: user.id
      });

      // Update the suggestions state with the result
      setSuggestions(result);

      // Mock customization logic (keeping existing logic for now)
      const customized: ResumeData = {
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          summary: `Experienced ${jobData.title.toLowerCase()} with ${resumeData.workExperience.length}+ years of experience in ${jobData.requirements.slice(0, 3).join(', ')}. Proven track record of delivering high-quality solutions and collaborating effectively with cross-functional teams. Passionate about ${jobData.company}'s mission and excited to contribute to innovative projects.`
        },
        skills: [
          ...jobData.requirements.filter(req => 
            resumeData.skills.some(skill => 
              skill.toLowerCase().includes(req.toLowerCase()) || 
              req.toLowerCase().includes(skill.toLowerCase())
            )
          ),
          ...resumeData.skills.filter(skill => 
            !jobData.requirements.some(req => 
              skill.toLowerCase().includes(req.toLowerCase()) || 
              req.toLowerCase().includes(skill.toLowerCase())
            )
          )
        ].slice(0, 12), // Limit to 12 skills
        workExperience: resumeData.workExperience.map(exp => ({
          ...exp,
          description: exp.description + ` Utilized ${jobData.requirements.slice(0, 2).join(' and ')} to deliver exceptional results.`
        }))
      };

      setCustomizedData(customized);
      onCustomize(customized);
    } catch (error) {
      console.error('Error customizing resume:', error);
      // Handle error appropriately
    } finally {
      setIsCustomizing(false);
    }
  };

  const downloadResume = () => {
    // This would integrate with a PDF generation library
    const element = document.getElementById('resume-content');
    if (element) {
      // Mock download functionality
      alert('Resume download would be triggered here. In a real app, this would generate and download a PDF.');
    }
  };

  if (!jobData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          No job selected for customization. Your standard resume will be used.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Resume Customization</h3>
        <p className="text-gray-600">
          Customize your resume for: <span className="font-medium">{jobData.title}</span> at{' '}
          <span className="font-medium">{jobData.company}</span>
        </p>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Job Requirements Match</h4>
          <div className="flex flex-wrap gap-2">
            {jobData.requirements.map((req, index) => {
              const hasSkill = resumeData.skills.some(skill => 
                skill.toLowerCase().includes(req.toLowerCase()) || 
                req.toLowerCase().includes(skill.toLowerCase())
              );
              return (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm ${
                    hasSkill
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {req}
                  {hasSkill && ' ✓'}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleCustomize}
            disabled={isCustomizing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center space-x-2 transition-colors"
          >
            {isCustomizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Customizing Resume...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Customize for This Job</span>
              </>
            )}
          </button>

          <button
            onClick={downloadResume}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {customizedData !== resumeData && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ Resume has been customized for this job! The preview below shows your tailored resume.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};