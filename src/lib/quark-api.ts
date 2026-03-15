/**
 * 夸克网盘API封装
 * 参考: https://github.com/Cp0204/quark-auto-save
 * 参考：https://github.com/Lampon/PanCheck
 */

import { extractPwdId, sleep } from '@/lib/utils';

const BASE_URL = 'https://drive-h.quark.cn';
const PAN_URL = 'https://pan.quark.cn';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface QuarkAccountInfo {
  nickname: string;
  avatar: string;
  kps: string;
  sign: string;
  vcode: string;
}

export interface QuarkFileItem {
  fid: string;
  file_name: string;
  pdir_fid: string;
  dir: boolean;
  file_type: number;
  size: number;
  format_type: string;
  share_fid_token: string;
  obj_category: string;
  updated_at: number;
  created_at: number;
}

export interface ShareInfo {
  share_id: string;
  share_url: string;
  pwd_id: string;
  passcode: string;
  title: string;
}

export class QuarkAPI {
  private cookie: string;

  constructor(cookie: string) {
    this.cookie = cookie.trim();
  }

  private static readonly REQUEST_TIMEOUT = 15000; // 15秒超时
  private static readonly MAX_RETRIES = 2; // 最多重试2次（共3次请求）
  private static readonly RETRY_DELAY = 1000; // 重试间隔1秒

