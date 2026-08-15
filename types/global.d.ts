/**
 * 全局类型声明补丁
 */

export {};

declare global {
  interface Window {
    /** Google AdSense 异步加载队列 */
    adsbygoogle?: unknown[];
  }
}