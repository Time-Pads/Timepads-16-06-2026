let urlToPreload;
let mouseoverTimer;
let lastTouchTimestamp = 0;

const prefetcher = document.createElement("link");
const relList = prefetcher.relList;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const effectiveType = connection && connection.effectiveType ? connection.effectiveType.toLowerCase() : "";
const isSlowConnection = /(^|-)2g$|(^|-)3g$/.test(effectiveType);
const isSupported = relList && relList.supports && relList.supports("prefetch");
const isDataSaverEnabled = Boolean(connection && connection.saveData);
const allowQueryString = "instantAllowQueryString" in document.body.dataset;
const allowExternalLinks = "instantAllowExternalLinks" in document.body.dataset;

if (isSupported && !isDataSaverEnabled && !isSlowConnection) {
  prefetcher.rel = "prefetch";
  document.head.appendChild(prefetcher);

  const listenerOptions = { capture: true, passive: true };
  document.addEventListener("touchstart", touchstartListener, listenerOptions);
  document.addEventListener("mouseover", mouseoverListener, listenerOptions);
}

function touchstartListener(event) {
  lastTouchTimestamp = performance.now();

  const link = event.target.closest("a");
  if (!isPreloadable(link)) return;

  link.addEventListener("touchcancel", touchendAndTouchcancelListener, { passive: true });
  link.addEventListener("touchend", touchendAndTouchcancelListener, { passive: true });
  urlToPreload = link.href;
  preload(link.href);
}

function touchendAndTouchcancelListener() {
  urlToPreload = undefined;
  stopPreloading();
}

function mouseoverListener(event) {
  if (performance.now() - lastTouchTimestamp < 1100) return;

  const link = event.target.closest("a");
  if (!isPreloadable(link)) return;

  link.addEventListener("mouseout", mouseoutListener, { passive: true });
  urlToPreload = link.href;
  mouseoverTimer = setTimeout(() => {
    preload(link.href);
    mouseoverTimer = undefined;
  }, 65);
}

function mouseoutListener(event) {
  if (event.relatedTarget && event.target.closest("a") === event.relatedTarget.closest("a")) return;

  if (mouseoverTimer) {
    clearTimeout(mouseoverTimer);
    mouseoverTimer = undefined;
    return;
  }

  urlToPreload = undefined;
  stopPreloading();
}

function isPreloadable(link) {
  if (!link || !link.href) return false;
  if (urlToPreload === link.href) return false;

  const url = new URL(link.href);
  const isAllowedOrigin = allowExternalLinks || url.origin === location.origin || "instant" in link.dataset;
  const isHttp = ["http:", "https:"].includes(url.protocol);
  const isMixedContent = url.protocol === "http:" && location.protocol === "https:";
  const hasBlockedQuery = !(allowQueryString || !url.search || "instant" in link.dataset);
  const isSamePageAnchor = url.hash && url.pathname + url.search === location.pathname + location.search;

  return isAllowedOrigin && isHttp && !isMixedContent && !hasBlockedQuery && !isSamePageAnchor && !("noInstant" in link.dataset);
}

function preload(url) {
  prefetcher.href = url;
}

function stopPreloading() {
  prefetcher.removeAttribute("href");
}
