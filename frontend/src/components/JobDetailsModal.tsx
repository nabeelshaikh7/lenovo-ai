import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, Lightbulb, ChevronDown } from 'lucide-react';
import { Job } from '../types/job';
import { put } from '../lib/apiClient';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (jobId: string, newStatus: string) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !job) {
    return null;
  }

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOpenJobUrl = () => {
    if (job.url) {
      window.open(job.url, '_blank', 'noopener,noreferrer');
    }
  };

  const statusOptions = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'interview', label: 'Interview', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'offered', label: 'Offered', color: 'bg-green-100 text-green-800' }
  ];

  const currentStatus = statusOptions.find(option => option.value === job.status);

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === job.status) {
      setIsDropdownOpen(false);
      return;
    }

    setIsUpdating(true);
    setStatusError(null);

    try {
      await put(`/api/jobs/${job.id}/status`, { status: newStatus });
      
      // Call the parent callback to update the job status
      if (onStatusUpdate) {
        onStatusUpdate(job.id, newStatus);
      }
      
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update job status:', error);
      setStatusError(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-gray-600">{job.company}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Status Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Status
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isUpdating}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatus?.color || 'bg-gray-100 text-gray-800'}`}>
                    {currentStatus?.label || 'Unknown'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                    <div className="py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusUpdate(option.value)}
                          disabled={isUpdating}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                            {option.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {statusError && (
                <p className="mt-1 text-sm text-red-600">{statusError}</p>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Column - Job Description */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {job.description}
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Job Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900">{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary:</span>
                  <span className="text-gray-900">{job.salary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900">{job.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="text-gray-900">
                    {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((requirement, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {requirement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - AI Suggestions */}
          <div className="lg:w-80 bg-gray-50 p-6 overflow-y-auto">
            <div className="flex items-center mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
            </div>
            
            {job.ai_suggestions && job.ai_suggestions.suggestions.length > 0 ? (
              <ul className="space-y-3">
                {job.ai_suggestions.suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500"
                  >
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  No AI suggestions available for this job.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Use these suggestions to tailor your application
          </div>
          <div className="flex space-x-3">
            {job.url && (
              <button
                onClick={handleOpenJobUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Job</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
