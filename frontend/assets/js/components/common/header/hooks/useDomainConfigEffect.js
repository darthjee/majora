import { useEffect } from 'react';

/**
 * Applies the resolved domain configuration to the document: `title` is always re-asserted
 * (the API never returns `null` for it, so this just re-confirms `"Majora"` when unconfigured,
 * matching `frontend/index.html`'s static `<title>Majora</title>`), while the favicon `<link>`'s
 * `href` is only rewritten when `favicon` is non-null — left untouched (matching
 * `frontend/index.html`'s static `<link rel="icon" ...>`) otherwise. Extracted as a plain
 * function (rather than inlined in a `useEffect` callback) so it can be exercised directly in
 * specs without depending on React's effect timing.
 *
 * @param {{favicon: (string|null), title: string, subTitle: string}} domainConfig - Resolved
 *   (or still-default) domain configuration.
 * @returns {void}
 */
function applyDomainConfig(domainConfig) {
  if (typeof document === 'undefined') {
    return;
  }

  document.title = domainConfig.title;

  if (!domainConfig.favicon) {
    return;
  }

  const faviconLink = document.querySelector('link[rel="icon"]');

  if (faviconLink) {
    faviconLink.href = domainConfig.favicon;
  }
}

/**
 * Wires the Header's domain-configuration side effect (issue #759): keeps `document.title`
 * and, when overridden, the favicon `<link>`'s `href` in sync with the resolved domain
 * configuration, re-running whenever a newly-resolved `domainConfig` is passed in.
 *
 * @param {{favicon: (string|null), title: string, subTitle: string}} domainConfig - Resolved
 *   (or still-default) domain configuration.
 * @returns {void}
 */
export default function useDomainConfigEffect(domainConfig) {
  useEffect(() => applyDomainConfig(domainConfig), [domainConfig]);
}

export { applyDomainConfig };
