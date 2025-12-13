import React from "react";
import { Character, StorySettings } from "../types";
import { RefreshCw, User, Wand2, ChevronRight, Upload } from "lucide-react";

interface Props {
  characters: Character[];
  settings: StorySettings;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  generateImage: (id: string) => void;
  onNext: () => void;
  isLoadingNext: boolean;
}

export const Step2Characters: React.FC<Props> = ({ characters, settings, updateCharacter, generateImage, onNext, isLoadingNext }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">角色设计</h2>
          <p className="text-slate-400">审查生成的角色并创建参考图。</p>
        </div>
        <button
          onClick={onNext}
          disabled={isLoadingNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingNext ? "正在生成分镜..." : "下一步：分镜脚本"} <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-6">
        {characters.map((char) => (
          <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col">
            <div className="relative aspect-square bg-slate-900 group">
              {char.imageUrl ? (
                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
                  <User size={48} className="mb-2 opacity-50" />
                  <span className="text-sm">未生成参考图</span>
                </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => generateImage(char.id)}
                  disabled={char.isLoading}
                  className="bg-white text-slate-900 px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  {char.isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                  {char.imageUrl ? "重绘" : "生成"}
                </button>
                
                <label 
                    htmlFor={`upload-${char.id}`}
                    className="bg-slate-700 text-white p-2 rounded-full hover:bg-slate-600 cursor-pointer transition-colors flex items-center justify-center"
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
                   <RefreshCw className="animate-spin text-white" size={32} />
                 </div>
              )}
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <input
                type="text"
                value={char.name}
                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                className="w-full bg-transparent text-lg font-bold text-white border-b border-transparent focus:border-blue-500 outline-none pb-1"
                placeholder="角色名称"
              />
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">角色描述</label>
                <textarea
                  value={char.description}
                  onChange={(e) => updateCharacter(char.id, { description: e.target.value })}
                  className="w-full bg-slate-900/50 text-slate-300 text-sm p-2 rounded border border-slate-700 focus:border-blue-500 outline-none resize-none h-20"
                />
              </div>

               <div className="space-y-1 flex-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">视觉提示词 (Visual Prompt)</label>
                <textarea
                  value={char.visualPrompt}
                  onChange={(e) => updateCharacter(char.id, { visualPrompt: e.target.value })}
                  className="w-full h-full min-h-[80px] bg-slate-900/50 text-slate-300 text-xs p-2 rounded border border-slate-700 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};