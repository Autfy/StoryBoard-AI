import React, { useState } from "react";
import { Scene, Character, StorySettings } from "../types";
import { Download, CheckCircle, Package, ChevronLeft } from "lucide-react";
// @ts-ignore - Importing from CDN in ESM
import JSZip from "jszip"; 

interface Props {
  scenes: Scene[];
  characters: Character[];
  settings: StorySettings;
  analysisSuggestion: string; // Add analysis suggestion prop
  onBack: () => void; // New Prop
}

export const Step4Export: React.FC<Props> = ({ scenes, characters, settings, analysisSuggestion, onBack }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownload = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Calculate total duration safely (handle "5s", "approx 5s", or missing values)
      const totalDuration = scenes.reduce((acc, s) => {
        const val = parseInt(s.estimatedDuration || "0");
        return acc + (isNaN(val) ? 0 : val);
      }, 0);

      // 1. Add Story Info Summary (Including Analysis)
      const storyContent = `
# ${settings.style} 分镜脚本项目

## 故事梗概
${settings.storyText}

## 导演分析建议 (AI Director)
${analysisSuggestion || "无分析记录"}

## 统计
- 角色数: ${characters.length}
- 分镜数: ${scenes.length}
- 总预估时长: ~${totalDuration} 秒

## 角色列表
${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}
      `;
      zip.file("project_summary.md", storyContent);

      // 2. Add Character Files (Images + Info + JSON Data)
      const charFolder = zip.folder("characters");
      characters.forEach((c) => {
        const safeName = c.name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_") || "character";
        
        // A. Character Data JSON (For Re-import/Reuse)
        // This file allows users to import the character back into Step 2 later.
        const charJsonContent = JSON.stringify(c, null, 2);
        charFolder.file(`${safeName}.json`, charJsonContent);

        // B. Character Info Text File (Readable)
        const charInfoContent = `角色名称: ${c.name}

角色描述 (特征):
${c.description}

说话/配音风格 (Speaker Style):
${c.speakerStyle || "N/A"}

视觉提示词 (Visual Prompt):
${c.visualPrompt}
`;
        charFolder.file(`${safeName}_info.txt`, charInfoContent);

        // C. Character Image
        if (c.imageUrl) {
          const base64Data = c.imageUrl.split(',')[1];
          charFolder.file(`${safeName}_ref.png`, base64Data, { base64: true });
        }
      });

      // 3. Add Scene Files (Text + Image + Video + Audio)
      const sceneFolder = zip.folder("scenes");
      
      // Use for loop to handle async video fetching
      for (const s of scenes) {
        // Naming convention: scene_001.txt, scene_001.png, scene_001.mp4, scene_001.wav
        const sceneNum = s.number.toString().padStart(3, '0');
        const filePrefix = `scene_${sceneNum}`;
        
        // Text File for Scene
        const textContent = `场景编号: ${s.number}
预估时长: ${s.estimatedDuration || "N/A"}

动作描述: ${s.description}
对白: ${s.dialogue}
动作类型: ${s.action}
镜头/景别: ${s.camera}
转场/衔接建议: ${s.transition || "无"}
音效/音乐提示 (Sound Prompt): ${s.soundPrompt || "N/A"}

视觉提示词 (Image Prompt):
${s.visualPrompt}

视频提示词 (Video Prompt):
${s.videoPrompt || "N/A"}

包含角色:
${s.characters?.join(", ") || "未指定"}
`;
        sceneFolder.file(`${filePrefix}.txt`, textContent);

        // Image File for Scene (if exists)
        if (s.imageUrl) {
          const base64Data = s.imageUrl.split(',')[1];
          sceneFolder.file(`${filePrefix}.png`, base64Data, { base64: true });
        }

        // Audio File (TTS)
        if (s.audioUrl) {
            try {
                const response = await fetch(s.audioUrl);
                const blob = await response.blob();
                sceneFolder.file(`${filePrefix}.wav`, blob);
            } catch(e) {
                console.error(`Failed to export audio for scene ${s.number}`, e);
            }
        }

        // Video File for Scene (if exists)
        if (s.videoUrl) {
           try {
               const response = await fetch(s.videoUrl);
               const blob = await response.blob();
               sceneFolder.file(`${filePrefix}.mp4`, blob);
           } catch(e) {
               console.error(`Failed to export video for scene ${s.number}`, e);
           }
        }
      }

      // Generate Zip
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `storyboard_${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (e) {
      console.error("Zip failed", e);
      alert("创建压缩包失败。");
    } finally {
      setIsZipping(false);
    }
  };

  const imagesCount = scenes.filter(s => s.imageUrl).length;
  const videosCount = scenes.filter(s => s.videoUrl).length;
  const audiosCount = scenes.filter(s => s.audioUrl).length;
  const charImagesCount = characters.filter(c => c.imageUrl).length;

  return (
    <div className="max-w-4xl mx-auto text-center space-y-10 animate-in fade-in zoom-in duration-500 pt-10">
      
      <div className="mb-8">
        <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-bold text-white">项目完成！</h2>
        <p className="text-slate-400 mt-3 text-xl">您的分镜脚本已准备就绪。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Package size={24} className="text-blue-400"/> 资源汇总
              </h3>
              <ul className="space-y-4 text-slate-300 text-lg">
                  <li className="flex justify-between border-b border-slate-700 pb-3">
                      <span>角色</span>
                      <span className="font-mono text-white">
                        {characters.length} 个 (包含 {charImagesCount} 张参考图)
                      </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-3">
                      <span>分镜</span>
                      <span className="font-mono text-white">{scenes.length} 个</span>
                  </li>
                   <li className="flex justify-between border-b border-slate-700 pb-3">
                      <span>已生成分镜图</span>
                      <span className={`font-mono ${imagesCount === scenes.length ? "text-green-400" : "text-yellow-400"}`}>
                        {imagesCount} / {scenes.length}
                      </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-3">
                      <span>已生成视频 (Veo)</span>
                      <span className={`font-mono ${videosCount > 0 ? "text-purple-400" : "text-slate-500"}`}>
                        {videosCount} 个
                      </span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-3">
                      <span>已生成配音 (TTS)</span>
                      <span className={`font-mono ${audiosCount > 0 ? "text-pink-400" : "text-slate-500"}`}>
                        {audiosCount} 个
                      </span>
                  </li>
                  <li className="flex justify-between">
                      <span>文件结构</span>
                      <span className="font-mono text-white text-sm text-right leading-relaxed">
                        characters/<br/>scenes/<br/>project_summary.md
                      </span>
                  </li>
              </ul>
          </div>

          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex flex-col justify-center items-center gap-8 shadow-xl">
              <div className="text-center w-full space-y-4">
                  <p className="text-center text-slate-400 text-lg">
                      下载 ZIP 压缩包。<br/>
                      <span className="text-sm text-slate-500 mt-2 block">
                        包含完整的故事梗概、角色设定文档与参考图、以及所有分镜的脚本与视觉图（含视频和配音）。
                      </span>
                  </p>
                  <button
                    onClick={handleDownload}
                    disabled={isZipping}
                    className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-xl shadow-lg shadow-green-900/20 flex items-center justify-center gap-3 transform transition-all active:scale-95"
                  >
                    {isZipping ? (
                        <>
                            <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></span>
                            打包中...
                        </>
                    ) : (
                        <>
                            <Download size={28} /> 下载项目包
                        </>
                    )}
                  </button>
                  
                   <button 
                    onClick={onBack}
                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
                  >
                      <ChevronLeft size={20} /> 返回修改
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}