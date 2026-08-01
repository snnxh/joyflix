/**
 * 通用的豆瓣数据获取函数（带CDN镜像回退）
 * @param url 请求的URL
 * @returns Promise<T> 返回指定类型的数据
 */
export async function fetchDoubanData<T>(url: string): Promise<T> {
  // 生成回退URL列表：原始URL + cmliussss CDN镜像
  const fallbackUrls: string[] = [url];
  if (url.includes('movie.douban.com')) {
    fallbackUrls.push(url.replace('movie.douban.com', 'movie.douban.cmliussss.net'));
    fallbackUrls.push(url.replace('movie.douban.com', 'movie.douban.cmliussss.com'));
  } else if (url.includes('m.douban.com')) {
    fallbackUrls.push(url.replace('m.douban.com', 'm.douban.cmliussss.net'));
    fallbackUrls.push(url.replace('m.douban.com', 'm.douban.cmliussss.com'));
  }

  let lastError: Error | null = null;

  for (const targetUrl of fallbackUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fetchOptions = {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Referer: 'https://movie.douban.com/',
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://movie.douban.com',
        },
      };

      try {
        const response = await fetch(targetUrl, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`Douban fetch failed from ${targetUrl}:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error('All Douban data sources failed');
}