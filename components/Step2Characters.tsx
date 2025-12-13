import React from "react";
import { Character, StorySettings } from "../types";
import { RefreshCw, User, Wand2, ChevronRight, Upload, Mic, Zap } from "lucide-react";

interface Props {
  characters: Character[];
  settings: StorySettings;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  generateImage: (id: string) => void;
  generateAllImages: () => void; // New Prop
  onNext: () => void;
  isLoadingNext: boolean;
}

export const Step2Characters: React.FC<Props> = ({ characters, settings, updateCharacter, generateImage, generateAllImages, onNext, isLoadingNext }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">角色设计</h2>
          <p className="text-slate-400 text-lg mt-1">审查生成的角色并创建参考图。</p>
        </div>
        <div className="flex gap-4">
             <button
                onClick={generateAllImages}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-lg"
            >
                <Zap size={20} /> 一键生成所有
            </button>
            <button
            onClick={onNext}
            disabled={isLoadingNext}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
            {isLoadingNext ? "正在生成分镜..." : "下一步：分镜脚本"} <ChevronRight size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8">
        {characters.map((char) => (
          <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col">
            <div className="relative aspect-square bg-slate-900 group">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                  <User size={64} className="mb-4 opacity-50" />
                  <span className="text-base">未生成参考图</span>
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => generateImage(char.id)}
                  disabled={char.isLoading}
                  className="bg-white text-slate-900 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  {char.isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} />}
                  {char.imageUrl ? "重绘" : "生成"}
                </button>
                
                <label 
                    htmlFor={`upload-${char.id}`}
                    className="bg-slate-700 text-white p-3 rounded-full hover:bg-slate-600 cursor-pointer transition-colors flex items-center justify-center"
                    title="上传参考图"
                >
                    <Upload size={20} />
                </label>
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`upload-${char.id}`}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                updateCharacter(char.id, { imageUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
              </div>
              
              {char.isLoading && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                   <RefreshCw className="animate-spin text-white" size={48} />
                 </div>
              )}
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col">
              <input
                type="text"
                value={char.name}
                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                className="w-full bg-transparent text-xl font-bold text-white border-b border-transparent focus:border-blue-500 outline-none pb-2"
                placeholder="角色名称"
              />
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">角色描述</label>
                <textarea
                  value={char.description}
                  onChange={(e) => updateCharacter(char.id, { description: e.target.value })}
                  className="w-full bg-slate-900/50 text-slate-300 text-base p-3 rounded-lg border border-slate-700 focus:border-blue-500 outline-none resize-none h-20 leading-relaxed"
                />
              </div>

               {/* Speaker Style Section - Simplified */}
              <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-400 uppercase tracking-wide flex items-center gap-2">
                      <Mic size={14} /> 配音/说话风格建议 (Veo)
                  </label>
                  <input
                    type="text"
                    value={char.speakerStyle || ""}
                    onChange={(e) => updateCharacter(char.id, { speakerStyle: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-sm p-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
                    placeholder="AI 自动生成的风格建议..."
                  />
                   <p className="text-xs text-slate-500 pl-1">
                    * 此风格将指导视频生成时的角色神态和表演方式。
                  </p>
              </div>

               <div className="space-y-1.5 flex-1">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">视觉提示词 (Visual Prompt)</label>
                <textarea
                  value={char.visualPrompt}
                  onChange={(e) => updateCharacter(char.id, { visualPrompt: e.target.value })}
                  className="w-full h-full min-h-[100px] bg-slate-900/50 text-slate-400 text-sm p-3 rounded-lg border border-slate-700 focus:border-blue-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};