import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { WorkExperience } from '../types/resume';

interface WorkExperienceFormProps {
  workExperience: WorkExperience[];
  onChange: (experience: WorkExperience[]) => void;
}

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  workExperience,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExperience, setNewExperience] = useState<Omit<WorkExperience, 'id'>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    description: '',
  });

  const addExperience = () => {
    const experience: WorkExperience = {
      ...newExperience,
      id: Date.now().toString(),
    };
    onChange([...workExperience, experience]);
    setNewExperience({
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      isCurrentJob: false,
      description: '',
    });
  };

  const updateExperience = (id: string, updatedExp: Partial<WorkExperience>) => {
    onChange(
      workExperience.map((exp) =>
        exp.id === id ? { ...exp, ...updatedExp } : exp
      )
    );
  };

  const deleteExperience = (id: string) => {
    onChange(workExperience.filter((exp) => exp.id !== id));
  };

  const ExperienceItem = ({ exp, isEditing }: { exp: WorkExperience; isEditing: boolean }) => {
    if (isEditing) {
      return (
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                placeholder="Company Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                placeholder="Job Title"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                value={exp.startDate}
                onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                  disabled={exp.isCurrentJob}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={exp.isCurrentJob}
                    onChange={(e) => updateExperience(exp.id, { 
                      isCurrentJob: e.target.checked,
                      endDate: e.target.checked ? '' : exp.endDate
                    })}
                    className="mr-1"
                  />
                  Current
                </label>
              </div>
            </div>
            
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
              placeholder="Job description and key achievements..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="flex justify-end space-x-2">
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
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium text-gray-900">{exp.position}</h4>
            <p className="text-sm text-gray-600">{exp.company}</p>
            <p className="text-xs text-gray-500">
              {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate}
            </p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setEditingId(exp.id)}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteExperience(exp.id)}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {exp.description && (
          <p className="text-sm text-gray-700 line-clamp-3">{exp.description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Experience</h3>
      
      <div className="space-y-4 mb-6">
        {workExperience.map((exp) => (
          <ExperienceItem
            key={exp.id}
            exp={exp}
            isEditing={editingId === exp.id}
          />
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Add New Experience</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                placeholder="Company Name"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={newExperience.position}
                onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                placeholder="Job Title"
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="date"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={newExperience.endDate}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  disabled={newExperience.isCurrentJob}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={newExperience.isCurrentJob}
                    onChange={(e) => setNewExperience({ 
                      ...newExperience, 
                      isCurrentJob: e.target.checked,
                      endDate: e.target.checked ? '' : newExperience.endDate
                    })}
                    className="mr-1"
                  />
                  Current
                </label>
              </div>
            </div>
            
            <textarea
              value={newExperience.description}
              onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
              placeholder="Job description and key achievements..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <button
              onClick={addExperience}
              disabled={!newExperience.company || !newExperience.position}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Experience</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};