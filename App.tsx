import React, { useState, useEffect } from "react";
import { AppState, INITIAL_SETTINGS, Character, Scene } from "./types";
import { analyzeCharacters, generateCharacterImage, breakdownScenes, generateSceneImage, generateSceneVideo, generateSceneAudio, validateApiKey, getStorySuggestions } from "./services/geminiService";
import { Step1Input } from "./components/Step1Input";
import { Step2Characters } from "./components/Step2Characters";
import { Step3Scenes } from "./components/Step3Scenes";
import { Step4Export } from "./components/Step4Export";
import { Layers, Users, Film, Download, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

export default function App() {
  // Startup Check State
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const [state, setState] = useState<AppState>({
    step: 1,
    settings: INITIAL_SETTINGS,
    characters: [],
    scenes: [],
    isAnalyzing: false,
    analysisSuggestion: ""
  });
  
  // Specific loading state for suggestion
  const [isAnalyzingSuggestion, setIsAnalyzingSuggestion] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Initial API Key Validation
  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    setIsCheckingKey(true);
    try {
        const apiKey = process.env.API_KEY;
        const keyStatus = apiKey ? `Present (Starts with ${apiKey.substring(0,4)}...)` : "Missing/Undefined";
        
        const isValid = await validateApiKey();
        setIsKeyValid(isValid);
        setDebugInfo(keyStatus);
    } catch (e: any) {
        setIsKeyValid(false);
        setDebugInfo(`Validation Error: ${e.message}`);
    } finally {
        setIsCheckingKey(false);
    }
  };

  // Step 1: Analyze Story Suggestion
  const handleAnalyzeSuggestion = async () => {
      if(!state.settings.storyText.trim()) return;
      
      setIsAnalyzingSuggestion(true);
      try {
          const result = await getStorySuggestions(
              state.settings.storyText, 
              state.settings.sceneCount, 
              state.settings.style, 
              state.settings.textModel
          );
          
          setState(prev => ({ 
              ...prev, 
              analysisSuggestion: result.suggestion,
              settings: {
                  ...prev.settings,
                  estimatedCharacterCount: result.characterCount // Update the estimated count
              }
          }));
      } catch(e: any) {
          console.error("Analysis failed", e);
          setState(prev => ({ ...prev, analysisSuggestion: "分析失败: " + e.message }));
      } finally {
          setIsAnalyzingSuggestion(false);
      }
  };

  // Step 1 -> 2: Analyze Story (Main flow)
  const handleAnalyzeStory = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);
    try {
      // Pass selected text model and language
      const charactersRaw = await analyzeCharacters(
          state.settings.storyText, 
          state.settings.textModel,
          state.settings.language
      );
      
      // Initialize characters
      // If autoGenerateChars is true, set isLoading to true initially
      const shouldAutoGenerate = state.settings.autoGenerateChars;
      const characters = charactersRaw.map(c => ({ ...c, isLoading: shouldAutoGenerate }));

      setState(prev => ({ 
        ...prev, 
        characters, 
        step: 2,
        isAnalyzing: false 
      }));

      // Trigger auto-generation for all characters in parallel ONLY if enabled
      if (shouldAutoGenerate) {
          characters.forEach(char => {
             // Pass selected image model and size
             generateCharacterImage(char, state.settings.style, state.settings.aspectRatio, state.settings.imageModel, state.settings.imageSize)
                .then(url => {
                    setState(prev => ({
                        ...prev,
                        characters: prev.characters.map(c => c.id === char.id ? { ...c, imageUrl: url, isLoading: false } : c)
                    }));
                })
                .catch(e => {
                    console.error(`Failed to generate image for ${char.name}`, e);
                     setState(prev => ({
                        ...prev,
                        characters: prev.characters.map(c => c.id === char.id ? { ...c, isLoading: false } : c)
                    }));
                });
          });
      }

    } catch (e: any) {
      setError(e.message || "故事分析失败");
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  // Step Navigation Logic
  const handleBack = () => {
    setState(prev => {
        const prevStep = Math.max(1, prev.step - 1) as 1 | 2 | 3 | 4;
        return { ...prev, step: prevStep };
    });
  };

  // Step 2 Actions
  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleGenerateCharacterImage = async (id: string) => {
    const char = state.characters.find(c => c.id === id);
    if (!char) return;

    handleUpdateCharacter(id, { isLoading: true });
    try {
      const imageUrl = await generateCharacterImage(char, state.settings.style, state.settings.aspectRatio, state.settings.imageModel, state.settings.imageSize);
      handleUpdateCharacter(id, { imageUrl, isLoading: false });
    } catch (e) {
      console.error(e);
      handleUpdateCharacter(id, { isLoading: false });
      alert("生成图片失败，请重试。");
    }
  };

  const handleGenerateAllCharacterImages = async () => {
      // Only generate for those who don't have an image or aren't loading
      const charsToGen = state.characters.filter(c => !c.imageUrl && !c.isLoading);
      
      if (charsToGen.length === 0) return;

      // Set loading state first
      setState(prev => ({
          ...prev,
          characters: prev.characters.map(c => charsToGen.find(ctg => ctg.id === c.id) ? { ...c, isLoading: true } : c)
      }));

      // Trigger generation
      charsToGen.forEach(char => {
          generateCharacterImage(char, state.settings.style, state.settings.aspectRatio, state.settings.imageModel, state.settings.imageSize)
            .then(url => {
                setState(prev => ({
                    ...prev,
                    characters: prev.characters.map(c => c.id === char.id ? { ...c, imageUrl: url, isLoading: false } : c)
                }));
            })
            .catch(e => {
                console.error(`Batch Gen failed for ${char.name}`, e);
                 setState(prev => ({
                    ...prev,
                    characters: prev.characters.map(c => c.id === char.id ? { ...c, isLoading: false } : c)
                }));
            });
      });
  };

  const handleGoToScenes = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
        // Pass selected text model and language
        // Only generate scenes if they are empty (to prevent overwriting if user goes back and forth, 
        // unless you want to force regeneration. For now, we regenerate to ensure consistency with char edits).
        // Actually, users might want to keep scenes if they just went back to check something.
        // Let's ALWAYS regenerate for now to capture character changes, but maybe in future cache it.
        const scenes = await breakdownScenes(
            state.settings.storyText, 
            state.settings.sceneCount, 
            state.characters, 
            state.settings.textModel,
            state.settings.language
        );
        setState(prev => ({
            ...prev,
            scenes,
            step: 3,
            isAnalyzing: false
        }));
    } catch (e) {
        console.error(e);
        setState(prev => ({ ...prev, isAnalyzing: false }));
        alert("生成分镜失败");
    }
  };

  // Step 3 Actions
  const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
    setState(prev => ({
        ...prev,
        scenes: prev.scenes.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleGenerateSceneImage = async (id: string) => {
      const scene = state.scenes.find(s => s.id === id);
      if(!scene) return;

      handleUpdateScene(id, { isLoading: true });
      try {
          // Pass all characters to ensure consistency injection
          const imageUrl = await generateSceneImage(scene, state.settings, state.characters);
          handleUpdateScene(id, { imageUrl, isLoading: false });
      } catch (e) {
          console.error(e);
          handleUpdateScene(id, { isLoading: false });
          alert("生成场景图片失败");
      }
  };

  const handleGenerateSceneVideo = async (id: string) => {
    const scene = state.scenes.find(s => s.id === id);
    if(!scene) return;
    
    if(!scene.imageUrl) {
        alert("请先生成图片，Veo 将基于图片生成视频。");
        return;
    }

    handleUpdateScene(id, { isVideoLoading: true });
    try {
        // generateSceneVideo uses settings.videoModel inside
        const videoUrl = await generateSceneVideo(scene, state.settings);
        handleUpdateScene(id, { videoUrl, isVideoLoading: false });
    } catch (e: any) {
        console.error("Video generation error:", e);
        handleUpdateScene(id, { isVideoLoading: false });
        alert(`视频生成失败: ${e.message || "未知错误"}`);
    }
  };

  const handleGenerateSceneAudio = async (id: string, voiceName: string) => {
    const scene = state.scenes.find(s => s.id === id);
    if(!scene) return;

    if(!scene.dialogue || scene.dialogue === "无对白") {
        if(!confirm("该场景似乎没有对白，是否将‘动作描述’作为旁白进行配音？")) {
            return;
        }
    }

    handleUpdateScene(id, { isAudioLoading: true });
    try {
        // Now passing the voiceName
        const audioUrl = await generateSceneAudio(scene, state.settings, voiceName);
        handleUpdateScene(id, { audioUrl, isAudioLoading: false });
    } catch (e: any) {
        console.error("Audio generation error:", e);
        handleUpdateScene(id, { isAudioLoading: false });
        alert(`配音生成失败: ${e.message}`);
    }
  };

  const handleGenerateAllSceneImages = async () => {
      const scenesToGen = state.scenes.filter(s => !s.imageUrl && !s.isLoading);
      
      setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s => scenesToGen.find(stg => stg.id === s.id) ? { ...s, isLoading: true } : s)
      }));

      // Use a loop for scenes to avoid overwhelming if many
      for (const scene of scenesToGen) {
          try {
             const imageUrl = await generateSceneImage(scene, state.settings, state.characters);
             handleUpdateScene(scene.id, { imageUrl, isLoading: false });
          } catch (e) {
              console.error(`Failed scene ${scene.number}`, e);
              handleUpdateScene(scene.id, { isLoading: false });
          }
      }
  };

  const handleGenerateAllSceneVideos = async () => {
      const scenesToGen = state.scenes.filter(s => s.imageUrl && !s.videoUrl && !s.isVideoLoading);
      
      if(scenesToGen.length === 0) {
          alert("没有可生成视频的分镜（需要先生成图片且未生成视频）。");
          return;
      }

      setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s => scenesToGen.find(stg => stg.id === s.id) ? { ...s, isVideoLoading: true } : s)
      }));

      // Execute sequentially to avoid rate limits or overwhelming browser
      for (const scene of scenesToGen) {
          try {
            const videoUrl = await generateSceneVideo(scene, state.settings);
            handleUpdateScene(scene.id, { videoUrl, isVideoLoading: false });
          } catch (e: any) {
             console.error(`Failed video scene ${scene.number}`, e);
             handleUpdateScene(scene.id, { isVideoLoading: false });
          }
      }
  };

  // Steps indicator component
  const Steps = () => (
    <div className="flex items-center gap-6">
      {[
        { num: 1, label: "故事", icon: Layers },
        { num: 2, label: "角色", icon: Users },
        { num: 3, label: "分镜", icon: Film },
        { num: 4, label: "导出", icon: Download }
      ].map((s) => (
        <div 
          key={s.num} 
          className={`flex items-center justify-center gap-3 px-10 py-3 rounded-full transition-all text-lg font-bold min-w-[160px] ${
            state.step === s.num 
              ? "bg-blue-600 text-white shadow-xl shadow-blue-900/40 scale-105" 
              : state.step > s.num 
                ? "bg-slate-800 text-green-400 border border-slate-700 hover:bg-slate-750 cursor-pointer" // Enable clicking previous steps
                : "bg-slate-900/50 text-slate-500 border border-slate-800"
          }`}
          onClick={() => {
              // Allow jumping back
              if(state.step > s.num) {
                  setState(prev => ({...prev, step: s.num as any}));
              }
          }}
        >
          <s.icon size={20} /> <span className="hidden sm:inline">{s.label}</span>
        </div>
      ))}
    </div>
  );

  // --- Render Checking/Error States ---
  
  if (isCheckingKey) {
      return (
          <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-300">
              <Loader2 className="animate-spin mb-4 text-blue-500" size={48} />
              <p className="text-lg font-medium">正在验证 API 连接...</p>
          </div>
      );
  }

  if (!isKeyValid) {
      return (
          <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-100 p-8">
              <div className="bg-slate-800 border border-red-500/50 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle className="text-red-500" size={32} />
                  </div>
                  <h1 className="text-2xl font-bold mb-4">API 连接失败</h1>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                      无法连接到 Google Gemini API。
                  </p>
                  
                  {/* Debug Info Section */}
                  <div className="bg-slate-900 p-4 rounded-lg text-left text-xs text-slate-400 font-mono mb-6 overflow-x-auto border border-slate-700">
                      <p className="mb-2 uppercase font-bold text-slate-500 border-b border-slate-700 pb-1">Debug Info</p>
                      <p><span className="text-blue-400">API_KEY Status:</span> {debugInfo}</p>
                      <p className="mt-2"><span className="text-yellow-400">Troubleshooting:</span></p>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-500">
                          <li>Check <code>.env</code> file is in project root (not src).</li>
                          <li>Check file name is exactly <code>.env</code> (not .env.txt).</li>
                          <li>If using System Env Vars, <strong>restart the terminal</strong>.</li>
                      </ul>
                  </div>

                  <button 
                    onClick={() => {
                        window.location.reload();
                    }}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                  >
                      <RefreshCw size={18}/> 重试连接 (Reload)
                  </button>
              </div>
          </div>
      );
  }

  return (
    // Changed to h-screen and flex-col to fix height issues
    <div className="h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md shadow-lg z-50">
        <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            {/* Title Section */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3 shrink-0">
                <Film className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={32} /> 
                <span className="tracking-wide">视界 · 造物主</span>
            </h1>

            {/* Steps Component - Moved Here */}
            <Steps />

            {/* Status Tags */}
            <div className="shrink-0">
                {state.settings.style !== "电影感" && (
                    <span className="text-sm px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-slate-300 flex items-center gap-2 shadow-sm">
                        <span className="font-bold text-white">{state.settings.style}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-blue-400">{state.settings.textModel.split('-')[1]}</span>
                    </span>
                )}
            </div>
        </div>
      </header>

      {/* Main Container handles layout. flex-1 takes remaining height. */}
      <main className="flex-1 flex flex-col min-h-0 w-full px-4 md:px-6 py-4">
        
        {error && (
            <div className="shrink-0 mb-4 bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg flex items-center justify-between text-sm">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="hover:bg-red-500/20 px-2 py-1 rounded">忽略</button>
            </div>
        )}

        {/* This container wraps the steps. 
            For Step 1, we want it to fit without scrolling if possible.
            For Step 2, 3, 4, we want scrolling.
        */}
        <div className="flex-1 min-h-0 relative">
             {/* If scroll is needed, the child component should handle it or we add overflow-y-auto here. 
                 Step 1 manages its own flex layout, others need scroll.
             */}
             <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2">
                {state.step === 1 && (
                <Step1Input 
                    settings={state.settings} 
                    setSettings={(s) => setState(prev => ({ ...prev, settings: s }))} 
                    onNext={handleAnalyzeStory}
                    isLoading={state.isAnalyzing}
                    suggestion={state.analysisSuggestion}
                    setSuggestion={(s) => setState(prev => ({ ...prev, analysisSuggestion: s }))}
                    onAnalyze={handleAnalyzeSuggestion}
                    isAnalyzingSuggestion={isAnalyzingSuggestion}
                />
                )}

                {state.step === 2 && (
                <Step2Characters
                    characters={state.characters}
                    settings={state.settings}
                    updateCharacter={handleUpdateCharacter}
                    generateImage={handleGenerateCharacterImage}
                    generateAllImages={handleGenerateAllCharacterImages}
                    onNext={handleGoToScenes}
                    onBack={handleBack}
                    isLoadingNext={state.isAnalyzing}
                />
                )}

                {state.step === 3 && (
                    <Step3Scenes 
                        scenes={state.scenes}
                        settings={state.settings}
                        updateScene={handleUpdateScene}
                        generateImage={handleGenerateSceneImage}
                        generateVideo={handleGenerateSceneVideo}
                        // New prop
                        generateAudio={handleGenerateSceneAudio}
                        generateAllImages={handleGenerateAllSceneImages}
                        generateAllVideos={handleGenerateAllSceneVideos}
                        onNext={() => setState(prev => ({ ...prev, step: 4 }))}
                        onBack={handleBack}
                    />
                )}

                {state.step === 4 && (
                    <Step4Export 
                        scenes={state.scenes}
                        characters={state.characters}
                        settings={state.settings}
                        analysisSuggestion={state.analysisSuggestion}
                        onBack={handleBack}
                    />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}