
export type AspectRatio = "16:9" | "9:16";
export type ImageStyle = 
  | "电影感" 
  | "静谧电影感"
  | "动漫" 
  | "吉卜力风格"
  | "皮克斯3D"
  | "赛博朋克" 
  | "水彩" 
  | "中国水墨"
  | "油画" 
  | "美漫风格"
  | "像素风" 
  | "线稿" 
  | "3D渲染"
  | "暗黑哥特"
  | "黏土定格"
  | "黑白电影";

export type TextModel = "gemini-2.5-flash" | "gemini-3-pro-preview";
export type ImageModel = "gemini-3-pro-image-preview" | "gemini-2.5-flash-image" | "imagen-3.0-generate-001";
export type ImageSize = "1K" | "2K"; // New type for resolution control
export type VideoModel = "veo-3.1-fast-generate-preview" | "veo-3.1-generate-preview";
export type Language = "Chinese" | "English"; // New language type

export interface StorySettings {
  storyText: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  sceneCount: number;
  language: Language; // New setting
  
  // Model Configuration
  textModel: TextModel;
  imageModel: ImageModel;
  imageSize: ImageSize; // Added setting
  videoModel: VideoModel;
  
  // Automation Settings
  autoGenerateChars: boolean; // New setting for Step 1 -> 2 transition

  // Analysis Data
  estimatedCharacterCount: number; // Dynamically analyzed character count
}

export interface Character {
  id: string;
  name: string;
  description: string; // The text analysis of the character
  visualPrompt: string; // Refined prompt for image generation
  speakerStyle: string; // Voice/Acting style suggestions
  imageUrl?: string; // The generated reference image
  isLoading?: boolean;
}

export interface Scene {
  id: string;
  number: number;
  description: string;
  dialogue: string;
  action: string;
  camera: string;
  visualPrompt: string; // Full prompt including character details
  imageUrl?: string;
  isLoading?: boolean;
  
  // Consistency fields
  characters?: string[]; // List of character names appearing in this scene
  
  // Audio & Timing
  soundPrompt?: string; // Prompt for sound effects or background music
  estimatedDuration?: string; // Estimated duration in seconds (e.g., "5s")
  
  // Transition
  transition?: string; // Suggestion for transition to the next scene (e.g., Cut, Dissolve)

  // Video generation fields
  videoPrompt?: string; // Specific prompt for Veo
  videoUrl?: string;
  isVideoLoading?: boolean;

  // Audio/TTS generation fields
  audioUrl?: string;
  isAudioLoading?: boolean;
}

export interface AppState {
  step: 1 | 2 | 3 | 4;
  settings: StorySettings;
  characters: Character[];
  scenes: Scene[];
  isAnalyzing: boolean;
  analysisSuggestion: string; // Stores the AI director's analysis from Step 1
}

export const INITIAL_SETTINGS: StorySettings = {
  storyText: "",
  style: "电影感",
  aspectRatio: "16:9",
  sceneCount: 8,
  language: "Chinese", // Default language
  textModel: "gemini-3-pro-preview", // Changed default to 3.0 Pro
  imageModel: "gemini-2.5-flash-image", // Default to 2.5 Flash Image
  imageSize: "1K", // Default to 1K to save cost
  videoModel: "veo-3.1-fast-generate-preview", // Changed default to Veo 3.1 Fast
  estimatedCharacterCount: 4, // Default fallback
  autoGenerateChars: true // Default to true
};