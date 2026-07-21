export interface WriterProfileData {
  profileImage: string | null;
  bio: string;
  specializations: string[];
  education: EducationEntry[];
  languages: LanguageEntry[];
  subjects: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

export const SPECIALIZATIONS = [
  "Academic Writing",
  "Research Papers",
  "Essays",
  "Business Writing",
  "Technical Writing",
  "Creative Writing",
  "Dissertations",
  "Thesis",
  "Case Studies",
  "Literature Reviews",
  "Lab Reports",
  "Editing & Proofreading",
];

export const SUBJECTS = [
  "Literature",
  "History",
  "Psychology",
  "Business Studies",
  "Philosophy",
  "Economics",
  "Sociology",
  "Political Science",
  "Computer Science",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "Engineering",
  "Medicine",
  "Nursing",
  "Law",
  "Education",
  "Art & Design",
  "Music",
  "Environmental Science",
];

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
];

export const PROFICIENCY_LEVELS: { value: LanguageEntry['proficiency']; label: string }[] = [
  { value: 'native', label: 'Native' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'basic', label: 'Basic' },
];
