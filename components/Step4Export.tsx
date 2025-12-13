import React, { useState } from "react";
import { Scene, Character, StorySettings } from "../types";
import { Download, CheckCircle, Package } from "lucide-react";
// @ts-ignore - Importing from CDN in ESM
import JSZip from "https://esm.run/jszip"; 

interface Props {
  scenes: Scene[];
  characters: Character[];
  settings: StorySettings;
}

export const Step4Export: React.FC<Props> = ({ scenes, characters, settings }) => {
  const [isZipping, setIsZipping] = useState(false);

  const handleDownload = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // 1. Add Story Info Summary
      const storyContent = `
# ${settings.style} 分镜脚本项目
## 故事梗概
${settings.storyText}

## 统计
- 角色: ${characters.length}
- 场景: ${scenes.length}
      `;
      zip.file("project_summary.md", storyContent);

      // 2. Add Character Images
      const charFolder = zip.folder("characters");
      characters.forEach((c) => {
        if (c.imageUrl) {
          const base64Data = c.imageUrl.split(',')[1];
          charFolder.file(`${c.name.replace(/\s+/g, '_')}_ref.png`, base64Data, { base64: true });
        }
      });

      // 3. Add Scene Files (Text + Image)
      const sceneFolder = zip.folder("scenes");
      scenes.forEach((s) => {
        const sceneNum = s.number.toString().padStart(3, '0');
        
        // Text File for Scene
        const textContent = `场景编号: ${s.number}
动作描述: ${s.description}
对白: ${s.dialogue}
动作类型: ${s.action}
镜头/景别: ${s.camera}

视觉提示词:
${s.visualPrompt}
`;
        sceneFolder.file(`scene_${sceneNum}.txt`, textContent);

        // Image File for Scene (if exists)
        if (s.imageUrl) {
          const base64Data = s.imageUrl.split(',')[1];
          sceneFolder.file(`scene_${sceneNum}.png`, base64Data, { base64: true });
        }
      });

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

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500 pt-10">
      
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/50">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white">项目完成！</h2>
        <p className="text-slate-400 mt-2">您的分镜脚本已准备就绪。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-400"/> 资源汇总
              </h3>
              <ul className="space-y-3 text-slate-300">
                  <li className="flex justify-between border-b border-slate-700 pb-2">
                      <span>角色数量</span>
                      <span className="font-mono text-white">{characters.length}</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-700 pb-2">
                      <span>分镜数量</span>
                      <span className="font-mono text-white">{scenes.length}</span>
                  </li>
                   <li className="flex justify-between border-b border-slate-700 pb-2">
                      <span>已生成图片</span>
                      <span className={`font-mono ${imagesCount === scenes.length ? "text-green-400" : "text-yellow-400"}`}>
                        {imagesCount} / {scenes.length}
                      </span>
                  </li>
                  <li className="flex justify-between">
                      <span>导出结构</span>
                      <span className="font-mono text-white text-xs">场景文本+图片(可选)</span>
                  </li>
              </ul>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-center items-center gap-6">
              <p className="text-center text-slate-400">
                  下载 ZIP 压缩包。<br/>
                  <span className="text-xs text-slate-500">
                    包含 project_summary.md, characters/ 文件夹, 以及 scenes/ 文件夹 (每个场景包含独立的 .txt 和可选的 .png 文件)。
                  </span>
              </p>
              <button
                onClick={handleDownload}
                disabled={isZipping}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 transform transition-all active:scale-95"
              >
                {isZipping ? (
                    <>
                        <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        打包中...
                    </>
                ) : (
                    <>
                        <Download size={24} /> 下载项目包
                    </>
                )}
              </button>
          </div>
      </div>
    </div>
  );
};