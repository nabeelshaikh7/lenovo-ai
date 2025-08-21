import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SkillsFormProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export const SkillsForm: React.FC<SkillsFormProps> = ({
  skills,
  onChange,
}) => {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      onChange([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Skills</h3>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <div
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
            >
              <span>{skill}</span>
              <button
                onClick={() => removeSkill(skill)}
                className="ml-2 hover:text-blue-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        {skills.length === 0 && (
          <p className="text-gray-500 text-sm">No skills added yet. Start adding your skills below.</p>
        )}
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a skill (e.g., JavaScript, Project Management)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <button
          onClick={addSkill}
          disabled={!newSkill.trim() || skills.includes(newSkill.trim())}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center space-x-1 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
};