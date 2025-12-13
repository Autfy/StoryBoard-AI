import React from "react";
import { StorySettings, AspectRatio, ImageStyle, TextModel, ImageModel, VideoModel, ImageSize } from "../types";
import { Sparkles, BookOpen, BrainCircuit, Image as ImageIcon, Video, Settings2, Zap } from "lucide-react";

interface Props {
  settings: StorySettings;
  setSettings: (s: StorySettings) => void;
  onNext: () => void;
  isLoading: boolean;
}

const STYLES: ImageStyle[] = [
  "电影感", 
  "动漫", 
  "吉卜力风格",
  "皮克斯3D",
  "赛博朋克", 
  "水彩", 
  "中国水墨",
  "油画", 
  "美漫风格",
  "像素风", 
  "线稿", 
  "3D渲染",
  "暗黑哥特",
  "黏土定格",
  "黑白电影"
];

// Updated to only support Veo compatible ratios
const RATIOS: { value: AspectRatio; label: string }[] = [
    { value: "16:9", label: "横屏 (16:9) - 电影/桌面" },
    { value: "9:16", label: "竖屏 (9:16) - 手机/Shorts" }
];

const TEXT_MODELS: {value: TextModel; label: string}[] = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-3-pro-preview", label: "Gemini 3.0 Pro" },
];

const IMAGE_MODELS: {value: ImageModel; label: string}[] = [
    { value: "gemini-2.5-flash-image", label: "Gemini 2.5 Flash Img" },
    { value: "gemini-3-pro-image-preview", label: "Gemini 3 Pro Img" },
    { value: "imagen-3.0-generate-001", label: "Imagen 3" },
];

const VIDEO_MODELS: {value: VideoModel; label: string}[] = [
    { value: "veo-3.1-fast-generate-preview", label: "Veo 3.1 Fast" },
    { value: "veo-3.1-generate-preview", label: "Veo 3.1 HQ" },
];

export const Step1Input: React.FC<Props> = ({ settings, setSettings, onNext, isLoading }) => {
  
  const estimateResources = () => {
    const textInputTokens = 3500; 
    const textOutputTokens = 500 + (settings.sceneCount * 300);
    const estCharacters = 4;
    const totalImages = settings.sceneCount + estCharacters;
    const maxVideos = settings.sceneCount;

    return {
      text: { count: `~${((textInputTokens + textOutputTokens) / 1000).toFixed(1)}k` },
      image: { count: `~${totalImages}` },
      video: { count: `${maxVideos}` }
    };
  };

  const resources = estimateResources();

  return (
    <div className="w-full max-w-[98%] mx-auto animate-in fade-in zoom-in duration-500 h-[calc(100vh-140px)]">
      
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Left Column: Story Input (Primary Workspace) */}
        <div className="flex-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <label className="text-2xl font-bold text-white flex items-center gap-3">
                    <BookOpen size={28} className="text-blue-400" /> 故事大纲
                </label>
                <div className="text-base text-slate-400">
                    在此输入您的故事创意
                </div>
            </div>
            
            <textarea
                className="flex-1 w-full bg-slate-900/80 border border-slate-700 rounded-xl p-6 text-slate-100 text-xl leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all shadow-inner h-full placeholder:text-slate-600"
                placeholder="在未来的东京，一名退役的赛博忍者..."
                value={settings.storyText}
                onChange={(e) => setSettings({ ...settings, storyText: e.target.value })}
            />
        </div>

        {/* Right Column: Settings & Controls (Sidebar) */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 h-full overflow-y-auto">
            
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm space-y-7 flex-1 flex flex-col">
                
                {/* Basic Settings */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">视觉风格</label>
                        <select
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-base text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={settings.style}
                            onChange={(e) => setSettings({ ...settings, style: e.target.value as ImageStyle })}
                        >
                            {STYLES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">画幅比例 (Veo 兼容)</label>
                        <select
                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-base text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={settings.aspectRatio}
                            onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
                        >
                            {RATIOS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">分镜数量</label>
                            <span className="text-blue-400 font-bold text-2xl">{settings.sceneCount}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="36"
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            value={settings.sceneCount}
                            onChange={(e) => setSettings({ ...settings, sceneCount: parseInt(e.target.value) })}
                        />
                        <div className="flex justify-between text-xs text-slate-500 font-medium">
                            <span>1</span>
                            <span>36</span>
                        </div>
                    </div>
                </div>

                {/* Advanced Models (Compact) */}
                <div className="border-t border-slate-700 pt-6 space-y-4 flex-1">
                    <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <Settings2 size={16} /> 高级模型配置
                    </h3>
                    
                    <div className="space-y-4">
                         {/* Text */}
                        <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-blue-400 flex items-center gap-1"><BrainCircuit size={12}/> 推理模型</label>
                                <span className="text-xs text-slate-500 font-mono">{resources.text.count}</span>
                             </div>
                             <select
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 text-sm text-slate-300 outline-none"
                                value={settings.textModel}
                                onChange={(e) => setSettings({...settings, textModel: e.target.value as TextModel})}
                            >
                                {TEXT_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>

                         {/* Image Model & Size */}
                         <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-purple-400 flex items-center gap-1"><ImageIcon size={12}/> 绘图配置</label>
                                <span className="text-xs text-slate-500 font-mono">{resources.image.count}</span>
                             </div>
                             <div className="flex gap-2">
                                <select
                                    className="flex-[2] bg-slate-900 border border-slate-600 rounded p-2.5 text-sm text-slate-300 outline-none"
                                    value={settings.imageModel}
                                    onChange={(e) => setSettings({...settings, imageModel: e.target.value as ImageModel})}
                                >
                                    {IMAGE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                <div className="flex-1 bg-slate-900 border border-slate-600 rounded flex p-1">
                                    <button 
                                        onClick={() => setSettings({...settings, imageSize: "1K"})}
                                        className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition-colors ${settings.imageSize === "1K" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                                        title="1K Resolution (更省钱)"
                                    >
                                        1K
                                    </button>
                                    <button 
                                        onClick={() => setSettings({...settings, imageSize: "2K"})}
                                        className={`flex-1 flex items-center justify-center rounded text-xs font-bold transition-colors ${settings.imageSize === "2K" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                                        title="2K Resolution (更贵)"
                                    >
                                        2K
                                    </button>
                                </div>
                             </div>
                        </div>

                         {/* Video */}
                         <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-orange-400 flex items-center gap-1"><Video size={12}/> 视频模型</label>
                                <span className="text-xs text-slate-500 font-mono">{resources.video.count}</span>
                             </div>
                             <select
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2.5 text-sm text-slate-300 outline-none"
                                value={settings.videoModel}
                                onChange={(e) => setSettings({...settings, videoModel: e.target.value as VideoModel})}
                            >
                                {VIDEO_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-2 mt-auto">
                    <button
                        onClick={onNext}
                        disabled={!settings.storyText.trim() || isLoading}
                        className={`w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
                            !settings.storyText.trim() || isLoading
                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-900/30"
                        }`}
                        >
                        {isLoading ? (
                            <>
                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            正在分析...
                            </>
                        ) : (
                            <>
                            <Sparkles size={24} /> 生成角色
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};