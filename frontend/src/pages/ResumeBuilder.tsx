import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { PersonalInfoForm } from '../components/PersonalInfoForm';
import { WorkExperienceForm } from '../components/WorkExperienceForm';
import { EducationForm } from '../components/EducationForm';
import { SkillsForm } from '../components/SkillsForm';
import { ResumePreview } from '../components/ResumePreview';
import { ResumeCustomizer } from '../components/ResumeCustomizer';
import { ResumeData, PersonalInfo, WorkExperience, Education } from '../types/resume';
import { ResumeService, ResumeRecord } from '../lib/resumeService';
import { supabase } from '../lib/supabase';

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  },
  workExperience: [],
  education: [],
  skills: [],
};

export const ResumeBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load resume data from Supabase on component mount
  useEffect(() => {
    const loadResume = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const resumeRecord = await ResumeService.loadLatestResume();
        if (resumeRecord) {
          setResumeData(resumeRecord.data);
          setCurrentResumeId(resumeRecord.id);
        }
      } catch (error) {
        console.error('Error loading resume:', error);
        setSaveError('Failed to load resume data');
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, [isAuthenticated]);

  // Auto-save to Supabase whenever resumeData changes
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const autoSave = async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const savedResume = await ResumeService.autoSave(
          resumeData,
          'My Resume',
          currentResumeId || undefined
        );

        if (savedResume) {
          setCurrentResumeId(savedResume.id);
        } else {
          setSaveError('Failed to save resume');
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveError('Failed to save resume');
      } finally {
        setIsSaving(false);
      }
    };

    // Only auto-save if the data is not empty (has meaningful content)
    const hasContent = resumeData.personalInfo.fullName ||
                      resumeData.personalInfo.email ||
                      resumeData.workExperience.length > 0 ||
                      resumeData.education.length > 0 ||
                      resumeData.skills.length > 0;

    if (hasContent) {
      const timeoutId = setTimeout(autoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [resumeData, isAuthenticated, isLoading, currentResumeId]);

  const updatePersonalInfo = (info: PersonalInfo) => {
    setResumeData(prev => ({ ...prev, personalInfo: info }));
  };

  const updateWorkExperience = (experience: WorkExperience[]) => {
    setResumeData(prev => ({ ...prev, workExperience: experience }));
  };

  const updateEducation = (education: Education[]) => {
    setResumeData(prev => ({ ...prev, education }));
  };

  const updateSkills = (skills: string[]) => {
    setResumeData(prev => ({ ...prev, skills }));
  };

  const handleCustomizeResume = (customizedData: ResumeData) => {
    setResumeData(customizedData);
  };

  const clearAllData = async () => {
    if (!isAuthenticated) {
      // If not authenticated, just clear local state
      setResumeData(initialResumeData);
      setCurrentResumeId(null);
      setSaveError(null);
      return;
    }

    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setIsSaving(true);
      setSaveError(null);

      try {
        if (currentResumeId) {
          await ResumeService.deleteResume(currentResumeId);
        }
        setResumeData(initialResumeData);
        setCurrentResumeId(null);
      } catch (error) {
        console.error('Error clearing resume:', error);
        setSaveError('Failed to clear resume data');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
                <p className="text-gray-600">
                  {isAuthenticated
                    ? 'Create your professional resume (auto-saved to cloud)'
                    : 'Create your professional resume (local storage only)'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isLoading ? (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isAuthenticated ? 'Auto-saved' : 'Local storage'}</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={clearAllData}
                disabled={isLoading}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors disabled:opacity-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm">{saveError}</span>
            </div>
          )}

          {/* Authentication Warning */}
          {!isAuthenticated && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 text-sm">
                You're not signed in. Your resume data will only be saved locally and may be lost.
                <a href="/auth" className="ml-1 underline hover:text-yellow-900">Sign in</a> to save to the cloud.
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forms Section */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading your resume...</p>
                </div>
              </div>
            ) : (
              <>
                {jobId && (
                  <ResumeCustomizer
                    resumeData={resumeData}
                    jobId={jobId}
                    onCustomize={handleCustomizeResume}
                  />
                )}

                <PersonalInfoForm
                  personalInfo={resumeData.personalInfo}
                  onChange={updatePersonalInfo}
                />

                <WorkExperienceForm
                  workExperience={resumeData.workExperience}
                  onChange={updateWorkExperience}
                />

                <EducationForm
                  education={resumeData.education}
                  onChange={updateEducation}
                />

                <SkillsForm
                  skills={resumeData.skills}
                  onChange={updateSkills}
                />
              </>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : (
              <ResumePreview resumeData={resumeData} />
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          #resume-content,
          #resume-content * {
            visibility: visible;
          }
          
          #resume-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:max-w-full {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};