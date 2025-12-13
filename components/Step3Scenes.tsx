import React, { useState, useEffect } from "react";
import { Scene, StorySettings } from "../types";
import { RefreshCw, Image as ImageIcon, Download, Film, Camera, MessageCircle, Play, Video, Music, Clock, Shuffle, ChevronLeft } from "lucide-react";

interface Props {
  scenes: Scene[];
  settings: StorySettings;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  generateImage: (id: string) => void;
  generateVideo: (id: string) => void;
  generateAllImages: () => void;
  generateAllVideos: () => void;
  onNext: () => void;
  onBack: () => void; // New Prop
}

// Sub-component to manage individual scene state (Image/Video toggle)
const SceneCard: React.FC<{
    scene: Scene;
    settings: StorySettings;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    generateImage: (id: string) => void;
    generateVideo: (id: string) => void;
}> = ({ scene, settings, updateScene, generateImage, generateVideo }) => {
    
    // View Mode State: 'image' or 'video'
    const [viewMode, setViewMode] = useState<'image' | 'video'>('image');

    // Auto-switch to video when it becomes available or is loading
    useEffect(() => {
        if (scene.videoUrl || scene.isVideoLoading) {
            setViewMode('video');
        } else if (scene.imageUrl && !scene.videoUrl) {
            setViewMode('image');
        }
    }, [scene.videoUrl, scene.isVideoLoading, scene.imageUrl]);

    const isVideoMode = viewMode === 'video';
    const isImageMode = viewMode === 'image';

    // Determine aspect ratio class
    const aspectClass = settings.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video";

    return (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col lg:flex-row">
            {/* Visuals Section (Image + Video Toggle) */}
            <div className="lg:w-1/2 xl:w-5/12 bg-black/40 border-r border-slate-700/50 flex flex-col relative">
                
                {/* VIDEO READY BADGE (Top Left) - High Visibility */}
                {scene.videoUrl && (
                    <div className="absolute top-0 left-0 z-20 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-br-lg shadow-lg flex items-center gap-1.5 animate-in fade-in duration-300">
                        <Video size={14} className="fill-current" /> 视频已生成 (Video Ready)
                    </div>
                )}

                {/* View Mode Toggle (Floating) */}
                <div className="p-4 flex justify-center pb-0">
                    <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-700 flex gap-1 shadow-lg backdrop-blur-md z-10">
                        <button
                            onClick={() => setViewMode('image')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                                isImageMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <ImageIcon size={16} /> 图片
                        </button>
                        <button
                            onClick={() => setViewMode('video')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                                isVideoMode 
                                    ? "bg-purple-600 text-white shadow-sm ring-2 ring-purple-400/30" 
                                    : scene.videoUrl 
                                        ? "text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30" 
                                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                        >
                            <Video size={16} /> {scene.videoUrl ? "观看视频" : "视频"}
                        </button>
                    </div>
                </div>

                {/* Media Display Area */}
                <div className="relative flex-1 min-h-[360px] flex items-center justify-center p-6 pt-2">
                    
                    {/* VIDEO VIEW */}
                    {isVideoMode && (
                        <div className={`relative w-full ${aspectClass} group bg-black/50 rounded-lg flex items-center justify-center`}>
                            {scene.videoUrl ? (
                                <video 
                                    src={scene.videoUrl} 
                                    controls 
                                    loop 
                                    className="w-full h-full object-contain rounded-lg shadow-md" 
                                />
                            ) : (
                                <div className="text-center p-6">
                                    {scene.isVideoLoading ? (
                                         <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                                            <p className="text-purple-300 font-bold animate-pulse">Veo 渲染中...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-50">
                                            <Film size={48} className="mb-2" />
                                            <p>暂无视频</p>
                                        </div>
                                    )}
                                </div>
                            )}

                             {/* Regenerate/Generate Video Button (Only visible if not loading) */}
                            {!scene.isVideoLoading && (
                                <div className="absolute bottom-4 right-4 z-10">
                                    <button
                                        onClick={() => generateVideo(scene.id)}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                                    >
                                        {scene.videoUrl ? <RefreshCw size={16} /> : <Video size={16} />}
                                        {scene.videoUrl ? "重绘视频" : "生成视频"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* IMAGE VIEW */}
                    {isImageMode && (
                        <div className={`relative w-full ${aspectClass} group`}>
                             {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt={`Scene ${scene.number}`} className="w-full h-full object-contain rounded-lg shadow-md bg-slate-900" />
                            ) : (
                                <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-900/50">
                                    {scene.isLoading ? (
                                        <div className="flex flex-col items-center">
                                            <ImageIcon size={48} className="text-blue-500 animate-pulse mb-3" />
                                            <p className="text-blue-400 font-bold">正在绘制场景...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="text-slate-500 mx-auto mb-2" size={32} />
                                            <p className="text-slate-500">暂无图片</p>
                                        </div>
                                    )}
                                </div>
                            )}

                             {/* Regenerate/Generate Image Button */}
                            {!scene.isLoading && (
                                <div className="absolute bottom-4 right-4 z-10">
                                    <button
                                        onClick={() => generateImage(scene.id)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                                    >
                                        {scene.imageUrl ? <RefreshCw size={16} /> : <ImageIcon size={16} />}
                                        {scene.imageUrl ? "重绘图片" : "生成图片"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Status Bar - Enhanced Visibility */}
                <div className="bg-slate-900/80 p-3 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400">
                    <span className="font-mono font-bold bg-slate-800 px-3 py-1 rounded text-slate-200">场景 {scene.number}</span>
                    <span className="flex items-center gap-3">
                        {scene.estimatedDuration && <span className="flex items-center gap-1.5 text-slate-300"><Clock size={14}/> {scene.estimatedDuration}</span>}
                        {scene.videoUrl ? (
                            <span className="text-purple-300 bg-purple-900/50 px-2 py-0.5 rounded border border-purple-500/30 flex items-center gap-1.5 font-bold animate-pulse">
                                <Video size={14} className="fill-current"/> 视频就绪
                            </span>
                        ) : (
                            <span className="text-slate-600 flex items-center gap-1">
                                <Video size={14}/> 无视频
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* Content Section (Right Side) */}
            <div className="p-8 lg:w-1/2 xl:w-7/12 flex flex-col gap-6">
               
               {/* 1. Description & Transition - Grouped for Continuity */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                       <label className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2"><Play size={14}/> 动作描述</label>
                       <textarea
                        value={scene.description}
                        onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-blue-500 outline-none resize-none h-24 leading-relaxed"
                       />
                   </div>
                   
                   {/* Transition Suggestion UI */}
                   <div className="space-y-2">
                       <label className="text-sm font-bold text-teal-400 uppercase flex items-center gap-2">
                           <Shuffle size={14}/> 转场/衔接建议
                       </label>
                       <textarea
                        value={scene.transition || ""}
                        onChange={(e) => updateScene(scene.id, { transition: e.target.value })}
                        placeholder="例如: 硬切, 叠化, 甩镜头..."
                        className="w-full bg-teal-900/10 text-teal-100 text-base p-4 rounded-lg border border-teal-500/30 focus:border-teal-500 outline-none resize-none h-24 leading-relaxed placeholder:text-teal-500/30"
                       />
                   </div>
               </div>

                {/* 2. Dialogue */}
               <div className="space-y-2">
                   <label className="text-sm font-bold text-green-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> 对白</label>
                   <textarea
                    value={scene.dialogue}
                    onChange={(e) => updateScene(scene.id, { dialogue: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-green-500 outline-none resize-none h-20 leading-relaxed"
                   />
               </div>

               {/* 3. Tech Specs */}
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
                       <label className="text-sm font-bold text-pink-400 uppercase flex items-center gap-2"><Music size={14}/> 音效/配乐</label>
                       <input
                        type="text"
                        value={scene.soundPrompt || ""}
                        onChange={(e) => updateScene(scene.id, { soundPrompt: e.target.value })}
                        placeholder="e.g. 紧张的鼓点..."
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

               {/* Video Prompt */}
               <div className="space-y-2 pt-3 border-t border-slate-700 mt-2">
                   <div className="flex items-center justify-between">
                       <label className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2"><Video size={14}/> 视频生成提示词 (Veo)</label>
                   </div>
                   <textarea
                    value={scene.videoPrompt || ""}
                    onChange={(e) => updateScene(scene.id, { videoPrompt: e.target.value })}
                    placeholder="Describe the motion..."
                    className="w-full bg-slate-950 text-purple-200/70 text-sm p-3 rounded-lg border border-slate-800 focus:border-purple-500/50 outline-none resize-none h-20 font-mono leading-relaxed"
                   />
               </div>
            </div>
        </div>
    );
};

export const Step3Scenes: React.FC<Props> = (props) => {
  const { scenes, generateAllImages, generateAllVideos, onNext, onBack } = props;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
       <div className="sticky top-0 z-20 bg-[#0f172a]/95 backdrop-blur-md py-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-white">分镜脚本</h2>
          <p className="text-slate-400 text-base mt-1">审查脚本，生成场景视觉图，并可选择生成动态视频 (Veo)。</p>
        </div>
        <div className="flex gap-4">
            <button
                onClick={onBack}
                className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-base flex items-center gap-2 transition-colors shadow-lg"
            >
                <ChevronLeft size={20} /> 上一步
            </button>
             <button
            onClick={generateAllImages}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base flex items-center gap-2 transition-colors shadow-lg"
          >
            <ImageIcon size={18} /> 一键生成图
          </button>
           <button
            onClick={generateAllVideos}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-base flex items-center gap-2 transition-colors shadow-lg"
          >
            <Video size={18} /> 一键生成视频
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
        {scenes.map((scene) => (
            <SceneCard 
                key={scene.id} 
                scene={scene} 
                settings={props.settings}
                updateScene={props.updateScene}
                generateImage={props.generateImage}
                generateVideo={props.generateVideo}
            />
        ))}
      </div>
    </div>
  );
};