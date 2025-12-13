import { GoogleGenAI, Type } from "@google/genai";
import { Character, Scene, StorySettings } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// --- Step 2: Analyze Characters ---

export const analyzeCharacters = async (
  story: string
): Promise<Character[]> => {
  const ai = getClient();
  
  const systemInstruction = `你是一位专业的编剧和角色设计师。
  分析提供的故事并提取主要角色。
  对于每个角色，请提供：
  1. 姓名 (name)
  2. 简短的性格和角色描述 (description，使用中文)
  3. 极其详细的视觉描述 (visualPrompt，使用中文)，用于AI绘画生成 (包含外貌、服装、关键特征)。`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `分析这个故事并提取角色:\n\n${story}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING, description: "性格和角色定位 (中文)" },
            visualPrompt: { type: Type.STRING, description: "用于图像生成的详细外貌描写 (中文)" },
          },
          required: ["name", "description", "visualPrompt"],
        },
      },
    },
  });

  const rawData = JSON.parse(response.text || "[]");
  
  return rawData.map((char: any, index: number) => ({
    id: `char-${index}-${Date.now()}`,
    name: char.name,
    description: char.description,
    visualPrompt: char.visualPrompt,
  }));
};

// --- Step 2b: Generate Character Reference Image ---

export const generateCharacterImage = async (
  character: Character,
  style: string,
  aspectRatio: string
): Promise<string> => {
  const ai = getClient();
  
  // Clean aspect ratio for image model (supported: 1:1, 3:4, 4:3, 9:16, 16:9)
  const validRatio = ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) 
    ? aspectRatio 
    : "1:1";

  const prompt = `Character Design Sheet, style: ${style}. ${character.visualPrompt}. Neutral background, full body shot, detailed character design.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
        parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: validRatio,
        imageSize: "1K",
      },
    },
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// --- Step 3: Breakdown Scenes ---

export const breakdownScenes = async (
  story: string,
  sceneCount: number,
  characters: Character[]
): Promise<Scene[]> => {
  const ai = getClient();

  const characterContext = characters.map(c => `${c.name}: ${c.visualPrompt}`).join("\n");

  const systemInstruction = `你是一位专业的分镜师。
  将故事分解为恰好 ${sceneCount} 个关键场景。
  
  **重要要求**：
  1. 所有输出内容必须使用中文 (visualPrompt 除外，可以使用中文或英文，建议中文详细描述)。
  2. 视觉描述 (visualPrompt) 必须包含基于角色档案的具体外貌细节，以确保人物一致性。
  
  角色档案:
  ${characterContext}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `故事内容: ${story}\n\n生成 ${sceneCount} 个分镜场景。`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            number: { type: Type.INTEGER },
            description: { type: Type.STRING, description: "场景发生的动作描述 (中文)" },
            dialogue: { type: Type.STRING, description: "关键对白或'无对白' (中文)" },
            action: { type: Type.STRING, description: "动作类型摘要" },
            camera: { type: Type.STRING, description: "镜头角度、景别 (如特写、广角) (中文)" },
            visualPrompt: { type: Type.STRING, description: "用于生成图像的详细提示词，必须再次包含角色外貌特征 (中文)" },
          },
          required: ["number", "description", "dialogue", "action", "camera", "visualPrompt"],
        },
      },
    },
  });

  const rawData = JSON.parse(response.text || "[]");

  return rawData.map((scene: any, index: number) => ({
    id: `scene-${index}-${Date.now()}`,
    ...scene
  }));
};

// --- Step 3b: Generate Scene Image ---

export const generateSceneImage = async (
  scene: Scene,
  settings: StorySettings
): Promise<string> => {
  const ai = getClient();

  const validRatio = ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(settings.aspectRatio) 
    ? settings.aspectRatio 
    : "16:9";

  const prompt = `Style: ${settings.style}. Cinematic shot. 
  ${scene.visualPrompt} 
  Camera: ${scene.camera}. 
  High quality, detailed, 8k resolution.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: {
        parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: validRatio,
        imageSize: "1K",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};