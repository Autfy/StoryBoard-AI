import React, { useState } from "react";
import { Character, StorySettings } from "../types";
import { RefreshCw, User, Wand2, ChevronRight, Upload, Mic, Zap, ChevronLeft, Download, FileJson, Package, RotateCw } from "lucide-react";
// @ts-ignore - Importing from CDN in ESM
import JSZip from "jszip";

interface Props {
  characters: Character[];
  settings: StorySettings;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  generateImage: (id: string) => void;
  generateAllImages: () => void; // New Prop
  onNext: () => void;
  onBack: () => void; // New Prop
  isLoadingNext: boolean;

  // New Props for regeneration logic
  hasScenes?: boolean;
  onRegenerateNext?: () => void;
}

export const Step2Characters: React.FC<Props> = ({ 
    characters, settings, updateCharacter, generateImage, generateAllImages, 
    onNext, onBack, isLoadingNext, hasScenes, onRegenerateNext
}) => {
  
  // Track which character is currently exporting to show loading state
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Determine aspect ratio class based on settings
  const aspectClass = settings.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video";

  // Export Character Package (ZIP) - Same format as Step 4
  const handleExportCharacter = async (char: Character) => {
    setExportingId(char.id);
    try {
        const zip = new JSZip();
        const safeName = char.name.replace(/[\\/:*?"<>|]/g, "_").replace(/\s+/g, "_") || "character";
        
        // 1. JSON Data (For reuse - Importable)
        // This is the file users can upload back to "Import"
        const jsonContent = JSON.stringify(char, null, 2);
        zip.file(`${safeName}.json`, jsonContent);

        // 2. Info Text (Readable)
        const infoContent = `角色名称: ${char.name}

角色描述 (特征):
${char.description}

说话/配音风格 (Speaker Style):
${char.speakerStyle || "N/A"}

视觉提示词 (Visual Prompt):
${char.visualPrompt}
`;
        zip.file(`${safeName}_info.txt`, infoContent);

        // 3. Image (PNG)
        if (char.imageUrl) {
            const base64Data = char.imageUrl.split(',')[1];
            zip.file(`${safeName}_ref.png`, base64Data, { base64: true });
        }

        // Generate and Download
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}_character_pack.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export failed", e);
        alert("导出角色包失败");
    } finally {
        setExportingId(null);
    }
  };

  // Import Character Data from JSON
  const handleImportCharacter = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Validate basic structure
        if (json.name && json.visualPrompt) {
            // Keep the current ID to avoid key issues, update content
            updateCharacter(id, {
                name: json.name,
                description: json.description,
                visualPrompt: json.visualPrompt,
                speakerStyle: json.speakerStyle,
                imageUrl: json.imageUrl // This will load the base64 image if present
            });
            // REMOVED ALERT as requested
            // alert(`成功导入角色: ${json.name}`);
        } else {
            alert("文件格式不正确，缺少必要字段。");
        }
      } catch (err) {
        console.error("Import failed", err);
        alert("无法解析 JSON 文件。请确保上传的是 .json 数据文件。");
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">角色设计</h2>
          <p className="text-slate-400 text-lg mt-1">审查生成的角色并创建参考图。支持导入/导出角色包以复用设定。</p>
        </div>
        <div className="flex gap-4">
             <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-lg"
            >
                <ChevronLeft size={20} /> 上一步
            </button>
             <button
                onClick={generateAllImages}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors shadow-lg"
            >
                <Zap size={20} /> 一键生成所有
            </button>
            
            {hasScenes ? (
               <div className="flex gap-2">
                    <button
                        onClick={onRegenerateNext}
                        disabled={isLoadingNext}
                        className="px-4 py-3 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl font-bold text-lg flex items-center gap-2 transition-colors"
                        title="重新生成分镜脚本 (覆盖现有)"
                    >
                        <RotateCw size={20} /> <span className="hidden xl:inline">重写分镜</span>
                    </button>
                    <button
                        onClick={onNext}
                        disabled={isLoadingNext}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        下一步：分镜脚本 <ChevronRight size={20} />
                    </button>
               </div>
            ) : (
                <button
                    onClick={onNext}
                    disabled={isLoadingNext}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                    {isLoadingNext ? "正在生成分镜..." : "下一步：分镜脚本"} <ChevronRight size={20} />
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 gap-8">
        {characters.map((char) => (
          <div key={char.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg flex flex-col">
            
            {/* Toolbar for Import/Export */}
            <div className="bg-slate-900/50 p-3 flex justify-end gap-3 border-b border-slate-700">
                <button 
                    onClick={() => handleExportCharacter(char)}
                    disabled={exportingId === char.id}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-green-400 rounded-lg border border-slate-700 transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                    title="导出角色包 (ZIP)"
                >
                    {exportingId === char.id ? (
                        <RefreshCw size={16} className="animate-spin text-green-500"/>
                    ) : (
                        <Package size={16} />
                    )}
                    <span>导出</span>
                </button>
                
                <label 
                    htmlFor={`import-${char.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center gap-2 text-sm font-bold shadow-sm"
                    title="导入角色数据 (JSON)"
                >
                    <FileJson size={16} />
                    <span>导入</span>
                </label>
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    id={`import-${char.id}`}
                    onChange={(e) => handleImportCharacter(e, char.id)}
                />
            </div>

            {/* Dynamic Aspect Ratio Container */}
            <div className={`relative ${aspectClass} bg-slate-900 group transition-all duration-300`}>
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
                    title="上传参考图 (仅图片)"
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