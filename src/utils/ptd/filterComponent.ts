import fs from "fs";
import path from "path";
import { createLogger } from "@/utils/logger";
const logger = createLogger("filterComponent");
// 定义组件数据类型
interface ComponentSet {
  key: string;
  file_key?: string;
  node_id?: string;
  thumbnail_url?: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  containing_frame?: {
    name?: string;
    nodeId?: string;
    pageId?: string;
    pageName?: string;
    backgroundColor?: string;
    containingStateGroup?: {
      name: string;
      nodeId: string;
    };
    containingComponentSet?: {
      name: string;
      nodeId: string;
    };
  };
  user?: any;
}

interface FilteredComponentSet {
  key: string;
  name: string;
  description: string;
  containingComponentSet?: {
    name: string;
    nodeId: string;
  };
}

// 组件分类接口
interface ComponentCategory {
  name: string;
  components: FilteredComponentSet[];
}

interface ComponentData {
  error: boolean;
  status: number;
  meta: {
    components: ComponentSet[];
  };
  i18n: any;
}

/**
 * 过滤组件数据，保留key、name、description和containingComponentSet字段
 * @param data 原始组件数据
 * @returns 过滤后的组件数据
 */
export function filterComponentSets(
  data: ComponentData
): FilteredComponentSet[] {
  return data.meta.components.map((component) => ({
    key: component.key,
    name: component.name,
    description: component.description,
    containingComponentSet: component.containing_frame?.containingComponentSet,
  }));
}

/**
 * 根据containingComponentSet对组件进行分类
 * @param components 过滤后的组件数据
 * @returns 分类后的组件数据
 */
