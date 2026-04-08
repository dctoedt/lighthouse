/* external-links.js
 * Opens external links in a new tab, leaving internal links unchanged.
 *
 * A link is treated as "external" if its href starts with http:// or https://
 * and its hostname differs from the current page's hostname.
 *
 * Usage in org-mode file header:
 *   #+HTML_HEAD: <script src="external-links.js" defer></script>
 *
 * No external dependencies.
 */

(function () {
  function initExternalLinks() {
    var currentHost = window.location.hostname;

    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");

      // Only process absolute http/https URLs
      if (!/^https?:\/\//i.test(href)) return;

      try {
        var linkHost = new URL(href).hostname;
        if (linkHost && linkHost !== currentHost) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      } catch (e) {
        // Malformed URL — leave it alone
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExternalLinks);
  } else {
    initExternalLinks();
  }
})();