import { Vulnerability, VulnQueryParams } from '../types';
import { dateRangeToStartDate } from '../utils/date';

const KISA_RSS_URL = 'https://www.boho.or.kr/kr/rss.do?bbsId=B0000133';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
}

/**
 * RSS XML 파싱
 */
function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemContent = match[1];

    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
    const linkMatch = itemContent.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>|<link>(.*?)<\/link>/i);
    const pubDateMatch = itemContent.match(/<pubDate><!\[CDATA\[(.*?)\]\]><\/pubDate>|<pubDate>(.*?)<\/pubDate>/i);

    const title = titleMatch?.[1] || titleMatch?.[2] || '';
    const link = linkMatch?.[1] || linkMatch?.[2] || '';
    const pubDate = pubDateMatch?.[1] || pubDateMatch?.[2] || '';

    if (title && link && pubDate) {
      items.push({ title, link, pubDate });
    }
  }

  return items;
}

/**
 * link에서 nttId 추출
 */
function extractNttId(link: string): string {
  const match = link.match(/nttId=(\d+)/);
  return match?.[1] || '';
}

/**
 * YYYY-MM-DD → ISO 8601 변환
 */
function parseKISADate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
}

/**
 * RSS item → Vulnerability 변환
 */
function transformKISAItem(item: RSSItem): Vulnerability {
  const nttId = extractNttId(item.link);

  return {
    id: `KISA-${nttId}`,
    source: 'kisa',
    severity: 'unknown',
    cvssScore: undefined,
    title: item.title,
    description: item.title,
    affectedProducts: [],
    publishedAt: parseKISADate(item.pubDate),
    url: item.link,
  };
}

/**
 * KISA 보안공지 RSS 조회
 */
export async function fetchKISAVulnerabilities(
  params: VulnQueryParams
): Promise<Vulnerability[]> {
  const { dateRange = '24h', limit = 50 } = params;

  try {
    const response = await fetch(KISA_RSS_URL, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`KISA RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml);
    const startDate = new Date(dateRangeToStartDate(dateRange));

    // 날짜 필터링
    let vulnerabilities = items
      .map(transformKISAItem)
      .filter((v) => new Date(v.publishedAt) >= startDate);

    // 최신 순 정렬
    vulnerabilities.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return vulnerabilities.slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch KISA vulnerabilities:', error);
    return [];
  }
}
