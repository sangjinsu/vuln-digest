import { Vulnerability, VulnQueryParams } from '../types';
import { dateRangeToStartDate } from '../utils/date';

const KISA_RSS_URL = 'https://www.boho.or.kr/kr/rss.do?bbsId=B0000133';

/**
 * KISA 상세 페이지에서 본문 추출
 */
async function fetchKISADetail(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VulnDigest/1.0)',
        Accept: 'text/html',
      },
      next: { revalidate: 3600 }, // 1시간 캐싱
    });

    if (!response.ok) return '';

    const html = await response.text();

    // HTML에서 본문 텍스트 추출
    // □ 개요 ~ □ 참고사이트 또는 □ 문의사항 사이 내용
    const match = html.match(
      /□\s*개요([\s\S]*?)(?:□\s*참고사이트|□\s*문의사항|□\s*기타)/
    );
    if (match) {
      // HTML 태그 제거 및 정리
      return match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500); // 최대 500자
    }
    return '';
  } catch {
    return '';
  }
}

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
 * RSS item → Vulnerability 변환 (상세 페이지에서 본문 추출)
 */
async function transformKISAItemWithDetail(item: RSSItem): Promise<Vulnerability> {
  const nttId = extractNttId(item.link);
  const description = await fetchKISADetail(item.link);

  return {
    id: `KISA-${nttId}`,
    source: 'kisa',
    severity: 'unknown',
    cvssScore: undefined,
    title: item.title,
    description: description || item.title, // fallback to title
    affectedProducts: [],
    publishedAt: parseKISADate(item.pubDate),
    url: item.link,
  };
}

/**
 * KISA 보안공지 RSS 조회 (상세 페이지 크롤링 포함)
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

    // 날짜 필터링 후 상세 페이지 병렬 크롤링
    const filteredItems = items.filter(
      (item) => new Date(parseKISADate(item.pubDate)) >= startDate
    );

    // 병렬 처리로 상세 페이지 크롤링
    const vulnerabilities = await Promise.all(
      filteredItems.slice(0, limit).map(transformKISAItemWithDetail)
    );

    // 최신 순 정렬
    vulnerabilities.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return vulnerabilities;
  } catch (error) {
    console.error('Failed to fetch KISA vulnerabilities:', error);
    return [];
  }
}
