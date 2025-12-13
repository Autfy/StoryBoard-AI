import React from "react";
import { Scene, StorySettings } from "../types";
import { RefreshCw, Image as ImageIcon, Download, Film, Camera, MessageCircle, Play, Video, Music, Clock } from "lucide-react";

interface Props {
  scenes: Scene[];
  settings: StorySettings;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  generateImage: (id: string) => void;
  generateVideo: (id: string) => void;
  generateAllImages: () => void;
  onNext: () => void;
}

export const Step3Scenes: React.FC<Props> = ({ scenes, settings, updateScene, generateImage, generateVideo, generateAllImages, onNext }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-white">分镜脚本</h2>
          <p className="text-slate-400 text-base mt-1">审查脚本，生成场景视觉图，并可选择生成动态视频 (Veo)。</p>
        </div>
        <div className="flex gap-4">
             <button
            onClick={generateAllImages}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base flex items-center gap-2 transition-colors shadow-lg"
          >
            <ImageIcon size={20} /> 生成所有图片
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 rounded-xl font-bold text-base flex items-center gap-2 transition-colors bg-green-600 hover:bg-green-500 text-white shadow-lg"
          >
            完成并导出 <Download size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {scenes.map((scene, idx) => (
          <div key={scene.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col lg:flex-row">
            {/* Visuals Section (Image + Video Tab) */}
            <div className="lg:w-1/2 xl:w-5/12 bg-black/40 border-r border-slate-700/50 flex flex-col">
                {/* Media Display */}
                <div className="relative flex-1 min-h-[360px] flex items-center justify-center p-6">
                    {scene.videoUrl ? (
                         <div className="relative w-full h-full group">
                            <video 
                                src={scene.videoUrl} 
                                controls 
                                loop 
                                className="w-full h-full object-contain rounded-lg shadow-md" 
                            />
                             <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => generateVideo(scene.id)}
                                    disabled={scene.isVideoLoading}
                                    className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-sm border border-white/10"
                                    title="重新生成视频"
                                >
                                    <RefreshCw className={scene.isVideoLoading ? "animate-spin" : ""} size={20} />
                                </button>
                             </div>
                        </div>
                    ) : scene.imageUrl ? (
                        <div className="relative w-full h-full">
                            <img src={scene.imageUrl} alt={`Scene ${scene.number}`} className="w-full h-full object-contain rounded-lg shadow-md" />
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button 
                                    onClick={() => generateImage(scene.id)}
                                    disabled={scene.isLoading}
                                    className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-sm transition-colors border border-white/10"
                                    title="重新生成图片"
                                >
                                    <RefreshCw className={scene.isLoading ? "animate-spin" : ""} size={20} />
                                </button>
                            </div>
                            {/* Overlay CTA for Video */}
                            {!scene.isVideoLoading && (
                                <div className="absolute bottom-5 right-5">
                                     <button
                                        onClick={() => generateVideo(scene.id)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-full shadow-lg font-bold text-base transition-transform hover:scale-105"
                                    >
                                        <Video size={18} /> 生成视频
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900/80 transition-colors group">
                            {scene.isLoading ? (
                                <div className="flex flex-col items-center">
                                    <ImageIcon size={48} className="text-blue-500 animate-pulse mb-3" />
                                    <p className="text-blue-400 font-bold text-lg">正在绘制场景...</p>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <Film className="text-slate-500 mx-auto mb-4" size={48} />
                                    <p className="text-slate-500 text-base mb-6">暂无画面</p>
                                    <button
                                        onClick={() => generateImage(scene.id)}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors text-base"
                                    >
                                        生成预览图
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Video Loading Overlay */}
                    {scene.isVideoLoading && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                             <div className="w-14 h-14 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-5"></div>
                             <p className="text-purple-300 font-bold text-lg animate-pulse">Veo 正在渲染视频...</p>
                             <p className="text-slate-400 text-sm mt-2">通常需要 30-60 秒</p>
                        </div>
                    )}
                </div>

                {/* Status Bar */}
                <div className="bg-slate-900/50 p-3 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400">
                    <span className="font-mono font-bold bg-slate-800 px-3 py-1 rounded text-slate-200">场景 {scene.number}</span>
                    <span className="flex items-center gap-3">
                        {scene.estimatedDuration && <span className="flex items-center gap-1.5 text-slate-300"><Clock size={14}/> {scene.estimatedDuration}</span>}
                        {scene.videoUrl ? (
                            <span className="text-purple-400 flex items-center gap-1.5 font-medium"><Video size={14}/> 视频已就绪</span>
                        ) : (
                            <span className="text-slate-500">仅图片</span>
                        )}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 lg:w-1/2 xl:w-7/12 flex flex-col gap-6">
               
               {/* Description */}
               <div className="space-y-2">
                   <label className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2"><Play size={14}/> 动作描述</label>
                   <textarea
                    value={scene.description}
                    onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-blue-500 outline-none resize-none h-24 leading-relaxed"
                   />
               </div>

                {/* Dialogue */}
               <div className="space-y-2">
                   <label className="text-sm font-bold text-green-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> 对白</label>
                   <textarea
                    value={scene.dialogue}
                    onChange={(e) => updateScene(scene.id, { dialogue: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-green-500 outline-none resize-none h-20 leading-relaxed"
                   />
               </div>

               <div className="flex gap-6">
                   {/* Camera */}
                   <div className="space-y-2 flex-1">
                       <label className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2"><Camera size={14}/> 景别/镜头</label>
                       <input
                        type="text"
                        value={scene.camera}
                        onChange={(e) => updateScene(scene.id, { camera: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
                       />
                   </div>
                   {/* Action Type */}
                   <div className="space-y-2 flex-1">
                       <label className="text-sm font-bold text-orange-400 uppercase flex items-center gap-2">动作类型</label>
                       <input
                        type="text"
                        value={scene.action}
                        onChange={(e) => updateScene(scene.id, { action: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-3 rounded-lg border border-slate-700 focus:border-orange-500 outline-none"
                       />
                   </div>
               </div>
               
               <div className="flex gap-6">
                   {/* Sound Prompt */}
                   <div className="space-y-2 flex-[2]">
                       <label className="text-sm font-bold text-pink-400 uppercase flex items-center gap-2"><Music size={14}/> 音效/配乐 (Sound Prompt)</label>
                       <input
                        type="text"
                        value={scene.soundPrompt || ""}
                        onChange={(e) => updateScene(scene.id, { soundPrompt: e.target.value })}
                        placeholder="e.g. 紧张的鼓点，雨声..."
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-3 rounded-lg border border-slate-700 focus:border-pink-500 outline-none"
                       />
                   </div>
                    {/* Duration */}
                   <div className="space-y-2 flex-1">
                       <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2"><Clock size={14}/> 预估时长</label>
                       <input
                        type="text"
                        value={scene.estimatedDuration || ""}
                        onChange={(e) => updateScene(scene.id, { estimatedDuration: e.target.value })}
                        placeholder="e.g. 5s"
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-3 rounded-lg border border-slate-700 focus:border-slate-500 outline-none"
                       />
                   </div>
               </div>

               {/* Video Prompt (Collapsible or just visible for power users) */}
               <div className="space-y-2 pt-3 border-t border-slate-700 mt-2">
                   <div className="flex items-center justify-between">
                       <label className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2"><Video size={14}/> 视频生成提示词 (Veo)</label>
                   </div>
                   <textarea
                    value={scene.videoPrompt || ""}
                    onChange={(e) => updateScene(scene.id, { videoPrompt: e.target.value })}
                    placeholder="Describe the motion for the video..."
                    className="w-full bg-slate-950 text-purple-200/70 text-sm p-3 rounded-lg border border-slate-800 focus:border-purple-500/50 outline-none resize-none h-20 font-mono leading-relaxed"
                   />
               </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};