/**
 * PanSou搜索API封装
 * 对接自部署的 https://github.com/fish2018/pansou
 */

export interface PanSouResult {
  url: string;
  password: string;
  note: string;
  datetime: string;
  source: string;
  images: string[];
}

export interface SearchResponse {
  total: number;
  results: PanSouResult[];
}

export class PanSouAPI {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = authToken;
  }

  async search(keyword: string, options?: {
    cloudTypes?: string[];
    refresh?: boolean;
  }): Promise<SearchResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          kw: keyword,
          cloud_types: options?.cloudTypes || ['quark'],
          res: 'merge',
          refresh: options?.refresh || false,
        }),
        signal: AbortSignal.timeout(15000), // 15秒超时
      });

      if (!response.ok) {
        throw new Error(`PanSou API error: ${response.status}`);
      }

      const data = await response.json();

      // 提取夸克网盘结果
      const quarkResults: PanSouResult[] = data?.merged_by_type?.quark || [];

      // 按datetime倒序排序（更新越近越靠前）
      quarkResults.sort((a, b) => {
        const dateA = new Date(a.datetime || 0).getTime();
        const dateB = new Date(b.datetime || 0).getTime();
        return dateB - dateA;
      });

      return {
        total: quarkResults.length,
        results: quarkResults,
      };
    } catch (error) {
      console.error('PanSou search error:', error);
      return { total: 0, results: [] };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      return data?.status === 'ok';
    } catch {
      return false;
    }
  }
}

export function createPanSouClient(): PanSouAPI {
  const baseUrl = process.env.PANSOU_API_URL || 'http://localhost:8888';
  const authToken = process.env.PANSOU_AUTH_ENABLED === 'true'
    ? process.env.PANSOU_AUTH_TOKEN
    : undefined;
  return new PanSouAPI(baseUrl, authToken);
}
