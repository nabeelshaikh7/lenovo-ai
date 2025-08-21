import React from 'react';
import { ResumeData } from '../types/resume';
import { Printer, Download } from 'lucide-react';

interface ResumePreviewProps {
  resumeData: ResumeData;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeData }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with actions */}
      <div className="flex justify-between items-center p-4 border-b print:hidden">
        <h3 className="text-lg font-semibold text-gray-800">Resume Preview</h3>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center space-x-1 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Resume Content */}
      <div className="p-8 print:p-0 max-w-none print:max-w-full" id="resume-content">
        {/* Header Section */}
        <div className="mb-8 text-center border-b-2 border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {resumeData.personalInfo.fullName || 'Your Name'}
          </h1>
          <div className="flex flex-wrap justify-center items-center space-x-4 text-gray-600 text-sm">
            {resumeData.personalInfo.email && (
              <span>{resumeData.personalInfo.email}</span>
            )}
            {resumeData.personalInfo.phone && (
              <span>•</span>
            )}
            {resumeData.personalInfo.phone && (
              <span>{resumeData.personalInfo.phone}</span>
            )}
            {resumeData.personalInfo.location && (
              <span>•</span>
            )}
            {resumeData.personalInfo.location && (
              <span>{resumeData.personalInfo.location}</span>
            )}
          </div>
        </div>

        {/* Summary Section */}
        {resumeData.personalInfo.summary && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {resumeData.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Work Experience Section */}
        {resumeData.workExperience.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">
              Work Experience
            </h2>
            <div className="space-y-6">
              {resumeData.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{exp.position}</h3>
                      <p className="text-gray-700 font-medium">{exp.company}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p>
                        {formatDate(exp.startDate)} - {exp.isCurrentJob ? 'Present' : formatDate(exp.endDate)}
                      </p>
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-gray-700 leading-relaxed ml-0">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {resumeData.education.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">
              Education
            </h2>
            <div className="space-y-4">
              {resumeData.education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {edu.degree} in {edu.field}
                    </h3>
                    <p className="text-gray-700">{edu.institution}</p>
                    {edu.gpa && (
                      <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p>{formatDate(edu.graduationDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {resumeData.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-1">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};