/**
 * 灵感导出/导入服务
 * 支持将灵感数据导出为 JSON 文件，以及从 JSON 文件导入
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Inspiration } from '../types';
import { getAllInspirations, createInspiration, getInspirationById } from './database';

// 导出数据格式版本
export const EXPORT_VERSION = '1.0';

// 导出文件元数据
export interface ExportMetadata {
  version: string;
  appName: string;
  exportTime: string;
  inspirationCount: number;
  deviceInfo?: string;
}

// 完整导出数据
export interface ExportData {
  metadata: ExportMetadata;
  inspirations: Inspiration[];
}

// 导入结果
export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * 导出所有灵感为 JSON 文件
 * 通过系统分享菜单让用户选择保存方式
 */
export async function exportAllInspirations(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // 获取所有灵感
    const inspirations = await getAllInspirations();
    
    if (inspirations.length === 0) {
      return { success: false, error: '暂无灵感可导出' };
    }

    // 构建导出数据
    const exportData: ExportData = {
      metadata: {
        version: EXPORT_VERSION,
        appName: '灵感调酒师',
        exportTime: new Date().toISOString(),
        inspirationCount: inspirations.length,
      },
      inspirations,
    };

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `inspiration_export_${timestamp}.json`;

    // 写入缓存目录
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      return { success: false, error: '无法访问缓存目录' };
    }

    const filePath = `${cacheDir}${fileName}`;
    const jsonContent = JSON.stringify(exportData, null, 2);

    await FileSystem.writeAsStringAsync(filePath, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 检查分享功能是否可用
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      // 如果分享不可用，返回文件路径让用户手动处理
      return { success: true, filePath };
    }

    // 调用系统分享
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: '导出灵感数据',
      UTI: 'public.json',
    });

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: `导出失败: ${(error as Error).message}` };
  }
}

/**
 * 导出单个灵感
 */
export async function exportSingleInspiration(inspirationId: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const inspiration = await getInspirationById(inspirationId);
    
    if (!inspiration) {
      return { success: false, error: '灵感不存在' };
    }

    // 构建导出数据
    const exportData: ExportData = {
      metadata: {
        version: EXPORT_VERSION,
        appName: '灵感调酒师',
        exportTime: new Date().toISOString(),
        inspirationCount: 1,
      },
      inspirations: [inspiration],
    };

    // 生成文件名
    const safeName = inspiration.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `inspiration_${safeName}_${timestamp}.json`;

    // 写入缓存目录
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      return { success: false, error: '无法访问缓存目录' };
    }

    const filePath = `${cacheDir}${fileName}`;
    const jsonContent = JSON.stringify(exportData, null, 2);

    await FileSystem.writeAsStringAsync(filePath, jsonContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 调用系统分享
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: `导出灵感: ${inspiration.name}`,
        UTI: 'public.json',
      });
    }

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: `导出失败: ${(error as Error).message}` };
  }
}

/**
 * 选择并导入 JSON 文件
 */
export async function importFromFile(): Promise<ImportResult> {
  try {
    // 打开文件选择器
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, importedCount: 0, skippedCount: 0, errors: ['用户取消选择'] };
    }

    const file = result.assets[0];
    if (!file.uri) {
      return { success: false, importedCount: 0, skippedCount: 0, errors: ['无法获取文件路径'] };
    }

    // 读取文件内容
    const content = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 解析并验证数据
    const importResult = await parseAndImportData(content);
    return importResult;
  } catch (error) {
    return { success: false, importedCount: 0, skippedCount: 0, errors: [`导入失败: ${(error as Error).message}`] };
  }
}

/**
 * 从指定 URI 导入数据
 */
export async function importFromUri(uri: string): Promise<ImportResult> {
  try {
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return await parseAndImportData(content);
  } catch (error) {
    return { success: false, importedCount: 0, skippedCount: 0, errors: [`读取文件失败: ${(error as Error).message}`] };
  }
}

/**
 * 解析并导入数据
 */
async function parseAndImportData(content: string): Promise<ImportResult> {
  try {
    const data = JSON.parse(content) as ExportData;

    // 验证数据格式
    const validationErrors = validateExportData(data);
    if (validationErrors.length > 0) {
      return { success: false, importedCount: 0, skippedCount: 0, errors: validationErrors };
    }

    // 获取现有灵感 ID 列表
    const existingInspirations = await getAllInspirations();
    const existingIds = new Set(existingInspirations.map(i => i.id));

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // 逐条导入
    for (const inspiration of data.inspirations) {
      if (existingIds.has(inspiration.id)) {
        skippedCount++;
        continue;
      }

      try {
        await createInspiration(inspiration);
        importedCount++;
      } catch (err) {
        errors.push(`导入灵感 "${inspiration.name}" 失败: ${(err as Error).message}`);
      }
    }

    return {
      success: importedCount > 0,
      importedCount,
      skippedCount,
      errors,
    };
  } catch (error) {
    return { success: false, importedCount: 0, skippedCount: 0, errors: [`JSON 解析失败: ${(error as Error).message}`] };
  }
}

/**
 * 验证导出数据格式
 */
function validateExportData(data: unknown): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('数据格式无效');
    return errors;
  }

  const exportData = data as Record<string, unknown>;

  // 检查 metadata
  if (!exportData.metadata || typeof exportData.metadata !== 'object') {
    errors.push('缺少元数据');
  } else {
    const metadata = exportData.metadata as Record<string, unknown>;
    if (!metadata.version) {
      errors.push('缺少版本号');
    }
    if (!metadata.appName) {
      errors.push('缺少应用名称');
    }
  }

  // 检查 inspirations
  if (!Array.isArray(exportData.inspirations)) {
    errors.push('灵感列表格式无效');
    return errors;
  }

  if (exportData.inspirations.length === 0) {
    errors.push('灵感列表为空');
  }

  // 检查每个灵感的必要字段
  for (let i = 0; i < exportData.inspirations.length; i++) {
    const inspiration = exportData.inspirations[i] as Record<string, unknown>;
    if (!inspiration.id) {
      errors.push(`灵感 #${i + 1} 缺少 ID`);
    }
    if (!inspiration.name) {
      errors.push(`灵感 #${i + 1} 缺少名称`);
    }
  }

  return errors;
}

/**
 * 获取导出历史记录（最近导出的文件信息）
 * 注：由于缓存目录文件可能被系统清理，此功能仅记录最近操作
 */
export interface ExportHistoryItem {
  fileName: string;
  exportTime: string;
  inspirationCount: number;
}

const EXPORT_HISTORY_KEY = 'export_history';

// 简单的导出历史存储（使用内存，应用重启后清空）
let exportHistory: ExportHistoryItem[] = [];

export function addExportHistory(item: ExportHistoryItem): void {
  exportHistory.unshift(item);
  // 只保留最近 10 条
  if (exportHistory.length > 10) {
    exportHistory = exportHistory.slice(0, 10);
  }
}

export function getExportHistory(): ExportHistoryItem[] {
  return exportHistory;
}

export function clearExportHistory(): void {
  exportHistory = [];
}