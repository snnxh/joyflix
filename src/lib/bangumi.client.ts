/* eslint-disable no-console */

'use client';

export interface BangumiCalendarData {
  weekday: {
    en: string;
  };
  items: {
    id: number;
    name: string;
    name_cn: string;
    rating: {
      score: number;
    };
    air_date: string;
    images: {
      large: string;
      common: string;
      medium: string;
      small: string;
      grid: string;
    };
  }[];
}

export async function GetBangumiCalendarData(): Promise<BangumiCalendarData[]> {
  try {
    const response = await fetch('/api/bangumi/calendar');
    if (!response.ok) {
      throw new Error(`Bangumi calendar proxy returned ${response.status}`);
    }

    const data: unknown = await response.json();
    return Array.isArray(data) ? (data as BangumiCalendarData[]) : [];
  } catch (error) {
    // The calendar is optional; the rest of the homepage should still render.
    console.warn('Bangumi calendar unavailable:', error);
    return [];
  }
}
