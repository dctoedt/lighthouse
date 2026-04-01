/* cite-toggle.js
 * Initializes togglable citation elements for Lighthouse HTML export.
 *
 * For each <cite> element, wraps its contents in a .cite-content span
 * and prepends a .cite-toggle button that shows/hides the citation.
 *
 * Adds "js-ready" to <html> so CSS can distinguish JS-enabled rendering
 * (inline toggle mode) from JS-disabled rendering (block citation mode).
 *
 * Usage in org-mode file header:
 *   #+HTML_HEAD: <script src="cite-toggle.js" defer></script>
 *
 * No external dependencies.
 */

(function () {
  function initCiteToggles() {
    document.documentElement.classList.add("js-ready");
    document.querySelectorAll("cite").forEach(function (cite) {
      var content = document.createElement("span");
      content.className = "cite-content";
      content.innerHTML = cite.innerHTML;

      var toggle = document.createElement("span");
      toggle.className = "cite-toggle";
      toggle.textContent = "Cite";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");

      function doToggle() {
        var isOpen = content.classList.toggle("open");
        toggle.textContent = isOpen ? "Hide" : "Cite";
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }

      toggle.addEventListener("click", doToggle);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle();
        }
      });

      cite.innerHTML = "";
      cite.appendChild(toggle);
      cite.appendChild(content);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCiteToggles);
  } else {
    initCiteToggles();
  }
})();
