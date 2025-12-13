import React, { useState } from "react";
import { AppState, INITIAL_SETTINGS, Character, Scene } from "./types";
import { analyzeCharacters, generateCharacterImage, breakdownScenes, generateSceneImage, generateSceneVideo } from "./services/geminiService";
import { Step1Input } from "./components/Step1Input";
import { Step2Characters } from "./components/Step2Characters";
import { Step3Scenes } from "./components/Step3Scenes";
import { Step4Export } from "./components/Step4Export";
import { Layers, Users, Film, Download } from "lucide-react";

export default function App() {
  const [state, setState] = useState<AppState>({
    step: 1,
    settings: INITIAL_SETTINGS,
    characters: [],
    scenes: [],
    isAnalyzing: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Step 1 -> 2: Analyze Story
  const handleAnalyzeStory = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    setError(null);
    try {
      // Pass selected text model
      const charactersRaw = await analyzeCharacters(state.settings.storyText, state.settings.textModel);
      
      // Initialize characters with loading state for auto-generation
      const characters = charactersRaw.map(c => ({ ...c, isLoading: true }));

      setState(prev => ({ 
        ...prev, 
        characters, 
        step: 2,
        isAnalyzing: false 
      }));

      // Trigger auto-generation for all characters in parallel
      characters.forEach(char => {
         // Pass selected image model
         generateCharacterImage(char, state.settings.style, state.settings.aspectRatio, state.settings.imageModel)
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

    } catch (e: any) {
      setError(e.message || "故事分析失败");
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
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
      const imageUrl = await generateCharacterImage(char, state.settings.style, state.settings.aspectRatio, state.settings.imageModel);
      handleUpdateCharacter(id, { imageUrl, isLoading: false });
    } catch (e) {
      console.error(e);
      handleUpdateCharacter(id, { isLoading: false });
      alert("生成图片失败，请重试。");
    }
  };

  const handleGoToScenes = async () => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
        // Pass selected text model
        const scenes = await breakdownScenes(state.settings.storyText, state.settings.sceneCount, state.characters, state.settings.textModel);
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

  const handleGenerateAllSceneImages = async () => {
      const scenesToGen = state.scenes.filter(s => !s.imageUrl);
      
      setState(prev => ({
          ...prev,
          scenes: prev.scenes.map(s => scenesToGen.find(stg => stg.id === s.id) ? { ...s, isLoading: true } : s)
      }));

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

  // Steps indicator component
  const Steps = () => (
    <div className="flex justify-center mb-8 gap-4 text-base font-medium">
      {[
        { num: 1, label: "故事", icon: Layers },
        { num: 2, label: "角色", icon: Users },
        { num: 3, label: "分镜", icon: Film },
        { num: 4, label: "导出", icon: Download }
      ].map((s) => (
        <div 
          key={s.num} 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors ${
            state.step === s.num 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
              : state.step > s.num 
                ? "bg-slate-800 text-green-400 border border-slate-700" 
                : "bg-slate-900 text-slate-500 border border-slate-800"
          }`}
        >
          <s.icon size={18} /> <span className="hidden sm:inline">{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <header className="border-b border-slate-800 bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                <Film className="text-blue-500" size={28} /> StoryBoard AI
            </h1>
            {state.settings.style !== "电影感" && (
                <span className="text-sm px-3 py-1.5 bg-slate-800 rounded border border-slate-700 text-slate-300 flex gap-2 shadow-sm">
                    <span className="font-medium">{state.settings.style}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-slate-400">{state.settings.textModel.split('-')[1]}</span>
                </span>
            )}
        </div>
      </header>

      <main className="w-full px-4 md:px-8 py-8">
        <Steps />
        
        {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center justify-between">
                <span className="text-lg">{error}</span>
                <button onClick={() => setError(null)} className="hover:bg-red-500/20 px-3 py-1 rounded text-sm">忽略</button>
            </div>
        )}

        {state.step === 1 && (
          <Step1Input 
            settings={state.settings} 
            setSettings={(s) => setState(prev => ({ ...prev, settings: s }))} 
            onNext={handleAnalyzeStory}
            isLoading={state.isAnalyzing}
          />
        )}

        {state.step === 2 && (
          <Step2Characters
            characters={state.characters}
            settings={state.settings}
            updateCharacter={handleUpdateCharacter}
            generateImage={handleGenerateCharacterImage}
            onNext={handleGoToScenes}
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
                generateAllImages={handleGenerateAllSceneImages}
                onNext={() => setState(prev => ({ ...prev, step: 4 }))}
            />
        )}

        {state.step === 4 && (
            <Step4Export 
                scenes={state.scenes}
                characters={state.characters}
                settings={state.settings}
            />
        )}
      </main>
    </div>
  );
}