  private async request(method: string, url: string, options: {
    params?: Record<string, any>;
    body?: any;
  } = {}): Promise<any> {
    const headers: Record<string, string> = {
      'cookie': this.cookie,
      'content-type': 'application/json',
      'accept': 'application/json, text/plain, */*',
      'user-agent': USER_AGENT,
      'origin': PAN_URL,
      'referer': `${PAN_URL}/`,
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-site': 'same-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'accept-language': 'zh-CN,zh;q=0.9',
    };

    let fullUrl = url;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        searchParams.append(key, String(value));
      });
      fullUrl += '?' + searchParams.toString();
    }

    let lastError: any = null;
    for (let attempt = 0; attempt <= QuarkAPI.MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        console.warn(`🔄 [夸克API] 第${attempt}次重试 (共${QuarkAPI.MAX_RETRIES}次): ${method} ${url}`);
        await sleep(QuarkAPI.RETRY_DELAY * attempt);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), QuarkAPI.REQUEST_TIMEOUT);

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };
        if (options.body) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);
        const data = await response.json();

        // 非成功响应时记录详细日志
        if (data?.code !== 0 && data?.status !== 200) {
          console.warn(`⚠️ [夸克API] 响应异常: ${method} ${url}`, JSON.stringify({
            status: data?.status,
            code: data?.code,
            message: data?.message,
          }));
        }

        return data;
      } catch (error: any) {
        lastError = error;
        const isTimeout = error?.name === 'AbortError'
          || error?.cause?.code === 'ETIMEDOUT'
          || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
          || error?.message?.includes('fetch failed');

        if (!isTimeout) {
          // 非超时错误不重试
          console.error(`❌ [夸克API] 请求失败: ${method} ${url}`, error);
          return { status: 500, code: 1, message: 'request error' };
        }

        console.warn(`⏱️ [夸克API] 连接超时 (第${attempt + 1}次): ${method} ${url}`);
      }
    }

    console.error(`💀 [夸克API] 重试全部耗尽: ${method} ${url}`, lastError);
    return { status: 500, code: 1, message: 'request timeout after retries' };
  }

  /** 获取账号信息 */
  async getAccountInfo(): Promise<QuarkAccountInfo | null> {
    const response = await this.request('GET', 'https://pan.quark.cn/account/info', {
      params: { fr: 'pc', platform: 'pc' },
    });
    return response?.data || null;
  }

  /** 验证账号是否可用 */
  async verifyAccount(): Promise<{ valid: boolean; nickname: string; message?: string }> {
    const info = await this.getAccountInfo();
    if (!info) {
      return { valid: false, nickname: '', message: 'Cookie无效或已过期' };
    }
    return { valid: true, nickname: info.nickname };
  }

  /**
   * 获取分享token (同时可验证资源是否失效)
   * 用于有效性检测
   */
  async getStoken(pwdId: string, passcode: string = ''): Promise<{
    ok: boolean;
    stoken?: string;
    message?: string;
  }> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/share/sharepage/token`, {
      params: { pr: 'ucpro', fr: 'pc' },
      body: { pwd_id: pwdId, passcode },
    });

    if (response?.status === 200 && response?.data?.stoken) {
      return { ok: true, stoken: response.data.stoken };
    }
    return { ok: false, message: response?.message || '资源已失效' };
  }

  /** 获取分享文件详情列表 */
  async getShareDetail(pwdId: string, stoken: string, pdirFid: string = '0'): Promise<QuarkFileItem[]> {
    const allFiles: QuarkFileItem[] = [];
    let page = 1;

    while (true) {
      const response = await this.request('GET',
        `${BASE_URL}/1/clouddrive/share/sharepage/detail`, {
        params: {
          pr: 'ucpro',
          fr: 'pc',
          pwd_id: pwdId,
          stoken,
          pdir_fid: pdirFid,
          force: '0',
          _page: page,
          _size: '50',
          _fetch_banner: '0',
          _fetch_share: '0',
          _fetch_total: '1',
          _sort: 'file_type:asc,updated_at:desc',
        },
      });

      if (response?.code !== 0) break;
      if (!response.data?.list?.length) break;

      allFiles.push(...response.data.list);
      if (allFiles.length >= (response.metadata?._total || 0)) break;
      page++;
    }

    return allFiles;
  }

  /** 创建目录 */
  async mkdir(dirPath: string): Promise<{ fid: string } | null> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/file`, {
      params: { pr: 'ucpro', fr: 'pc', uc_param_str: '' },
      body: {
        pdir_fid: '0',
        file_name: '',
        dir_path: dirPath,
        dir_init_lock: false,
      },
    });
    if (response?.code === 0) {
      return { fid: response.data.fid };
    }
    return null;
  }

  /** 获取目录fid */
  async getFids(filePaths: string[]): Promise<Array<{ file_path: string; fid: string }>> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/file/info/path_list`, {
      params: { pr: 'ucpro', fr: 'pc' },
      body: { file_path: filePaths, namespace: '0' },
    });
    if (response?.code === 0) {
      return response.data || [];
    }
    return [];
  }

  /** 确保目录存在并返回fid */
  async ensureDir(dirPath: string): Promise<string | null> {
    const fids = await this.getFids([dirPath]);
    if (fids.length > 0) {
      return fids[0].fid;
    }
    // 目录不存在，创建
    const result = await this.mkdir(dirPath);
    return result?.fid || null;
  }

  /** 转存文件 */
  async saveFile(
    fidList: string[],
    fidTokenList: string[],
    toPdirFid: string,
    pwdId: string,
    stoken: string
  ): Promise<{ ok: boolean; taskId?: string; message?: string }> {
    // 转存接口使用 drive.quark.cn（不带 -pc），与 Pearsoon/quark、henggedaren/quark-save 一致
    const response = await this.request('POST',
      `https://drive.quark.cn/1/clouddrive/share/sharepage/save`, {
      params: {
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        __dt: Math.floor(Math.random() * 900) + 100,
        __t: Date.now(),
      },
      body: {
        fid_list: fidList,
        fid_token_list: fidTokenList,
        to_pdir_fid: toPdirFid,
        pwd_id: pwdId,
        stoken,
        pdir_fid: '0',
        scene: 'link',
      },
    });

    if (response?.code === 0 && response.data?.task_id) {
      console.log('✅ [夸克API] 转存成功, task_id:', response.data.task_id);
      return { ok: true, taskId: response.data.task_id };
    }
    console.error('❌ [夸克API] 转存失败:', JSON.stringify(response));
    return { ok: false, message: response?.message || '转存失败' };
  }

  /** 查询任务状态 */
  async queryTask(taskId: string): Promise<{
    ok: boolean;
    done: boolean;
    savedFids?: string[];
    message?: string;
  }> {
    let retryIndex = 0;
    const maxRetries = 30;

    while (retryIndex < maxRetries) {
      const response = await this.request('GET',
        `${BASE_URL}/1/clouddrive/task`, {
        params: {
          pr: 'ucpro',
          fr: 'pc',
          uc_param_str: '',
          task_id: taskId,
          retry_index: retryIndex,
          __dt: Math.floor(Math.random() * 5 * 60 * 1000),
          __t: Date.now(),
        },
      });

      if (response?.status !== 200) {
        return { ok: false, done: false, message: response?.message };
      }

      if (response.data?.status === 2) {
        // 任务完成
        const savedFids = response.data?.save_as?.save_as_top_fids || [];
        return { ok: true, done: true, savedFids };
      }

      retryIndex++;
      await sleep(500);
    }

    return { ok: false, done: false, message: '任务超时' };
  }

  /** 列出目录文件 */
  async listDir(pdirFid: string): Promise<QuarkFileItem[]> {
    const allFiles: QuarkFileItem[] = [];
    let page = 1;

    while (true) {
      const response = await this.request('GET',
        `${BASE_URL}/1/clouddrive/file/sort`, {
        params: {
          pr: 'ucpro',
          fr: 'pc',
          uc_param_str: '',
          pdir_fid: pdirFid,
          _page: page,
          _size: '50',
          _fetch_total: '1',
          _fetch_sub_dirs: '0',
          _sort: 'file_type:asc,updated_at:desc',
        },
      });

      if (response?.code !== 0) break;
      if (!response.data?.list?.length) break;

      allFiles.push(...response.data.list);
      if (allFiles.length >= (response.metadata?._total || 0)) break;
      page++;
    }

    return allFiles;
  }

  /** 删除文件 */
  async deleteFiles(fidList: string[]): Promise<{ ok: boolean; taskId?: string }> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/file/delete`, {
      params: { pr: 'ucpro', fr: 'pc', uc_param_str: '' },
      body: {
        action_type: 2,
        filelist: fidList,
        exclude_fids: [],
      },
    });

    if (response?.code === 0) {
      return { ok: true, taskId: response.data?.task_id };
    }
    return { ok: false };
  }

  /** 获取回收站列表 */
  async recycleList(): Promise<Array<{ record_id: string; fid: string }>> {
    const response = await this.request('GET',
      `${BASE_URL}/1/clouddrive/file/recycle/list`, {
      params: { _page: 1, _size: 30, pr: 'ucpro', fr: 'pc', uc_param_str: '' },
    });
    return response?.data?.list || [];
  }

  /** 清空回收站 */
  async recycleRemove(recordList: string[]): Promise<boolean> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/file/recycle/remove`, {
      params: { uc_param_str: '', fr: 'pc', pr: 'ucpro' },
      body: {
        select_mode: 2,
        record_list: recordList,
      },
    });
    return response?.code === 0;
  }

  /**
   * 全盘搜索文件
   * 可以在自己网盘内按关键词搜索文件，用于清理时快速定位文件
   */
  async searchFiles(keyword: string, page: number = 1, size: number = 50): Promise<QuarkFileItem[]> {
    const response = await this.request('GET',
      `${BASE_URL}/1/clouddrive/file/search`, {
      params: {
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        q: keyword,
        _page: page,
        _size: size,
        _fetch_total: '1',
        _sort: 'file_type:desc,updated_at:desc',
        _is_hl: '1',
      },
    });

    if (response?.code === 0) {
      return response.data?.list || [];
    }
    return [];
  }

  /**
   * 获取我的分享列表
   * 用于清理过期分享、管理已创建的分享
   */
  async getMyShares(page: number = 1, size: number = 50): Promise<{
    list: Array<{
      share_id: string;
      pwd_id: string;
      title: string;
      share_url: string;
      created_at: number;
      expired_type: number;
      status: number;
      file_count: number;
    }>;
    total: number;
  }> {
    const response = await this.request('GET',
      `${BASE_URL}/1/clouddrive/share/mypage/detail`, {
      params: {
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        _page: page,
        _size: size,
        _order_field: 'created_at',
        _order_type: 'desc',
        _fetch_total: '1',
        _fetch_notify_follow: '1',
      },
    });

    if (response?.code === 0) {
      return {
        list: response.data?.list || [],
        total: response.metadata?._total || 0,
      };
    }
    return { list: [], total: 0 };
  }

  /**
   * 删除分享链接
   * 用于清理时同步删除已创建的分享
   */
  async deleteShare(shareIds: string[]): Promise<boolean> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/share/delete`, {
      params: { pr: 'ucpro', fr: 'pc', uc_param_str: '' },
      body: {
        share_ids: shareIds,
      },
    });
    return response?.code === 0;
  }

  /**
   * 创建公开分享链接（三步流程）
   * 1. POST /share → 获取 task_id
   * 2. 轮询 task → 获取 share_id
   * 3. POST /share/password → 获取 share_url
   *
   * expired_type: 1=永久, 2=1天, 3=7天, 4=30天
   * url_type: 1=公开链接, 2=需要提取码
   */
  async createShare(
    fidList: string[],
    title: string = '分享文件',
    expiredType: number = 1
  ): Promise<ShareInfo | null> {
    // 步骤1: 创建分享任务，获取 task_id
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/share`, {
      params: {
        pr: 'ucpro',
        fr: 'pc',
        uc_param_str: '',
        __dt: Math.floor(Math.random() * 900) + 100,
        __t: Date.now(),
      },
      body: {
        fid_list: fidList,
        title,
        url_type: 1,
        expired_type: expiredType,
      },
    });

    if (response?.code !== 0 || !response.data?.task_id) {
      console.error('❌ [夸克API] 创建分享第1步失败(创建任务):', response?.message);
      return null;
    }

    const taskId = response.data.task_id;

    // 步骤2: 轮询任务获取 share_id
    const shareId = await this.queryShareTask(taskId);
    if (!shareId) {
      console.error('❌ [夸克API] 创建分享第2步失败(获取share_id): 未返回share_id');
      return null;
    }

    // 步骤3: 通过 share_id 获取分享链接
    const shareResult = await this.getSharePassword(shareId);
    if (!shareResult) {
      console.error('❌ [夸克API] 创建分享第3步失败(获取分享链接): 未返回share_url');
      return null;
    }

    return {
      share_id: shareId,
      share_url: shareResult.share_url,
      pwd_id: shareResult.pwd_id || '',
      passcode: shareResult.passcode || '',
      title,
    };
  }

  /**
   * 轮询分享任务，获取 share_id
   * 分享任务的返回结构与转存任务不同，share_id 在 data 顶层
   */
  private async queryShareTask(taskId: string): Promise<string | null> {
    for (let retryIndex = 0; retryIndex < 10; retryIndex++) {
      const response = await this.request('GET',
        `${BASE_URL}/1/clouddrive/task`, {
        params: {
          pr: 'ucpro',
          fr: 'pc',
          uc_param_str: '',
          task_id: taskId,
          retry_index: retryIndex,
          __dt: Math.floor(Math.random() * 900) + 100,
          __t: Date.now(),
        },
      });

      if (response?.status !== 200) {
        return null;
      }

      // 分享任务完成后，share_id 在 data.share_id
      if (response.data?.share_id) {
        return response.data.share_id;
      }

      // status === 2 表示任务完成
      if (response.data?.status === 2 && response.data?.share_id) {
        return response.data.share_id;
      }

      await sleep(1000);
    }
    return null;
  }

  /**
   * 通过 share_id 获取分享链接和提取码
   */
  private async getSharePassword(shareId: string): Promise<{
    share_url: string;
    pwd_id?: string;
    passcode?: string;
  } | null> {
    const response = await this.request('POST',
      `${BASE_URL}/1/clouddrive/share/password`, {
      params: { pr: 'ucpro', fr: 'pc', uc_param_str: '' },
      body: { share_id: shareId },
    });

    if (response?.code === 0 && response.data?.share_url) {
      return {
        share_url: response.data.share_url,
        pwd_id: response.data.pwd_id,
        passcode: response.data.passcode,
      };
    }
    return null;
  }

  /**
   * 完整转存+分享流程
   * 1. 获取stoken
   * 2. 获取分享文件列表
   * 3. 转存到我的网盘
   * 4. 等待任务完成
   * 5. 创建公开分享
   */
  async saveAndShare(
    shareUrl: string,
    saveDirPath: string = '/来自搜索站'
  ): Promise<{
    ok: boolean;
    shareInfo?: ShareInfo;
    savedFids?: string[];
    message?: string;
  }> {
    // 1. 解析链接
    const extracted = extractPwdId(shareUrl);
    if (!extracted) {
      return { ok: false, message: '无效的分享链接' };
    }
    const { pwdId, passcode } = extracted;
    console.log('📎 [转存分享] 步骤1/7 解析链接: pwdId=', pwdId);

    // 2. 获取stoken
    const stokenResult = await this.getStoken(pwdId, passcode);
    if (!stokenResult.ok || !stokenResult.stoken) {
      console.error('❌ [转存分享] 步骤2/7 获取stoken失败:', stokenResult.message);
      return { ok: false, message: stokenResult.message || '资源已失效' };
    }
    console.log('🔑 [转存分享] 步骤2/7 获取stoken成功');

    // 3. 获取分享文件列表
    const fileList = await this.getShareDetail(pwdId, stokenResult.stoken);
    if (fileList.length === 0) {
      console.error('❌ [转存分享] 步骤3/7 获取文件列表失败: 分享内容为空');
      return { ok: false, message: '分享内容为空' };
    }
    console.log('📂 [转存分享] 步骤3/7 获取文件列表:', fileList.length, '个文件');

    // 直接保存顶层文件列表（不进入子文件夹）
    const finalFileList = fileList;

    // 4. 确保保存目录存在
    const saveDirFid = await this.ensureDir(saveDirPath);
    if (!saveDirFid) {
      console.error('❌ [转存分享] 步骤4/7 创建保存目录失败:', saveDirPath);
      return { ok: false, message: '创建保存目录失败' };
    }
    console.log('📁 [转存分享] 步骤4/7 保存目录就绪: fid=', saveDirFid);

    // 5. 转存
    const fidList = finalFileList.map(f => f.fid);
    const fidTokenList = finalFileList.map(f => f.share_fid_token);

    const saveResult = await this.saveFile(
      fidList, fidTokenList, saveDirFid, pwdId, stokenResult.stoken
    );
    if (!saveResult.ok || !saveResult.taskId) {
      console.error('❌ [转存分享] 步骤5/7 转存文件失败:', saveResult.message);
      return { ok: false, message: saveResult.message || '转存失败' };
    }
    console.log('💾 [转存分享] 步骤5/7 转存任务已提交: task_id=', saveResult.taskId);

    // 6. 等待任务完成
    const taskResult = await this.queryTask(saveResult.taskId);
    if (!taskResult.ok || !taskResult.done || !taskResult.savedFids?.length) {
      console.error('❌ [转存分享] 步骤6/7 等待转存任务失败:', taskResult.message);
      return { ok: false, message: taskResult.message || '转存任务失败' };
    }
    console.log('✅ [转存分享] 步骤6/7 转存完成, 文件ID:', taskResult.savedFids);

    // 7. 创建公开分享（设为1天过期，双保险：即使清理失败也会自动过期）
    const shareTitle = fileList.length === 1 ? fileList[0].file_name : `分享${fileList.length}个文件`;
    const shareInfo = await this.createShare(taskResult.savedFids, shareTitle, 2);
    if (!shareInfo) {
      console.error('❌ [转存分享] 步骤7/7 创建分享链接失败');
      return { ok: false, message: '创建分享链接失败', savedFids: taskResult.savedFids };
    }
    console.log('🔗 [转存分享] 步骤7/7 分享链接已生成:', shareInfo.share_url);

    return {
      ok: true,
      shareInfo,
      savedFids: taskResult.savedFids,
    };
  }

  /**
   * 删除文件并清空回收站
   */
  async deleteAndClean(fidList: string[]): Promise<boolean> {
    if (fidList.length === 0) return true;

    const deleteResult = await this.deleteFiles(fidList);
    if (!deleteResult.ok) return false;

    // 等待删除完成
    if (deleteResult.taskId) {
      await this.queryTask(deleteResult.taskId);
    }

    // 清空回收站
    await sleep(500);
    const recycleItems = await this.recycleList();
    const recordIds = recycleItems
      .filter(item => fidList.includes(item.fid))
      .map(item => item.record_id);

    if (recordIds.length > 0) {
      await this.recycleRemove(recordIds);
    }

    return true;
  }
}
