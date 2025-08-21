import React from 'react';
import { Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';
import { Job } from '../types/job';

interface JobCardProps {
  job: Job;
  onClick?: (job: Job) => void;
  showApplyButton?: boolean;
  className?: string;
}

export const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  onClick, 
  showApplyButton = true,
  className = '' 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(job);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle apply logic here
    console.log('Applying to job:', job.id);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {job.title}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="text-sm">{job.company}</span>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span className="text-sm">{job.location}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="text-sm">{job.salary}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span className="text-sm">{job.type}</span>
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.requirements.slice(0, 3).map((requirement, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {requirement}
                </span>
              ))}
              {job.requirements.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                  +{job.requirements.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Posted Date */}
        <div className="text-xs text-gray-500 mb-4">
          Posted {new Date(job.postedDate).toLocaleDateString()}
        </div>

        {/* Action Button */}
        {showApplyButton && (
          <button
            onClick={handleApplyClick}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};
