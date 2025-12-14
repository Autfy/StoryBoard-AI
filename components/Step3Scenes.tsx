import React, { useState, useEffect, useRef } from "react";
import { Scene, StorySettings } from "../types";
import { RefreshCw, Image as ImageIcon, Download, Film, Camera, MessageCircle, Play, Video, Music, Clock, Shuffle, ChevronLeft, Mic, Volume2, UserCheck } from "lucide-react";

interface Props {
  scenes: Scene[];
  settings: StorySettings;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  generateImage: (id: string) => void;
  generateVideo: (id: string) => void;
  generateAudio: (id: string, voiceName: string) => void; // Updated Prop for TTS
  generateAllImages: () => void;
  generateAllVideos: () => void;
  onNext: () => void;
  onBack: () => void;
}

// Sub-component to manage individual scene state (Image/Video toggle)
const SceneCard: React.FC<{
    scene: Scene;
    settings: StorySettings;
    updateScene: (id: string, updates: Partial<Scene>) => void;
    generateImage: (id: string) => void;
    generateVideo: (id: string) => void;
    generateAudio: (id: string, voiceName: string) => void;
}> = ({ scene, settings, updateScene, generateImage, generateVideo, generateAudio }) => {
    
    // View Mode State: 'image' or 'video'
    const [viewMode, setViewMode] = useState<'image' | 'video'>('image');
    // Voice Selection State
    const [selectedVoice, setSelectedVoice] = useState("Kore");
    
    const audioRef = useRef<HTMLAudioElement>(null);

    // Auto-switch to video when it becomes available or is loading
    useEffect(() => {
        if (scene.videoUrl || scene.isVideoLoading) {
            setViewMode('video');
        } else if (scene.imageUrl && !scene.videoUrl) {
            setViewMode('image');
        }
    }, [scene.videoUrl, scene.isVideoLoading, scene.imageUrl]);

    // Handle audio play when url changes
    useEffect(() => {
        if (scene.audioUrl && audioRef.current) {
             // audioRef.current.play(); // Optional auto-play
        }
    }, [scene.audioUrl]);

    const isVideoMode = viewMode === 'video';
    const isImageMode = viewMode === 'image';
    
    // Calculate container class based on Aspect Ratio settings
    // We strictly follow the aspect ratio to adapt to 16:9 or 9:16
    // We use w-full to fill the column width, and aspect class to determine height
    const ratioClass = settings.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video";
    const mediaContainerClass = `w-full ${ratioClass}`;

    const VOICES = [
        { name: "Kore", label: "Kore (女声/平衡)", color: "text-pink-400" },
        { name: "Puck", label: "Puck (男声/活力)", color: "text-blue-400" },
        { name: "Charon", label: "Charon (男声/深沉)", color: "text-purple-400" },
        { name: "Zephyr", label: "Zephyr (女声/柔和)", color: "text-teal-400" },
        { name: "Fenrir", label: "Fenrir (男声/粗犷)", color: "text-red-400" },
    ];

    return (
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col lg:flex-row">
            {/* Visuals Section (Image + Video Toggle) */}
            <div className="lg:w-1/2 xl:w-5/12 bg-black/40 border-r border-slate-700/50 flex flex-col relative">
                
                {/* VIDEO READY BADGE */}
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
                        <div className={`relative group bg-black/50 rounded-lg flex items-center justify-center ${mediaContainerClass}`}>
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

                             {/* Regenerate/Generate Video Button */}
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
                        <div className={`relative group ${mediaContainerClass}`}>
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

                {/* Status Bar */}
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
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                       <label className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2"><Play size={14}/> 动作描述</label>
                       <textarea
                        value={scene.description}
                        onChange={(e) => updateScene(scene.id, { description: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-blue-500 outline-none resize-none h-24 leading-relaxed"
                       />
                   </div>
                   
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

                {/* 2. Dialogue & Audio Gen */}
               <div className="space-y-2">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                       <label className="text-sm font-bold text-green-400 uppercase flex items-center gap-2"><MessageCircle size={14}/> 对白</label>
                       
                       {/* Audio Generator Controls */}
                       <div className="flex flex-wrap items-center gap-2">
                           {scene.audioUrl && (
                               <audio ref={audioRef} controls src={scene.audioUrl} className="h-8 w-32 md:w-48" />
                           )}
                           
                           {/* Voice Dropdown */}
                           <div className="relative group">
                                <select 
                                    className="appearance-none bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs py-1.5 pl-3 pr-8 rounded-full border border-slate-600 outline-none cursor-pointer font-bold"
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                >
                                    {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                    <UserCheck size={12} />
                                </div>
                                {/* Tooltip for Voice Desc */}
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-32 bg-black/80 text-white text-xs rounded p-2 z-50 pointer-events-none">
                                    {VOICES.find(v => v.name === selectedVoice)?.label}
                                </div>
                           </div>

                           <button 
                             onClick={() => generateAudio(scene.id, selectedVoice)}
                             disabled={scene.isAudioLoading || !scene.dialogue || scene.dialogue === "无对白"}
                             className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors ${
                                 scene.audioUrl 
                                    ? "bg-slate-700 text-green-400 hover:bg-slate-600" 
                                    : "bg-green-600 text-white hover:bg-green-500"
                             } disabled:opacity-50 disabled:cursor-not-allowed`}
                             title={`使用 ${selectedVoice} 生成中文配音`}
                           >
                               {scene.isAudioLoading ? (
                                   <RefreshCw size={12} className="animate-spin"/>
                               ) : (
                                   <Volume2 size={12}/>
                               )}
                               {scene.isAudioLoading ? "配音中..." : scene.audioUrl ? "重配" : "配音"}
                           </button>
                       </div>
                   </div>
                   <textarea
                    value={scene.dialogue}
                    onChange={(e) => updateScene(scene.id, { dialogue: e.target.value })}
                    className="w-full bg-slate-900/50 text-slate-200 text-base p-4 rounded-lg border border-slate-700 focus:border-green-500 outline-none resize-none h-20 leading-relaxed"
                   />
               </div>

               {/* 3. Tech Specs */}
               <div className="flex gap-6">
                   <div className="space-y-2 flex-1">
                       <label className="text-sm font-bold text-purple-400 uppercase flex items-center gap-2"><Camera size={14}/> 景别/镜头</label>
                       <input
                        type="text"
                        value={scene.camera}
                        onChange={(e) => updateScene(scene.id, { camera: e.target.value })}
                        className="w-full bg-slate-900/50 text-slate-200 text-base p-3 rounded-lg border border-slate-700 focus:border-purple-500 outline-none"
                       />
                   </div>
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

export const Step3Scenes: React.FC<Props> = ({ 
    scenes, 
    settings, 
    updateScene, 
    generateImage, 
    generateVideo, 
    generateAudio, 
    generateAllImages, 
    generateAllVideos, 
    onNext, 
    onBack 
}) => {
    const imagesCount = scenes.filter(s => s.imageUrl).length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
             {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-[#0f172a]/95 backdrop-blur z-40 py-4 border-b border-slate-800 -mx-4 px-4 md:-mx-6 md:px-6">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        分镜脚本 <span className="text-slate-500 text-lg font-normal">({scenes.length} Scenes)</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        细化每个镜头。支持生成分镜图 (Image)、视频 (Veo) 和配音 (TTS)。
                    </p>
                </div>

                 <div className="flex flex-wrap gap-3">
                     <button
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-600"
                    >
                        <ChevronLeft size={18} /> 返回
                    </button>

                    <div className="h-8 w-px bg-slate-700 mx-1 hidden md:block"></div>

                     <button
                        onClick={generateAllImages}
                        className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        title="生成所有缺失的图片"
                    >
                        <ImageIcon size={18} /> 
                        <span className="hidden sm:inline">批量生图</span>
                        <span className="bg-blue-500/20 text-xs px-1.5 py-0.5 rounded ml-1">{scenes.length - imagesCount}</span>
                    </button>

                     <button
                        onClick={generateAllVideos}
                        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        title="生成所有视频 (需先有图片)"
                    >
                        <Video size={18} /> 
                        <span className="hidden sm:inline">批量视频</span>
                         <span className="bg-purple-500/20 text-xs px-1.5 py-0.5 rounded ml-1">{scenes.filter(s => s.imageUrl && !s.videoUrl).length}</span>
                    </button>

                     <button
                        onClick={onNext}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        下一步：导出 <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Scenes List */}
            <div className="space-y-12">
                {scenes.map((scene) => (
                    <SceneCard
                        key={scene.id}
                        scene={scene}
                        settings={settings}
                        updateScene={updateScene}
                        generateImage={generateImage}
                        generateVideo={generateVideo}
                        generateAudio={generateAudio}
                    />
                ))}
            </div>
        </div>
    );
};
