import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { Education } from '../types/resume';

interface EducationFormProps {
  education: Education[];
  onChange: (education: Education[]) => void;
}

export const EducationForm: React.FC<EducationFormProps> = ({
  education,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEducation, setNewEducation] = useState<Omit<Education, 'id'>>({
    institution: '',
    degree: '',
    field: '',
    graduationDate: '',
    gpa: '',
  });

  const addEducation = () => {
    const edu: Education = {
      ...newEducation,
      id: Date.now().toString(),
    };
    onChange([...education, edu]);
    setNewEducation({
      institution: '',
      degree: '',
      field: '',
      graduationDate: '',
      gpa: '',
    });
  };

  const updateEducation = (id: string, updatedEdu: Partial<Education>) => {
    onChange(
      education.map((edu) =>
        edu.id === id ? { ...edu, ...updatedEdu } : edu
      )
    );
  };

  const deleteEducation = (id: string) => {
    onChange(education.filter((edu) => edu.id !== id));
  };

  const EducationItem = ({ edu, isEditing }: { edu: Education; isEditing: boolean }) => {
    if (isEditing) {
      return (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="space-y-3">
            <input
              type="text"
              value={edu.institution}
              onChange={(e) => updateEducation(edu.id, { institution: e.target.value })}
              placeholder="Institution Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                placeholder="Degree (e.g., Bachelor's, Master's)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={edu.field}
                onChange={(e) => updateEducation(edu.id, { field: e.target.value })}
                placeholder="Field of Study"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                value={edu.graduationDate}
                onChange={(e) => updateEducation(edu.id, { graduationDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                placeholder="GPA (optional)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded-md flex items-center space-x-1 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900">{edu.degree} in {edu.field}</h4>
            <p className="text-sm text-gray-600">{edu.institution}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{edu.graduationDate}</span>
              {edu.gpa && <span>• GPA: {edu.gpa}</span>}
            </div>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setEditingId(edu.id)}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteEducation(edu.id)}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Education</h3>
      
      <div className="space-y-4 mb-6">
        {education.map((edu) => (
          <EducationItem
            key={edu.id}
            edu={edu}
            isEditing={editingId === edu.id}
          />
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Add Education</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={newEducation.institution}
              onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              placeholder="Institution Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                placeholder="Degree (e.g., Bachelor's, Master's)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={newEducation.field}
                onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
                placeholder="Field of Study"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                value={newEducation.graduationDate}
                onChange={(e) => setNewEducation({ ...newEducation, graduationDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={newEducation.gpa || ''}
                onChange={(e) => setNewEducation({ ...newEducation, gpa: e.target.value })}
                placeholder="GPA (optional)"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              onClick={addEducation}
              disabled={!newEducation.institution || !newEducation.degree || !newEducation.field}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Education</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};