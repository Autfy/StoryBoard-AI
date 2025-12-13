import React from "react";
import { StorySettings, AspectRatio, ImageStyle } from "../types";
import { Sparkles, BookOpen } from "lucide-react";

interface Props {
  settings: StorySettings;
  setSettings: (s: StorySettings) => void;
  onNext: () => void;
  isLoading: boolean;
}

const STYLES: ImageStyle[] = ["电影感", "动漫", "赛博朋克", "水彩", "油画", "3D渲染", "像素风", "线稿"];
const RATIOS: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3", "3:4"];

export const Step1Input: React.FC<Props> = ({ settings, setSettings, onNext, isLoading }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          开始创作您的故事
        </h2>
        <p className="text-slate-400">告诉我们要创作什么，剩下的交给我们。</p>
      </div>

      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
        {/* Story Input */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <BookOpen size={16} /> 故事大纲
          </label>
          <textarea
            className="w-full h-40 bg-slate-900/80 border border-slate-700 rounded-lg p-4 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
            placeholder="在未来的东京..."
            value={settings.storyText}
            onChange={(e) => setSettings({ ...settings, storyText: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Style Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">视觉风格</label>
            <select
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              value={settings.style}
              onChange={(e) => setSettings({ ...settings, style: e.target.value as ImageStyle })}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Ratio Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">画幅比例</label>
            <select
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              value={settings.aspectRatio}
              onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
            >
              {RATIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Scene Count */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300 flex justify-between">
              <span>分镜数量</span>
              <span className="text-blue-400 font-bold">{settings.sceneCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              value={settings.sceneCount}
              onChange={(e) => setSettings({ ...settings, sceneCount: parseInt(e.target.value) })}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={!settings.storyText.trim() || isLoading}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            !settings.storyText.trim() || isLoading
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-900/20"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              正在分析故事...
            </>
          ) : (
            <>
              <Sparkles size={20} /> 生成角色
            </>
          )}
        </button>
      </div>
    </div>
  );
};