export function categorizeComponents(
  components: FilteredComponentSet[]
): ComponentCategory[] {
  const categories: { [key: string]: FilteredComponentSet[] } = {};

  components.forEach((component) => {
    // 根据containingComponentSet进行分类
    let categoryName = "未分类组件";
    
    if (component.containingComponentSet?.name) {
      categoryName = component.containingComponentSet.name;
    } else {
      // 如果没有containingComponentSet，使用原有的名称分类逻辑作为备选
      if (
        component.name.includes("导航") ||
        component.name.includes("步骤") ||
        component.name.includes("Menu")
      ) {
        categoryName = "导航组件";
      } else if (
        component.name.includes("反馈") ||
        component.name.includes("缺省") ||
        component.name.includes("Result")
      ) {
        categoryName = "反馈组件";
      } else if (
        component.name.includes("Table") ||
        component.name.includes("表格")
      ) {
        categoryName = "数据展示";
      } else if (
        component.name.includes("Input") ||
        component.name.includes("Tag") ||
        component.name.includes("Select")
      ) {
        categoryName = "数据录入";
      } else if (
        component.name.includes("Button") ||
        component.name.includes("按钮")
      ) {
        categoryName = "通用组件";
      } else if (
        component.name.includes("时间") ||
        component.name.includes("Timeline") ||
        component.name.includes("Badge") ||
        component.name.includes("Watermark")
      ) {
        categoryName = "数据展示";
      }
    }

    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }
    categories[categoryName].push(component);
  });

  return Object.entries(categories)
    .map(([name, components]) => ({
      name,
      components: components.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 将过滤后的组件数据转换为Markdown格式
 * @param components 过滤后的组件数据
 * @returns Markdown格式的字符串
 */
export function convertToMarkdown(components: FilteredComponentSet[]): string {
  // 对组件进行分类
  const categories = categorizeComponents(components);

  // 添加文档前置元数据
  let markdown = "---\n";
  markdown += "description: Figma组件库文档\n";
  markdown += "globs: \n";
  markdown += "alwaysApply: true\n";
  markdown += "---\n\n";

  // 添加文档标题和说明
  markdown += "# Figma 组件库文档\n\n";
  markdown +=
    "本文档包含了从 Figma 设计系统中提取的组件信息，包括组件的基本属性和描述。\n\n";
  markdown += `> 共包含 ${components.length} 个组件，分为 ${categories.length} 个类别\n\n`;

  // 添加组件概览表格
  markdown += "## 组件概览\n\n";
  markdown += "|类别|组件数量|组件列表|\n";
  markdown += "|---|---|---|\n";
  categories.forEach((category) => {
    const componentNames = category.components.map((c) => c.name).join("、");
    markdown += `|${category.name}|${category.components.length}|${componentNames}|\n`;
  });
  markdown += "\n";

  // 添加目录
  markdown += "## 目录\n\n";
  categories.forEach((category, categoryIndex) => {
    markdown += `### ${category.name}\n\n`;
    category.components.forEach((component, index) => {
      const anchorLink = component.name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "-");
      markdown += `${categoryIndex + 1}.${index + 1} [${
        component.name
      }](#${anchorLink})\n`;
    });
    markdown += "\n";
  });

  // 生成分类组件详情
  categories.forEach((category, categoryIndex) => {
    markdown += `## ${category.name}\n\n`;

    category.components.forEach((component, index) => {
      markdown += `### ${component.name}\n\n`;

      // 添加组件描述
      if (component.description && component.description.trim()) {
        markdown += `${component.description}\n\n`;
      } else {
        markdown += "暂无组件描述。\n\n";
      }

      // 添加组件属性表格（简化版）
      markdown += "#### 组件属性\n\n";
      markdown += "|属性|说明|默认值|\n";
      markdown += "|---|---|---|\n";
      markdown += `|key|组件唯一标识|\`${component.key}\`|\n`;
      markdown += `|name|组件名称|${component.name}|\n`;
      markdown += `|description|组件描述|${
        component.description || "暂无描述"
      }|\n`;
      markdown += "\n";

      // 添加分隔线（除了最后一个组件）
      if (
        !(
          categoryIndex === categories.length - 1 &&
          index === category.components.length - 1
        )
      ) {
        markdown += "---\n\n";
      }
    });
  });

  return markdown;
}

/**
 * 保存Markdown内容到文件
 * @param content Markdown内容
 * @param filePath 文件路径
 */
export async function saveMarkdownFile(
  content: string,
  filePath: string
): Promise<void> {
  // 输入验证
  if (!content || typeof content !== "string") {
    throw new Error("内容不能为空且必须是字符串类型");
  }

  if (!filePath || typeof filePath !== "string") {
    throw new Error("文件路径不能为空且必须是字符串类型");
  }

  // 确保路径基于项目根目录
  let resolvedPath: string;
  if (path.isAbsolute(filePath)) {
    resolvedPath = filePath;
  } else {
    // 获取项目根目录（假设package.json所在目录为根目录）
    const projectRoot = process.cwd();
    resolvedPath = path.resolve(projectRoot, filePath);
  }

  // 路径安全性检查
  const normalizedPath = path.normalize(resolvedPath);
  if (normalizedPath.includes("..")) {
    throw new Error("文件路径不安全，包含相对路径");
  }

  try {
    const dir = path.dirname(normalizedPath);

    // 确保目录存在
    await fs.promises.mkdir(dir, { recursive: true });

    // 异步写入文件
    await fs.promises.writeFile(normalizedPath, content, "utf8");

    logger.log(`Markdown文件已保存到: ${normalizedPath}`);
  } catch (error) {
    const errorMessage = `保存文件失败 [${normalizedPath}]: ${
      error instanceof Error ? error.message : String(error)
    }`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * 主要工具函数：过滤组件数据并生成Markdown文件
 * @param data 原始组件数据
 * @param outputPath 输出文件路径（可选，默认为当前目录下的components.md）
 */
export function processComponentsToMarkdown(
  data: ComponentData,
  outputPath = "./components.md"
): void {
  try {
    // 1. 过滤数据
    const filteredComponents = filterComponentSets(data);

    // 2. 转换为Markdown
    const markdownContent = convertToMarkdown(filteredComponents);

    // 3. 保存文件
    saveMarkdownFile(markdownContent, outputPath);

    logger.log(`成功处理 ${filteredComponents.length} 个组件`);
  } catch (error) {
    console.error("处理组件数据时出错:", error);
    throw error;
  }
}

// const json = {
//   error: false,
//   status: 200,
//   meta: {
//     component_sets: [
//       {
//         key: "55892f1822e827762b784e367bb4d2e200dc8d6f",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "3495:13284",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/FKe/Cdh/2WSvYLD7COhHinDi/3495_13284.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=da0f9f46cb6bf0876d358ca039ab00ebb697f34b544a081899099c87e2a1ac1b",
//         name: "反馈类/缺省页",
//         description: "",
//         created_at: "2024-08-06T09:47:19.989Z",
//         updated_at: "2025-07-14T08:08:06.608Z",
//         containing_frame: {
//           name: "Result 结果页",
//           nodeId: "3495:13282",
//           pageId: "29035:71167",
//           pageName: "      ↪ 结果页 Result",
//           backgroundColor: "#FFFFFF",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "7cb0d7ae5f672d8f71bdb9bc5622f14fcadba7c2",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "3450:4243",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/pB2/C96/RjxM2Dzx2tgW8clG/3450_4243.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=c41e18d0f5321c9d3a78ba3b79be434085d42d1043b567eacbb609e4af141e42",
//         name: "导航类/步骤-无步骤步骤条",
//         description: "",
//         created_at: "2024-08-06T09:47:19.974Z",
//         updated_at: "2025-07-14T08:08:06.628Z",
//         containing_frame: {
//           name: "Timeline 时间轴",
//           nodeId: "3450:4198",
//           pageId: "29298:14000",
//           pageName: "      ↪ 时间轴 Timeline",
//           backgroundColor: "#FFFFFF",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "87f5b475d4da62c70d2d8002b359a1a5e98bad86",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "13749:18632",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/tAP/cZp/qgYCQntnCIaooMf5/13749_18632.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=7030cdbe027ae5bd2a5d4557ac3042f3e53a2039d1e901636099f19da6b5468f",
//         name: "时间轴",
//         description: "",
//         created_at: "2024-05-28T02:58:41.417Z",
//         updated_at: "2025-07-14T08:08:06.645Z",
//         containing_frame: {
//           pageId: "29298:14000",
//           pageName: "      ↪ 时间轴 Timeline",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "d2b969b2f8af45efd9a628181b148213ff946b98",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "31:21440",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/s2J/Kjy/wbSxcknILXLHs9gA/31_21440.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=d08f0e333e8239eff9fbd89edc212c57ba21fd80ce4de7429f420bd790ed06bf",
//         name: "Watermark",
//         description: "",
//         created_at: "2024-05-28T02:58:41.403Z",
//         updated_at: "2025-07-14T08:08:06.654Z",
//         containing_frame: {
//           pageId: "29796:50667",
//           pageName: "      ↪ 水印 Watermark",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "eb509880e8a8eb2196534f00157b57fbae30a61b",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "27221:94898",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/tpQ/4kv/pRCQcUkM7f1SeXLE/27221_94898.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=8282ac4740135b22a3d689c6e955370140d0e3877afde48b89db7fd93ccc6b54",
//         name: "Badge",
//         description: "",
//         created_at: "2024-05-28T02:58:41.425Z",
//         updated_at: "2025-07-14T08:08:06.661Z",
//         containing_frame: {
//           pageId: "29035:71168",
//           pageName: "      ↪ 徽标数 Badge",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "f411a57c1c42380bbcf95bbfcae3984c461211e0",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "30064:28461",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/H2y/8rb/3JN1V9uJCWJVan0n/30064_28461.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=c9b07dc5315906b7745069dd9065836afca77c51ad189167c4039c49e7cdd71d",
//         name: "InputTag",
//         description: "",
//         created_at: "2024-05-28T02:58:54.654Z",
//         updated_at: "2025-07-14T08:08:06.675Z",
//         containing_frame: {
//           pageId: "29796:50668",
//           pageName: "      ↪ 标签输入框 TagInput",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "05a5df9ec4c3fd203be4fc1ba83a1a0ebe9b830b",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "9836:8420",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/pCn/IXZ/u3hPB0kthwKxiFt2/9836_8420.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=d9224c11f89c8c95a65241dc9c475a491f7ca095c1b501f3072b464b0d173cb8",
//         name: "Table-header",
//         description: "",
//         created_at: "2024-05-28T02:59:22.308Z",
//         updated_at: "2025-07-14T08:08:21.216Z",
//         containing_frame: {
//           pageId: "29035:71164",
//           pageName: "      ↪ 表格 Table",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "1606b0abcdf360e0340abf85e3859568bd840b03",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "13634:17009",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/4xK/ZGO/bBWw74HQTesOnOma/13634_17009.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=bf87a96b28245577b7ad9aff038a13502e504fed398cf57a5347ebf3c921c3ec",
//         name: "Table-多选框",
//         description: "",
//         created_at: "2024-05-28T02:58:41.521Z",
//         updated_at: "2025-07-14T08:08:21.221Z",
//         containing_frame: {
//           pageId: "29035:71164",
//           pageName: "      ↪ 表格 Table",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "16ca02a2c14902e010af54cda827424be812c9c5",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "3369:4763",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/2pK/8rK/4bmJ4kvc6hSHwJ0E/3369_4763.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=4e4c7f8e5be160333ac958eb625b5fec6e15caa83310c898ff09675b3a25caac",
//         name: "Tag-状态",
//         description: "",
//         created_at: "2024-08-06T09:47:34.219Z",
//         updated_at: "2025-07-14T08:08:21.227Z",
//         containing_frame: {
//           pageId: "29035:67131",
//           pageName: "      ↪ 状态 Status",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//       {
//         key: "23a4e87b50779be33e92ae60a80663d33dd067e7",
//         file_key: "SF055PQGyCMyH5msItSjlh",
//         node_id: "13749:18816",
//         thumbnail_url:
//           "https://s3-alpha.figma.com/checkpoints/gjr/RnK/fvjsQObWVfkQVdsW/13749_18816.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAQ4GOSFWCS2LHWM5N%2F20250807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250807T000000Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=e3512573eb78985a1317412103c4a8f2706e85c9f6e914d37737e4505ebb9fca",
//         name: "导航类/步骤-导航步骤条",
//         description: "",
//         created_at: "2024-05-28T02:58:41.774Z",
//         updated_at: "2025-07-14T08:08:21.248Z",
//         containing_frame: {
//           pageId: "29035:71160",
//           pageName: "      ↪ 步骤条 Steps",
//         },
//         user: {
//           id: "1294181103707987766",
//           handle: "张耀雄-体验设计",
//           img_url:
//             "https://s3-alpha.figma.com/profile/9a2a0120-4d53-4cc9-9edf-eb33f4d2f9a9",
//         },
//       },
//     ],
//   },
//   i18n: null,
// };

// // 使用示例函数
// export function runExample(): void {
//   // 示例：处理组件数据并生成Markdown文件
//   const outputPath = path.resolve("./generated-ui/components.md");
//   processComponentsToMarkdown(json, outputPath);
// }
