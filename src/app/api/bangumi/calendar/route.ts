/* eslint-disable no-console */

import { NextResponse } from 'next/server';

const BANGUMI_CALENDAR_URL = 'https://api.bgm.tv/calendar';
const REQUEST_TIMEOUT_MS = 8000;

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(BANGUMI_CALENDAR_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'JoyFlix/1.0 (+https://github.com/snnxh/joyflix)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`Bangumi calendar request failed: ${response.status}`);
      return NextResponse.json([], { status: 200 });
    }

    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      console.warn('Bangumi calendar response was not an array');
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.warn('Bangumi calendar is unavailable:', error);
    return NextResponse.json([], { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
