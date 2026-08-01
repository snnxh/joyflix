import { NextResponse } from 'next/server';

export const runtime = 'edge';

const REQUEST_TIMEOUT_MS = 8000;
const DOUBAN_IMAGE_HOST_PATTERN = /^img\d+\.doubanio\.com$/i;
const DOUBAN_IMAGE_HOSTS = ['img3.doubanio.com', 'img9.doubanio.com'];
const BANGUMI_IMAGE_HOST_PATTERN = /(^|\.)bgm\.tv$/i;

function getImageCandidates(imageUrl: string): string[] {
  const parsedUrl = new URL(imageUrl);

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Unsupported image URL protocol');
  }

  if (!DOUBAN_IMAGE_HOST_PATTERN.test(parsedUrl.hostname)) {
    if (BANGUMI_IMAGE_HOST_PATTERN.test(parsedUrl.hostname)) {
      const httpsCandidate = new URL(parsedUrl);
      httpsCandidate.protocol = 'https:';

      const httpCandidate = new URL(parsedUrl);
      httpCandidate.protocol = 'http:';

      return Array.from(
        new Set([httpsCandidate.toString(), httpCandidate.toString()])
      );
    }

    return [parsedUrl.toString()];
  }

  return DOUBAN_IMAGE_HOSTS.map((hostname) => {
    const candidate = new URL(parsedUrl);
    candidate.hostname = hostname;
    return candidate.toString();
  });
}

async function fetchImage(imageUrl: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const hostname = new URL(imageUrl).hostname;
  const isBangumiImage = BANGUMI_IMAGE_HOST_PATTERN.test(hostname);

  try {
    return await fetch(imageUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: isBangumiImage
          ? 'https://bgm.tv/'
          : 'https://movie.douban.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// OrionTV 兼容接口
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  let candidates: string[];
  try {
    candidates = getImageCandidates(imageUrl);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }

  let lastError = 'Image upstream request failed';
  let timedOut = false;

  for (const candidate of candidates) {
    try {
      const imageResponse = await fetchImage(candidate);

      if (!imageResponse.ok) {
        lastError = `Image upstream returned ${imageResponse.status}`;
        continue;
      }

      if (!imageResponse.body) {
        lastError = 'Image upstream response has no body';
        continue;
      }

      const headers = new Headers();
      headers.set(
        'Content-Type',
        imageResponse.headers.get('content-type') || 'application/octet-stream'
      );
      headers.set(
        'Cache-Control',
        'public, max-age=15720000, s-maxage=15720000'
      );
      headers.set('CDN-Cache-Control', 'public, s-maxage=15720000');
      headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=15720000');
      headers.set('Netlify-Vary', 'query');
      headers.set('X-Image-Proxy-Upstream', new URL(candidate).hostname);

      return new Response(imageResponse.body, {
        status: 200,
        headers,
      });
    } catch (error) {
      const requestError = error as Error;
      if (requestError.name === 'AbortError') {
        timedOut = true;
        lastError = `Image upstream timed out after ${REQUEST_TIMEOUT_MS}ms`;
      } else {
        lastError = requestError.message || lastError;
      }
    }
  }

  return NextResponse.json(
    { error: lastError },
    { status: timedOut ? 504 : 502 }
  );
}
