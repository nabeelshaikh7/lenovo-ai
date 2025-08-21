import { supabase } from './supabase';
import { ResumeData } from '../types/resume';

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  data: ResumeData;
  created_at: string;
  updated_at: string;
}

export class ResumeService {
  /**
   * Create or update a resume for the current user
   */
  static async saveResume(
    resumeData: ResumeData,
    title: string = 'My Resume',
    resumeId?: string
  ): Promise<ResumeRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const resumeRecord = {
        user_id: user.id,
        title,
        data: resumeData,
        updated_at: new Date().toISOString()
      };

      if (resumeId) {
        // Update existing resume
        const { data, error } = await supabase
          .from('resumes')
          .update(resumeRecord)
          .eq('id', resumeId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new resume
        const { data, error } = await supabase
          .from('resumes')
          .insert(resumeRecord)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      return null;
    }
  }

  /**
   * Load a resume by ID for the current user
   */
  static async loadResume(resumeId: string): Promise<ResumeRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Resume not found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error loading resume:', error);
      return null;
    }
  }

  /**
   * Load the user's most recent resume
   */
  static async loadLatestResume(): Promise<ResumeRecord | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading latest resume:', error);
      return null;
    }
  }

  /**
   * Get all resumes for the current user
   */
  static async getUserResumes(): Promise<ResumeRecord[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading user resumes:', error);
      return [];
    }
  }

  /**
   * Delete a resume
   */
  static async deleteResume(resumeId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      return false;
    }
  }

  /**
   * Auto-save resume with debouncing
   */
  static async autoSave(
    resumeData: ResumeData,
    title: string = 'My Resume',
    resumeId?: string
  ): Promise<ResumeRecord | null> {
    try {
      // Add a small delay to prevent excessive API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await this.saveResume(resumeData, title, resumeId);
    } catch (error) {
      console.error('Auto-save failed:', error);
      return null;
    }
  }
}
