import React, { useState, useRef, useEffect } from "react";
import { StorySettings, AspectRatio, ImageStyle, TextModel, ImageModel, VideoModel, ImageSize, Language } from "../types";
import { 
  Sparkles, BookOpen, BrainCircuit, Image as ImageIcon, Video, Settings2, Lightbulb, ChevronRight, 
  Monitor, Smartphone, Clapperboard, Moon, Ghost, CloudSun, Box, Zap, Droplets, Feather, 
  Palette, Star, Grid3x3, PenTool, Cuboid, Skull, CircleDot, Aperture, ChevronDown, Wand2,
  Cpu, Languages, RotateCw
} from "lucide-react";
// @ts-ignore
import ReactMarkdown from "react-markdown";

interface Props {
  settings: StorySettings;
  setSettings: (s: StorySettings) => void;
  onNext: () => void;
  isLoading: boolean;
  
  // New props for analysis
  suggestion: string;
  setSuggestion: (s: string) => void;
  onAnalyze: () => void;
  isAnalyzingSuggestion: boolean;

  // New Props for Re-generation
  hasAnalyzed?: boolean;
  onReAnalyze?: () => void;
}

// Definition of styles with Icons
const STYLE_OPTIONS: { value: ImageStyle; label: string; icon: React.ElementType, color: string }[] = [
  { value: "电影感", label: "电影感", icon: Clapperboard, color: "text-blue-400" },
  { value: "静谧电影感", label: "静谧电影感", icon: Moon, color: "text-indigo-300" },
  { value: "动漫", label: "动漫", icon: Ghost, color: "text-pink-400" },
  { value: "吉卜力风格", label: "吉卜力风格", icon: CloudSun, color: "text-sky-400" },
  { value: "皮克斯3D", label: "皮克斯3D", icon: Box, color: "text-orange-400" },
  { value: "赛博朋克", label: "赛博朋克", icon: Zap, color: "text-yellow-400" },
  { value: "水彩", label: "水彩", icon: Droplets, color: "text-cyan-400" },
  { value: "中国水墨", label: "中国水墨", icon: Feather, color: "text-slate-400" },
  { value: "油画", label: "油画", icon: Palette, color: "text-red-400" },
  { value: "美漫风格", label: "美漫风格", icon: Star, color: "text-purple-400" },
  { value: "像素风", label: "像素风", icon: Grid3x3, color: "text-green-400" },
  { value: "线稿", label: "线稿", icon: PenTool, color: "text-slate-300" },
  { value: "3D渲染", label: "3D渲染", icon: Cuboid, color: "text-blue-300" },
  { value: "暗黑哥特", label: "暗黑哥特", icon: Skull, color: "text-purple-500" },
  { value: "黏土定格", label: "黏土定格", icon: CircleDot, color: "text-orange-300" },
  { value: "黑白电影", label: "黑白电影", icon: Aperture, color: "text-gray-200" }
];

