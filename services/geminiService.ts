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
  story: string,
  model: string = "gemini-2.5-flash"
): Promise<Character[]> => {
  const ai = getClient();
  
  const systemInstruction = `你是一位专业的编剧和角色设计师。
  分析提供的故事并提取主要角色。
  对于每个角色，请提供：
  1. 姓名 (name)
  2. 简短的性格和角色描述 (description，使用中文)
  3. 极其详细的视觉描述 (visualPrompt，使用中文)，用于AI绘画生成 (包含外貌、服装、关键特征)。`;

  const response = await ai.models.generateContent({
    model: model,
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

// --- Helper: Universal Image Generator ---
const generateImageInternal = async (
  prompt: string, 
  model: string, 
  aspectRatio: string
): Promise<string> => {
    const ai = getClient();
    
    // Clean aspect ratio
    const validRatio = ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio) 
      ? aspectRatio 
      : "1:1";

    // CASE 1: Imagen Models
    if (model.includes("imagen")) {
        const response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: validRatio,
            },
        });
        const base64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64) throw new Error("Imagen generation failed");
        return `data:image/jpeg;base64,${base64}`;
    } 
    
    // CASE 2: Gemini Models (2.5 Flash Image, 3 Pro Image)
    else {
        const config: any = {
            imageConfig: {
                aspectRatio: validRatio,
            }
        };

        if (model === "gemini-3-pro-image-preview") {
            config.imageConfig.imageSize = "1K";
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: prompt }]
            },
            config: config,
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Gemini image generation failed");
    }
};

// --- Step 2b: Generate Character Reference Image ---

export const generateCharacterImage = async (
  character: Character,
  style: string,
  aspectRatio: string,
  model: string = "gemini-3-pro-image-preview"
): Promise<string> => {
  const prompt = `Character Design Sheet, style: ${style}. ${character.visualPrompt}. Neutral background, full body shot, detailed character design.`;
  return generateImageInternal(prompt, model, aspectRatio);
};

// --- Step 3: Breakdown Scenes ---

export const breakdownScenes = async (
  story: string,
  sceneCount: number,
  characters: Character[],
  model: string = "gemini-2.5-flash"
): Promise<Scene[]> => {
  const ai = getClient();

  const characterContext = characters.map(c => `${c.name}: ${c.visualPrompt}`).join("\n");

  const systemInstruction = `你是一位专业的分镜师。
  将故事分解为恰好 ${sceneCount} 个关键场景。
  
  **关键要求 - 角色一致性**：
  1. 必须明确列出每个场景中出现的角色名字（必须与角色档案中的名字完全一致）。
  2. 场景的 "visualPrompt" 必须再次详细描述角色的穿着和外貌，不要只写名字。
  
  **其他要求**:
  1. 所有输出内容必须使用中文 (visualPrompt, videoPrompt 除外)。
  2. **videoPrompt (英文)**: 专用于生成视频。必须专注于**视觉动作**和**运镜** (如 "Slow pan right, character is running")。不要包含对白。
  3. **soundPrompt (中文)**: 描述该场景的音效 (SFX) 和背景音乐氛围。
  4. **estimatedDuration**: 估计该镜头在成片中的时长 (如 "5s")。
  
  角色档案:
  ${characterContext}
  `;

  const response = await ai.models.generateContent({
    model: model,
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
            visualPrompt: { type: Type.STRING, description: "用于生成图像的详细提示词 (中文)" },
            videoPrompt: { type: Type.STRING, description: "用于Veo生成的视频提示词 (English, Motion focused, NO dialogue)" },
            soundPrompt: { type: Type.STRING, description: "音效与音乐提示词 (中文)" },
            estimatedDuration: { type: Type.STRING, description: "预估时长 e.g. '4s'" },
            characters: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "本场景中出现的角色名字列表 (必须与角色档案中的名字完全一致)" 
            }
          },
          required: ["number", "description", "dialogue", "action", "camera", "visualPrompt", "videoPrompt", "soundPrompt", "estimatedDuration", "characters"],
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
  settings: StorySettings,
  allCharacters: Character[] = [] 
): Promise<string> => {
  
  // Consistency Strategy: Explicitly inject Character Definitions into the prompt
  // based on the characters listed in the scene.
  
  let characterDefs = "";
  if (scene.characters && scene.characters.length > 0) {
     const defs: string[] = [];
     scene.characters.forEach(name => {
        // Loose matching for robustness
        const char = allCharacters.find(c => c.name.includes(name) || name.includes(c.name));
        if (char) {
           defs.push(`CHARACTER [${char.name}] VISUAL DEF: ${char.visualPrompt}`);
        }
     });
     if (defs.length > 0) {
         characterDefs = "IMPORTANT CHARACTER REFERENCES (MAINTAIN CONSISTENCY):\n" + defs.join("\n") + "\n\n";
     }
  }

  const prompt = `Style: ${settings.style}. Cinematic shot.
  
  ${characterDefs}

  SCENE CONTENT:
  ${scene.visualPrompt} 
  
  Camera: ${scene.camera}. 
  High quality, detailed, 8k resolution.`;

  return generateImageInternal(prompt, settings.imageModel, settings.aspectRatio);
};

// --- Step 3c: Generate Scene Video (Veo) ---

export const generateSceneVideo = async (
  scene: Scene,
  settings: StorySettings
): Promise<string> => {
  const ai = getClient();
  const apiKey = process.env.API_KEY;

  if (!scene.imageUrl) {
    throw new Error("请先生成场景图片，视频生成需要参考图。");
  }

  // Remove data:image/ prefix (support png and jpeg)
  const base64Image = scene.imageUrl.split(",")[1];
  const mimeType = scene.imageUrl.split(";")[0].split(":")[1] || 'image/png';
  
  // Ensure prompt focuses on motion, not dialogue
  // Veo generates silent video. Dialogue in prompt might confuse it.
  const prompt = scene.videoPrompt || `${scene.description}. Cinematic motion, slow motion, high quality.`;

  const veoRatio = settings.aspectRatio === "9:16" ? "9:16" : "16:9";

  // Use selected video model
  const videoModel = settings.videoModel || 'veo-3.1-fast-generate-preview';

  let operation = await ai.models.generateVideos({
    model: videoModel,
    prompt: prompt,
    image: {
      imageBytes: base64Image,
      mimeType: mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: veoRatio
    }
  });

  // Polling loop
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  if (operation.error) {
    const errorMsg = operation.error.message ? String(operation.error.message) : "Video generation failed";
    throw new Error(errorMsg);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!downloadLink) {
    throw new Error("No video URI returned");
  }

  // Fetch the actual video bytes
  const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
  if (!videoResponse.ok) {
    throw new Error("Failed to download video file");
  }
  
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};