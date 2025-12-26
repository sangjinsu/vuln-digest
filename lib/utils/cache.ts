/**
 * 캐싱 유틸리티
 * GitHub Token 유무에 따라 캐싱 주기 조정
 */

// GitHub Token 있으면 1분, 없으면 5분 캐싱
export const CACHE_TTL = process.env.GITHUB_TOKEN ? 60 : 300;

// 기본 캐시 TTL (5분)
export const DEFAULT_CACHE_TTL = 300;

// 빠른 캐시 TTL (1분) - 토큰 있을 때
export const FAST_CACHE_TTL = 60;
