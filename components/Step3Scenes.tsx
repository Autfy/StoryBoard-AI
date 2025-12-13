import React from "react";
import { Scene, StorySettings } from "../types";
import { RefreshCw, Image as ImageIcon, Download, Film, Camera, MessageCircle, Play } from "lucide-react";

interface Props {
  scenes: Scene[];
  settings: StorySettings;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  generateImage: (id: string) => void;
  generateAllImages: () => void;
  onNext: () => void;
}

export const Step3Scenes: React.FC<Props> = ({ scenes, settings, updateScene, generateImage, generateAllImages, onNext }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md py-4 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">分镜脚本</h2>
          <p className="text-slate-400 text-sm">审查脚本并生成场景视觉图。</p>
        </div>
        <div className="flex gap-3">
             <button
            onClick={generateAllImages}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <ImageIcon size={18} /> 生成所有图片
          </button>
          <button
            onClick={onNext}
            className="px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors bg-green-600 hover:bg-green-500 text-white"
          >
            完成并导出 <Download size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-1/2 xl:w-5/12 relative bg-black/40 flex items-center justify-center min-h-[350px] border-r border-slate-700/50 p-4">
              {scene.imageUrl ? (
                <div className="relative w-full h-full">
                    <img src={scene.imageUrl} alt={`Scene ${scene.number}`} className="w-full h-full object-contain rounded-lg shadow-md" />
                    <button 
                        onClick={() => generateImage(scene.id)}
                        disabled={scene.isLoading}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors border border-white/10"
                        title="重新生成"
                    >
                        <RefreshCw className={scene.isLoading ? "animate-spin" : ""} size={16} />
                    </button>
                </div>
              ) : (
                <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900/80 transition-colors group">
                    {scene.isLoading ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                                <ImageIcon size={24} className="text-blue-500" />
                            </div>
                            <p className="text-blue-400 font-medium animate-pulse">正在绘制场景...</p>
                            <p className="text-slate-500 text-xs mt-2">AI正在构思画面细节</p>
                        </div>
                    ) : (
                        <div className="text-center p-6 flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <Film className="text-slate-500" size={36} />
                            </div>
                            <h3 className="text-slate-300 font-bold text-lg mb-1">场景 {scene.number}</h3>
                            <p className="text-slate-500 text-sm mb-6 max-w-[200px]">尚未生成视觉草图，点击下方按钮开始生成。</p>
                            
                            <button
                                onClick={() => generateImage(scene.id)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 hover:translate-y-[-2px] active:translate-y-[0px]"
                            >
                            <ImageIcon size={18}/> 生成预览图
                            </button>
                        </div>
                    )}
                </div>
              )}
               
               <div className="absolute top-6 left-6 pointer-events-none">
                   <div className="bg-slate-900/90 text-white font-mono font-bold px-3 py-1 rounded border border-slate-700 shadow-xl backdrop-blur-md">
                       #{scene.number.toString().padStart(2, '0')}
                   </div>
               </div>
            </div>

            {/* Content Section */}
            <div className="p-6 lg:w-1/2 xl:w-7/12 flex flex-col gap-4">
               
               {/* Description */}
               <div className="space-y-1">
                   <label className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1"><Play size={12}/> 动作描述</label>
                   <textarea
                    value={scene.description}
                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-sm p-3 rounded border border-slate-700 focus:border-blue-500 outline-none resize-none h-20"
                   />
               </div>

                {/* Dialogue */}
               <div className="space-y-1">
                   <label className="text-xs font-bold text-green-400 uppercase flex items-center gap-1"><MessageCircle size={12}/> 对白</label>
                   <textarea
                    value={scene.dialogue}
                    onChange={(e) => updateScene(scene.id, { dialogue: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-sm p-3 rounded border border-slate-700 focus:border-green-500 outline-none resize-none h-16"
                   />
               </div>

               <div className="flex gap-4">
                   {/* Camera */}
                   <div className="space-y-1 flex-1">
                       <label className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1"><Camera size={12}/> 景别/镜头</label>
                       <input
                        type="text"
                        value={scene.camera}
                        onChange={(e) => updateScene(scene.id, { camera: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-sm p-2 rounded border border-slate-700 focus:border-purple-500 outline-none"
                       />
                   </div>
                   {/* Action (Short) */}
                   <div className="space-y-1 flex-1">
                       <label className="text-xs font-bold text-orange-400 uppercase flex items-center gap-1">动作类型</label>
                       <input
                        type="text"
                        value={scene.action}
                        onChange={(e) => updateScene(scene.id, { action: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-sm p-2 rounded border border-slate-700 focus:border-orange-500 outline-none"
                       />
                   </div>
               </div>

               {/* Prompt (Collapsible or just visible for power users) */}
               <div className="space-y-1 pt-2 border-t border-slate-700 mt-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">隐藏视觉提示词 (可编辑)</label>
                   <textarea
                    value={scene.visualPrompt}
                    onChange={(e) => updateScene(scene.id, { visualPrompt: e.target.value })}
                    className="w-full bg-slate-950 text-slate-400 text-xs p-2 rounded border border-slate-800 focus:border-slate-600 outline-none resize-none h-16 font-mono"
                   />
               </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
