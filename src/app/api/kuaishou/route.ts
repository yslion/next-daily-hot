/*
 * @Author: 白雾茫茫丶<baiwumm.com>
 * @Date: 2024-05-14 10:16:28
 * @LastEditors: 白雾茫茫丶<baiwumm.com>
 * @LastEditTime: 2024-05-14 16:52:09
 * @Description: 快手-热榜
 */
import { NextResponse } from 'next/server';

import { REQUEST_STATUS_TEXT } from '@/utils/enum';
import type { HotListItem } from '@/utils/types';

import { responseError, responseSuccess } from '@/utils';

export async function GET() {
  // 官方 url
  const url = 'https://www.kuaishou.com/?isHome=1';
  try {
    // 请求数据
    const response = await fetch(url);
    if (!response.ok) {
      // 如果请求失败，抛出错误，不进行缓存
      throw new Error(`${REQUEST_STATUS_TEXT.ERROR}：快手-热榜`);
    }
    // 得到请求体
    const responseBody = await response.text();

    // 处理数据
    const result: HotListItem[] = [];
    const pattern = /window.__APOLLO_STATE__=(.*);\(function\(\)/s;
    const idPattern = /clientCacheKey=([A-Za-z0-9]+)/s;
    const matchResult = responseBody.match(pattern);
    const jsonObject = matchResult ? JSON.parse(matchResult[1])['defaultClient'] : [];

    // 获取所有分类
    const allItems = jsonObject['$ROOT_QUERY.visionHotRank({"page":"home"})']['items'];
    console.warn(allItems);
    // 遍历所有分类
    allItems.forEach((item: Record<string, any>) => {
      const itemData = jsonObject[item.id];
      if (!itemData) return;

      const image = itemData.poster;
      if (!image) return;

      const idMatch = image.match(idPattern);
      if (!idMatch?.[1]) return;

      result.push({
        id: idMatch[1],
        title: itemData.name,
        hot: Number(itemData.hotValue?.replace('万', '')) * 10000 || 0,
        url: `https://www.kuaishou.com/short-video/${idMatch[1]}`,
        mobileUrl: `https://www.kuaishou.com/short-video/${idMatch[1]}`,
      });
    });
    console.warn(result);
    return NextResponse.json(responseSuccess(result));
  } catch (error) {
    return NextResponse.json(responseError);
  }
}

// 数据过期时间
export const revalidate = Number(process.env.NEXT_PUBLIC_CACHE_TIME);
