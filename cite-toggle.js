/* cite-toggle.js
 * Initializes togglable citation and aside elements for Lighthouse HTML export.
 *
 * For each <cite> element NOT in a footnote, wraps its contents in a .cite-content span
 * and prepends a .cite-toggle button that shows/hides the citation.
 *
 * For each <aside> element, wraps its contents in a .aside-content span
 * and prepends a .aside-toggle button labeled "Note" that shows/hides the aside.
 *
 * For each Protocol section (div.pr-top) that contains at least one
 * toggle, inserts a small "[ expand notes ]" / "[ collapse notes ]" link
 * after the section heading so all notes can be opened or closed at once.
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

  function initSectionExpanders() {
    // Target the same container classes used for Protocol / clause sections.
    document.querySelectorAll("div.pr-top").forEach(function (section) {
      // Collect every toggle button in this section.
      var toggles = section.querySelectorAll(".cite-toggle, .aside-toggle");
      if (toggles.length === 0) { return; }

      // Find the first heading element to anchor the expander link after.
      var heading = section.querySelector("h3, h4, h5, h6");
      if (!heading) { return; }

      var expander = document.createElement("span");
      expander.className = "section-expander";
      expander.setAttribute("role", "button");
      expander.setAttribute("tabindex", "0");

      function allOpen() {
        return Array.prototype.every.call(toggles, function (t) {
          return t.getAttribute("aria-expanded") === "true";
        });
      }

      function updateLabel() {
        expander.textContent = allOpen() ? "[ collapse notes ]" : "[ expand notes ]";
      }

      function doExpand() {
        var opening = !allOpen();
        toggles.forEach(function (toggle) {
          // Determine the paired content span: the next sibling of the toggle.
          var content = toggle.nextElementSibling;
          if (!content) { return; }
          var alreadyOpen = toggle.getAttribute("aria-expanded") === "true";
          if (opening && !alreadyOpen) {
            content.classList.add("open");
            toggle.setAttribute("aria-expanded", "true");
            // Update individual toggle label.
            if (toggle.classList.contains("cite-toggle")) {
              toggle.textContent = "Hide";
            } else if (toggle.classList.contains("aside-toggle")) {
              toggle.textContent = "Hide";
            }
          } else if (!opening && alreadyOpen) {
            content.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
            if (toggle.classList.contains("cite-toggle")) {
              toggle.textContent = "More";
            } else if (toggle.classList.contains("aside-toggle")) {
              toggle.textContent = "Note";
            }
          }
        });
        updateLabel();
      }

      expander.addEventListener("click", doExpand);
      expander.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doExpand();
        }
      });

      // Also keep the expander label in sync when individual toggles are clicked.
      toggles.forEach(function (toggle) {
        toggle.addEventListener("click", updateLabel);
      });

      updateLabel();

      // Insert as a new block line immediately after the heading.
      var wrapper = document.createElement("div");
      wrapper.className = "section-expander-wrapper";
      wrapper.appendChild(expander);
      heading.insertAdjacentElement("afterend", wrapper);
    });
  }

  function init() {
    initCiteToggles();
    initAsideToggles();
    initSectionExpanders();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
