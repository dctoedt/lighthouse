/* cite-toggle.js
 * Initializes togglable citation and aside elements for Lighthouse HTML export.
 *
 * For each <cite> element NOT in a footnote, wraps its contents in a .cite-content span
 * and prepends a .cite-toggle button that shows/hides the citation.
 *
 * For each <aside> element, wraps its contents in a .aside-content span
 * and prepends a .aside-toggle button labeled "Note" that shows/hides the aside.
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
    document.querySelectorAll("cite:not(.footpara cite)").forEach(function (cite) {
      var content = document.createElement("span");
      content.className = "cite-content";
      content.innerHTML = cite.innerHTML;

      var toggle = document.createElement("span");
      toggle.className = "cite-toggle";
      toggle.textContent = "More";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");

      function doToggle() {
        var isOpen = content.classList.toggle("open");
        toggle.textContent = isOpen ? "Hide" : "More";
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

  function initAsideToggles() {
    document.querySelectorAll("aside").forEach(function (aside) {
      var content = document.createElement("span");
      content.className = "aside-content";
      content.innerHTML = aside.innerHTML;

      var toggle = document.createElement("span");
      toggle.className = "aside-toggle";
      toggle.textContent = "Note";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");

      function doToggle() {
        var isOpen = content.classList.toggle("open");
        toggle.textContent = isOpen ? "Hide" : "Note";
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }

      toggle.addEventListener("click", doToggle);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle();
        }
      });

      // <aside> is a block sibling of <p>, not inline inside it.
      // To get the toggle button inline in the preceding text, we
      // append the toggle and content spans directly to the previous
      // sibling element (typically the <p> before the aside), then
      // hide the now-empty aside shell rather than fighting its
      // block formatting context with CSS.
      var anchor = aside.previousElementSibling || aside.parentElement;
      anchor.appendChild(toggle);
      anchor.appendChild(content);
      aside.style.display = "none";
    });
  }

  function init() {
    initCiteToggles();
    initAsideToggles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
