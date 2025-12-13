export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type ImageStyle = "电影感" | "动漫" | "水彩" | "赛博朋克" | "像素风" | "线稿" | "3D渲染" | "油画";

export interface StorySettings {
  storyText: string;
  style: ImageStyle;
  aspectRatio: AspectRatio;
  sceneCount: number;
}

export interface Character {
  id: string;
  name: string;
  description: string; // The text analysis of the character
  visualPrompt: string; // Refined prompt for image generation
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
}

export interface AppState {
  step: 1 | 2 | 3 | 4;
  settings: StorySettings;
  characters: Character[];
  scenes: Scene[];
  isAnalyzing: boolean;
}

export const INITIAL_SETTINGS: StorySettings = {
  storyText: "",
  style: "电影感",
  aspectRatio: "16:9",
  sceneCount: 4,
};