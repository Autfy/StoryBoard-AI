import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Character, Scene, StorySettings, ImageSize, Language } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// --- API Key Validation ---

export const validateApiKey = async (): Promise<boolean> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("API Key is missing in environment variables.");
        return false;
    }
    
    const ai = new GoogleGenAI({ apiKey });
    // Use a lightweight operation to verify the key
    await ai.models.countTokens({
      model: "gemini-2.5-flash",
      contents: { parts: [{ text: "test" }] }
    });
    return true;
  } catch (e) {
    console.error("API Key validation failed:", e);
    return false;
  }
};

// --- Step 1b: Story Suggestions & Analysis ---

export const getStorySuggestions = async (
    story: string,
    sceneCount: number,
    style: string,
    model: string = "gemini-2.5-flash"
): Promise<{ suggestion: string, characterCount: number }> => {
    const ai = getClient();
    
    const systemInstruction = `你是一位资深分镜导演和制片人。
    请根据用户提供的故事大纲、预选风格(${style})和预选分镜数(${sceneCount})，进行分析。
    
    请分析并提取两个关键信息：
    1. **角色数量估算**：根据故事内容，判断需要设计几个主要角色（用于后续生成角色立绘）。
    2. **分析建议报告**：生成一份极简的分析报告（Markdown格式）。

    **分析报告格式要求**：
    *   **核心建议**：
        *   **故事主题**：[一句话概括]
        *   **建议风格**：[${style} 或推荐风格]
        *   **建议分镜**：[${sceneCount} 或推荐数量]
        *   **角色数量**：[建议的角色数量] 人
    *   **节奏分析**：[简短点评节奏与张力]
    *   **风格建议**：[简短描述光影与视觉基调]
    *   **分镜逻辑**：[简短描述镜头分配思路，如：起(1-2)-承(3-4)-转(5-6)-合(7-8)]
    
    要求：语言极其简练，直击重点，不要详细展开。`;

    const response = await ai.models.generateContent({
        model: model,
        contents: `故事大纲: ${story}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    suggestion: { type: Type.STRING, description: "Markdown格式的分析建议报告" },
                    characterCount: { type: Type.INTEGER, description: "估算的主要角色数量" }
                },
                required: ["suggestion", "characterCount"]
            },
            temperature: 0.7, 
        }
    });

    const json = JSON.parse(response.text || "{}");
    return {
        suggestion: json.suggestion || "无法生成建议。",
        characterCount: typeof json.characterCount === 'number' ? json.characterCount : 4
    };
};

// --- Step 2: Analyze Characters ---

export const analyzeCharacters = async (
  story: string,
  model: string = "gemini-2.5-flash",
  language: Language = "Chinese"
): Promise<Character[]> => {
  const ai = getClient();
  
  const systemInstruction = `你是一位专业的编剧和角色设计师。
  分析提供的故事并提取主要角色。
  对于每个角色，请提供：
  1. 姓名 (name)
  2. 简短的性格和角色描述 (description，使用${language})。
  3. 极其详细的视觉描述 (visualPrompt，使用${language})，用于AI绘画生成 (包含外貌、服装、关键特征)。
  4. 说话/配音风格建议 (speakerStyle, 使用${language})，描述角色的声线特质和说话习惯（例如：语速快、沉稳低音、活泼高亢）。`;

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
            description: { type: Type.STRING, description: `性格和角色定位 (${language})` },
            visualPrompt: { type: Type.STRING, description: `用于图像生成的详细外貌描写 (${language})` },
            speakerStyle: { type: Type.STRING, description: `说话风格和声线建议 (${language})` },
          },
          required: ["name", "description", "visualPrompt", "speakerStyle"],
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
    speakerStyle: char.speakerStyle || "Standard Voice",
  }));
};

// --- Helper: Universal Image Generator ---
const generateImageInternal = async (
  prompt: string, 
  model: string, 
  aspectRatio: string,
  imageSize: ImageSize = "1K" // Added imageSize parameter
): Promise<string> => {
    const ai = getClient();
    
    // Strict clean aspect ratio for Veo compatibility
    // Now we only support 16:9 and 9:16
    const validRatio = ["16:9", "9:16"].includes(aspectRatio) 
      ? aspectRatio 
      : "16:9";

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
            // Dynamically set based on user preference
            config.imageConfig.imageSize = imageSize;
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
  model: string = "gemini-2.5-flash-image", // Updated default to Flash Image to avoid Permission errors
  imageSize: ImageSize = "1K"
): Promise<string> => {
  const prompt = `Character Design Sheet, style: ${style}. ${character.visualPrompt}. Neutral background, full body shot, detailed character design.`;
  return generateImageInternal(prompt, model, aspectRatio, imageSize);
};

// --- Step 3: Breakdown Scenes ---

export const breakdownScenes = async (
  story: string,
  sceneCount: number,
  characters: Character[],
  model: string = "gemini-2.5-flash",
  language: Language = "Chinese"
): Promise<Scene[]> => {
  const ai = getClient();

  // Include speakerStyle in the context
  const characterContext = characters.map(c => 
    `NAME: ${c.name}\nVISUAL: ${c.visualPrompt}\nSPEAKER_STYLE: ${c.speakerStyle}`
  ).join("\n\n");

  const systemInstruction = `你是一位专业的分镜师。
  将故事分解为恰好 ${sceneCount} 个关键场景。
  
  **关键要求 - 角色一致性**：
  1. 必须明确列出每个场景中出现的角色名字（必须与角色档案中的名字完全一致）。
  2. 场景的 "visualPrompt" 必须再次详细描述角色的穿着和外貌，不要只写名字。
  
  **其他要求**:
  1. **所有输出内容（对白、描述、镜头、转场）必须使用${language}** (visualPrompt, videoPrompt 除外)。
  2. **videoPrompt (English)**: 专用于生成视频。必须专注于**视觉动作**和**运镜**。
     *   **重要**: 将角色的 "SPEAKER_STYLE" (说话风格) 转化为**视觉化的表演指令**。
     *   例如：如果 SPEAKER_STYLE 是 "aggressive/shouting"，videoPrompt 应包含 "angry facial expression, gesturing wildly"。
     *   如果 SPEAKER_STYLE 是 "shy/whispering"，videoPrompt 应包含 "looking down, subtle movements"。
     *   不要包含对白文本，只描述动作。
  3. **soundPrompt (${language})**: 描述该场景的音效 (SFX) 和背景音乐氛围。
  4. **transition (${language})**: 建议该场景**结束时**连接到下一个场景的转场方式（例如：硬切 Cut、叠化 Dissolve、淡出 Fade out、匹配剪辑 Match Cut、甩镜头 Whip Pan 等），目的是让视频拼接不突兀，流畅自然。
  5. **estimatedDuration**: 估计该镜头在成片中的时长 (如 "5s")。
  
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
            description: { type: Type.STRING, description: `场景发生的动作描述 (${language})` },
            dialogue: { type: Type.STRING, description: `关键对白或'无对白' (${language})` },
            action: { type: Type.STRING, description: "动作类型摘要" },
            camera: { type: Type.STRING, description: `镜头角度、景别 (如特写、广角) (${language})` },
            visualPrompt: { type: Type.STRING, description: `用于生成图像的详细提示词 (${language})` },
            videoPrompt: { type: Type.STRING, description: "用于Veo生成的视频提示词 (English, Motion focused, based on speaker style)" },
            soundPrompt: { type: Type.STRING, description: `音效与音乐提示词 (${language})` },
            transition: { type: Type.STRING, description: `到下一镜头的转场建议 (${language})` },
            estimatedDuration: { type: Type.STRING, description: "预估时长 e.g. '4s'" },
            characters: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "本场景中出现的角色名字列表 (必须与角色档案中的名字完全一致)" 
            }
          },
          required: ["number", "description", "dialogue", "action", "camera", "visualPrompt", "videoPrompt", "soundPrompt", "transition", "estimatedDuration", "characters"],
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

  return generateImageInternal(prompt, settings.imageModel, settings.aspectRatio, settings.imageSize);
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
  // CRITICAL: Ensure we have some text to avoid empty prompt errors.
  const prompt = (scene.videoPrompt && scene.videoPrompt.trim().length > 5) 
    ? scene.videoPrompt 
    : `${scene.description}. Cinematic motion, slow motion, high quality.`;

  // Veo strictly supports "16:9" or "9:16".
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
  // Safety break counter to prevent infinite loops (e.g. max 120s)
  let attempts = 0;
  const maxAttempts = 24; // 24 * 5s = 2 minutes

  while (!operation.done) {
    if (attempts >= maxAttempts) {
        throw new Error("Video generation timed out (2 mins).");
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Pass the name property correctly if available, or the whole operation object
    // The SDK expects { operation: string | Operation }
    operation = await ai.operations.getVideosOperation({operation: operation});
    attempts++;
  }

  if (operation.error) {
    const errorMsg = operation.error.message ? String(operation.error.message) : "Video generation failed with unknown error";
    throw new Error(errorMsg);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
  if (!downloadLink) {
    console.error("Operation completed but no video URI:", JSON.stringify(operation, null, 2));
    throw new Error("Video generation completed, but no video URI was returned. This may be due to safety filters blocking the output.");
  }

  // Fetch the actual video bytes
  const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video file: ${videoResponse.statusText}`);
  }
  
  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};

// --- Step 3d: Generate Audio (TTS) ---

// Helper: Convert Raw PCM to WAV Blob
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmData.length;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    const bytes = new Uint8Array(buffer, 44);
    bytes.set(pcmData);

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Decode Base64 helper
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const generateSceneAudio = async (
    scene: Scene,
    settings: StorySettings,
    voiceName: string = 'Kore' // Default voice
): Promise<string> => {
    const ai = getClient();
    
    // Fallback dialogue if empty
    const textToSay = (scene.dialogue && scene.dialogue !== "无对白") 
        ? scene.dialogue 
        : scene.description; // Fallback to description if no dialogue

    if (!textToSay || textToSay.length < 2) {
        throw new Error("没有足够的文本进行配音。");
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: { parts: [{ text: textToSay }] },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
            }
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generation failed: No audio data returned.");
    }

    const pcmBytes = decodeBase64(base64Audio);
    const wavBlob = pcmToWav(pcmBytes, 24000); // Gemini TTS is 24kHz

    return URL.createObjectURL(wavBlob);
};