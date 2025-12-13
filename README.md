# StoryBoard AI - AI 驱动的智能分镜脚本生成器

![StoryBoard AI Cover](https://placehold.co/1200x600/0f172a/60a5fa?text=StoryBoard+AI&font=montserrat)

StoryBoard AI 是一个现代化的 Web 应用程序，旨在利用 Google Gemini 模型的强大能力，帮助创作者、导演和编剧快速将文字故事转化为可视化的分镜脚本和动态预览（Animatic）。

## ✨ 核心功能

### 1. 故事分析与配置
*   **多风格支持**：支持电影感、赛博朋克、水彩、动漫等多种视觉风格。
*   **画幅定制**：支持 **16:9 (电影/桌面)** 和 **9:16 (Shorts/Reels)**，完美适配 Veo 视频模型。
*   **成本估算**：实时显示预计消耗的 Tokens 和图片数量，帮助控制 API 成本。
*   **智能分析**：基于 `Gemini 2.5 Flash` 分析故事结构。

### 2. 角色一致性设计
*   **自动提取**：从故事中自动提取主要角色。
*   **特征生成**：生成详细的角色性格描述和用于绘图的 `Visual Prompt`。
*   **参考图生成**：使用 `Gemini 3 Pro Image` 模型为每个角色生成标准参考图 (支持 2K 分辨率)，确保后续分镜中的人物一致性。
*   **用户干预**：支持手动上传参考图或修改 Prompt 重绘。

### 3. 智能分镜生成 (Visual Storytelling)
*   **场景拆解**：自动将故事拆解为指定数量的关键帧（Keyframes）。
*   **细节填充**：自动生成运镜方式（Camera Movement）、动作描述、对白。
*   **Prompt 融合**：自动将角色参考图的特征注入到场景 Prompt 中，最大程度保持角色长相一致。
*   **高质量绘图**：批量生成高质量场景图。

### 4. Veo 视频预览 (Animatic)
*   **图生视频**：集成 Google 最新的 **Veo 3.1** 视频模型。
*   **动态预览**：支持点击分镜单独生成 5-10秒 的动态预览视频。
*   **画幅匹配**：严格遵循 16:9 或 9:16 标准，确保视频生成无缝衔接。
*   **可控运镜**：提供专属的 `Video Prompt` 编辑框，精确控制视频中的动作和运镜。

### 5. 导出与交付
*   **一键打包**：将所有素材打包为 ZIP 下载。
*   **包含内容**：
    *   `project_summary.md`：完整项目文档。
    *   `characters/`：角色设定文档与高清参考图。
    *   `scenes/`：分镜脚本详情与高清场景图。

---

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, Vite
*   **UI Framework**: Tailwind CSS
*   **AI SDK**: Google GenAI SDK (`@google/genai`)
*   **Models**:
    *   文本/逻辑: `gemini-2.5-flash`
    *   图像生成: `gemini-3-pro-image-preview`
    *   视频生成: `veo-3.1-fast-generate-preview`

---

## 🚀 部署与运行

### 前置要求

1.  **Google Cloud API Key**: 您需要一个开通了 Gemini API 权限的 API Key。
    *   请确保该 Key 有权访问 `Gemini 2.5 Flash`, `Gemini 3 Pro`, 和 `Veo` 模型。
    *   注意：Veo 视频生成通常需要付费账号或特定白名单权限。

### Windows 快速启动 (推荐)

项目包含一个 `update_and_run.txt` 文件，用于简化 Windows 环境下的更新和启动流程。

1.  将 `update_and_run.txt` 重命名为 **`update_and_run.bat`**。
2.  确保您已安装 **Node.js** 和 **Git**。
3.  双击运行 `update_and_run.bat`，它将自动执行：
    *   拉取最新代码 (git pull)。
    *   安装依赖 (npm install)。
    *   启动应用 (npm start)。

### 手动本地开发

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-repo/storyboard-ai.git
    cd storyboard-ai
    ```

2.  **设置环境变量**

    **方法 A: 使用 .env 文件**
    在项目根目录创建 `.env` 文件：
    ```env
    API_KEY=your_google_api_key_here
    ```

    **方法 B: Windows CMD (命令提示符) 设置**
    
    *   **临时设置** (仅当前终端窗口有效，关闭后失效):
        ```cmd
        set API_KEY=your_google_api_key_here
        ```

    *   **永久设置** (保存到用户环境变量，重启终端生效):
        ```cmd
        setx API_KEY "your_google_api_key_here"
        ```
        *注意：使用 `setx` 后，需要关闭当前命令行窗口并重新打开一个新的窗口，变量才会生效。*
        
    *   **验证设置**:
        ```cmd
        echo %API_KEY%
        ```

3.  **安装依赖**
    ```bash
    npm install
    ```

4.  **启动开发服务器**
    ```bash
    npm start
    ```

### 生产环境部署

本项目是纯静态 SPA（单页应用），可以部署在任何静态托管服务上（Vercel, Netlify, GitHub Pages, AWS S3 等）。

1.  **构建**
    ```bash
    npm run build
    ```

2.  **上传 `dist` 目录**
    将生成的 `dist` (或 `build`) 目录内容上传至服务器。

---

## ⚠️ 注意事项

1.  **API 成本**：
    *   图片生成（特别是 Gemini 3 Pro 2K分辨率）和 Veo 视频生成会消耗较多额度。请关注 Google AI Studio 的配额限制。
    *   Step 1 界面提供了粗略的 Token 估算，但实际计费请以 Google Cloud Console 为准。

2.  **视频生成 (Veo)**：
    *   Veo 模型生成视频需要一定时间（通常 30-60秒），请耐心等待。
    *   生成视频必须先生成场景图片（Image-to-Video 模式以保证画面连贯性）。
    *   **画幅限制**：仅支持 16:9 和 9:16。

3.  **角色一致性**：
    *   虽然我们在 Prompt 中注入了角色特征，但目前的 AI 模型（即便是最先进的）在长序列中保持角色 100% 一致仍有挑战。手动微调每个场景的 Visual Prompt 可以获得更好效果。

4.  **数据隐私**：
    *   这是一个纯前端应用，您的 API Key 和生成的内容仅在您的浏览器和 Google 服务器之间传输，不会经过第三方服务器。

---

## 📸 预览图

*(此处为示例占位符，部署后可截图替换)*

| 故事输入 | 角色生成 | 分镜列表 | 视频预览 |
| :---: | :---: | :---: | :---: |
| 📝 | 👤 | 🎬 | 🎥 |

---

Developed with ❤️ using Google Gemini API.