const RATIOS: { value: AspectRatio; label: string }[] = [
    { value: "16:9", label: "横屏 (16:9)" },
    { value: "9:16", label: "竖屏 (9:16)" }
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

const LANGUAGES: {value: Language; label: string}[] = [
    { value: "Chinese", label: "中文 (Chinese)" },
    { value: "English", label: "英文 (English)" },
];

export const Step1Input: React.FC<Props> = ({ 
    settings, setSettings, onNext, isLoading, 
    suggestion, setSuggestion, onAnalyze, isAnalyzingSuggestion,
    hasAnalyzed, onReAnalyze
}) => {
  
  const [isStyleOpen, setIsStyleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStyleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const estimateResources = () => {
    // Dynamic estimation based on character count
    // A rough heuristic: 1 char ~= 1.3 tokens for mixed content + base system prompt overhead (~500)
    const textLength = settings.storyText.length;
    const estimatedInputTokens = textLength > 0 ? Math.ceil(textLength * 1.3) + 500 : 0;
    
    // Use the dynamically estimated character count, or default to 4 if not yet analyzed
    const estCharacters = settings.estimatedCharacterCount;
    const totalImages = settings.sceneCount + estCharacters;
    const maxVideos = settings.sceneCount;

    return {
      text: { count: estimatedInputTokens > 1000 ? `${(estimatedInputTokens / 1000).toFixed(1)}k` : `${estimatedInputTokens}` },
      image: { count: `${totalImages}`, breakdown: `(${settings.sceneCount} 分镜 + ${estCharacters} 角色)` },
      video: { count: `${maxVideos}` }
    };
  };

  const resources = estimateResources();
  const selectedStyleObj = STYLE_OPTIONS.find(s => s.value === settings.style) || STYLE_OPTIONS[0];

  return (
    <div className="w-full max-w-[98%] mx-auto animate-in fade-in zoom-in duration-500 h-full flex flex-col">
      
      {/* 3 Columns Layout: 4:3:3 Ratio */}
      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        
        {/* Column 1: Story Input (40%) */}
        <div className="lg:flex-[4] flex flex-col h-full min-h-0 bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
             <div className="flex items-center justify-between mb-4 shrink-0 h-9">
                <label className="text-xl font-bold text-white flex items-center gap-3">
                    <BookOpen size={24} className="text-blue-400" /> 故事大纲
                </label>
            </div>
            
            <textarea
                className="flex-1 w-full bg-slate-900/80 border border-slate-700 rounded-xl p-5 text-slate-100 text-lg leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all shadow-inner placeholder:text-slate-600"
                placeholder="在此输入故事。例如：在未来的东京，一名退役的赛博忍者..."
                value={settings.storyText}
                onChange={(e) => setSettings({ ...settings, storyText: e.target.value })}
            />
        </div>

        {/* Column 2: Analysis & Suggestion (30%) */}
        <div className="lg:flex-[3] flex flex-col h-full min-h-0 bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 shrink-0 h-9">
                <label className="text-xl font-bold text-indigo-300 flex items-center gap-3">
                    <Lightbulb size={24} className="text-yellow-400" /> 分析建议
                </label>
            </div>
            
            {/* Colorful, Larger Analysis Button */}
            <div className="mb-4 shrink-0">
                 <button
                    onClick={onAnalyze}
                    disabled={!settings.storyText.trim() || isAnalyzingSuggestion}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:via-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isAnalyzingSuggestion ? (
                        <BrainCircuit className="animate-spin" size={24} />
                    ) : (
                        <Sparkles size={24} />
                    )}
                    {isAnalyzingSuggestion ? "正在分析..." : "智能分析故事"}
                </button>
            </div>
            
            {/* Read-Only Markdown Display */}
            <div className="flex-1 w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-slate-300 overflow-y-auto custom-scrollbar shadow-inner">
                {suggestion ? (
                    <ReactMarkdown
                        components={{
                            h1: ({node, ...props}) => <h3 className="text-2xl font-bold text-white mt-4 mb-2 border-b border-slate-700 pb-1" {...props} />,
                            h2: ({node, ...props}) => <h4 className="text-xl font-bold text-blue-300 mt-4 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h5 className="text-lg font-bold text-indigo-300 mt-3 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-3 text-slate-300 leading-relaxed text-base" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-base" {...props} />,
                            li: ({node, ...props}) => <li className="text-slate-300 text-base" {...props} />,
                            strong: ({node, ...props}) => <strong className="text-yellow-200 font-semibold" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-2 text-base" {...props} />,
                        }}
                    >
                        {suggestion}
                    </ReactMarkdown>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm">
                        <Sparkles className="mb-2 opacity-50" size={32} />
                        <p>点击上方按钮，获取专业导演建议...</p>
                    </div>
                )}
            </div>
        </div>

        {/* Column 3: Settings & Controls (30%) - Enlarged UI */}
        <div className="lg:flex-[3] flex flex-col h-full min-h-0 bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm overflow-hidden">
            
            {/* Parameter Settings Header with Gradient */}
            <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 shrink-0">
                <label className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings2 size={22} className="text-blue-400" /> 参数设置
                </label>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                
                 {/* Auto-generate Toggle */}
                 <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <label className="text-base text-slate-300 font-medium flex items-center gap-2 cursor-pointer" htmlFor="auto-gen-toggle">
                        <Wand2 size={18} className="text-pink-400" /> 
                        自动生成角色参考图
                    </label>
                    <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                        <input 
                            type="checkbox" 
                            name="toggle" 
                            id="auto-gen-toggle" 
                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:translate-x-full checked:border-blue-600"
                            checked={settings.autoGenerateChars}
                            onChange={(e) => setSettings({ ...settings, autoGenerateChars: e.target.checked })}
                        />
                        <label htmlFor="auto-gen-toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.autoGenerateChars ? "bg-blue-600" : "bg-slate-700"}`}></label>
                    </div>
                </div>

                {/* Visual Style (Custom Dropdown with Icons) */}
                <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="text-base font-bold text-slate-300 uppercase tracking-wide">视觉风格</label>
                    <button
                        onClick={() => setIsStyleOpen(!isStyleOpen)}
                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between transition-all hover:border-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <selectedStyleObj.icon size={24} className={selectedStyleObj.color} />
                            <span className="text-lg text-slate-100 font-medium">{selectedStyleObj.label}</span>
                        </div>
                        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isStyleOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isStyleOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {STYLE_OPTIONS.map((styleOption) => (
                                <button
                                    key={styleOption.value}
                                    onClick={() => {
                                        setSettings({ ...settings, style: styleOption.value });
                                        setIsStyleOpen(false);
                                    }}
                                    className={`w-full p-4 flex items-center gap-3 hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 ${
                                        settings.style === styleOption.value ? "bg-slate-700/80" : ""
                                    }`}
                                >
                                    <styleOption.icon size={24} className={styleOption.color} />
                                    <span className={`text-lg ${settings.style === styleOption.value ? "text-white font-bold" : "text-slate-300"}`}>
                                        {styleOption.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Aspect Ratio with Icons */}
                <div className="space-y-2">
                    <label className="text-base font-bold text-slate-300 uppercase tracking-wide">画幅 (Veo 兼容)</label>
                    <div className="grid grid-cols-2 gap-3">
                        {RATIOS.map((r) => (
                             <button
                                key={r.value}
                                onClick={() => setSettings({ ...settings, aspectRatio: r.value })}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 ${
                                    settings.aspectRatio === r.value 
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg scale-[1.02]" 
                                    : "bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800"
                                }`}
                            >
                                {r.value === "16:9" ? (
                                    <Monitor size={32} className={settings.aspectRatio === r.value ? "text-white" : "text-slate-500"} />
                                ) : (
                                    <Smartphone size={32} className={settings.aspectRatio === r.value ? "text-white" : "text-slate-500"} />
                                )}
                                <span className="text-base font-bold">{r.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scene Count */}
                <div className="space-y-4 bg-slate-900/40 p-5 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-end">
                        <label className="text-base font-bold text-slate-300 uppercase tracking-wide">分镜数量</label>
                        <span className="text-blue-400 font-bold text-3xl">{settings.sceneCount}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="36"
                        className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                        value={settings.sceneCount}
                        onChange={(e) => setSettings({ ...settings, sceneCount: parseInt(e.target.value) })}
                    />
                </div>

                {/* Advanced Models Header with Gradient */}
                <div className="pt-4">
                    <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4 p-3 rounded-lg bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/20">
                         <Cpu size={20} className="text-purple-400" />
                        高级模型配置
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Language Selection */}
                         <div className="flex flex-col gap-2">
                            <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                                <Languages size={20} className="text-slate-400"/> 配音/对话语种
                            </label>
                            <select
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-base text-slate-300 outline-none"
                                value={settings.language}
                                onChange={(e) => setSettings({...settings, language: e.target.value as Language})}
                            >
                                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>

                        {/* Text */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 mb-1">
                                <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                                    <BrainCircuit size={20} className="text-slate-400"/> 推理模型
                                </label>
                                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                                    <span className="text-base font-bold text-blue-400 font-mono">
                                        {resources.text.count}
                                    </span>
                                    <span className="text-xs text-blue-500/50">Tokens</span>
                                </div>
                            </div>
                            <select
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-base text-slate-300 outline-none"
                                value={settings.textModel}
                                onChange={(e) => setSettings({...settings, textModel: e.target.value as TextModel})}
                            >
                                {TEXT_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>

                        {/* Image */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 mb-1">
                                <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                                    <ImageIcon size={20} className="text-slate-400"/> 绘图模型
                                </label>
                                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                                    <span className="text-base font-bold text-green-400 font-mono">
                                        {resources.image.count}
                                    </span>
                                    <span className="text-xs text-green-500/50">Images</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <select
                                    className="flex-[2] bg-slate-900 border border-slate-600 rounded-lg p-3 text-base text-slate-300 outline-none"
                                    value={settings.imageModel}
                                    onChange={(e) => setSettings({...settings, imageModel: e.target.value as ImageModel})}
                                >
                                    {IMAGE_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                <div className="flex-1 bg-slate-900 border border-slate-600 rounded-lg flex p-1">
                                    <button 
                                        onClick={() => setSettings({...settings, imageSize: "1K"})}
                                        className={`flex-1 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${settings.imageSize === "1K" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                                    >
                                        1K
                                    </button>
                                    <button 
                                        onClick={() => setSettings({...settings, imageSize: "2K"})}
                                        className={`flex-1 flex items-center justify-center rounded-md text-sm font-bold transition-colors ${settings.imageSize === "2K" ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                                    >
                                        2K
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Video */}
                        <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-3 mb-1">
                                <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                                    <Video size={20} className="text-slate-400"/> 视频模型
                                </label>
                                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                                    <span className="text-base font-bold text-purple-400 font-mono">
                                        {resources.video.count}
                                    </span>
                                    <span className="text-xs text-purple-500/50">Videos</span>
                                </div>
                            </div>
                            <select
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-base text-slate-300 outline-none"
                                value={settings.videoModel}
                                onChange={(e) => setSettings({...settings, videoModel: e.target.value as VideoModel})}
                            >
                                {VIDEO_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 mt-auto shrink-0 border-t border-slate-800 flex flex-col gap-3">
                {hasAnalyzed ? (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onReAnalyze}
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30"
                        >
                             <RotateCw size={20} /> 重新分析 (覆盖)
                        </button>
                         <button
                            onClick={onNext}
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
                        >
                            下一步 (保留内容) <ChevronRight size={20} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onNext}
                        disabled={!settings.storyText.trim() || isLoading}
                        className={`w-full py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
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
                            下一步 <ChevronRight size={24} />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};