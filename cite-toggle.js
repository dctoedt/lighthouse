/* cite-toggle.js
 * Initializes togglable citation and aside elements for Lighthouse HTML export.
 *
 * For each <cite> element NOT in a footnote, wraps its contents in a .cite-content span
 * and prepends a .cite-toggle button that shows/hides the citation.
 *
 * For each <aside> element, wraps its contents in a .aside-content span
 * and prepends a .aside-toggle button labeled "Note" that shows/hides the aside.
 *
 * For each div.cmtry element, hides the note body and turns the heading
 * into a "Note" / "Hide" toggle button, consistent with cite/aside toggles.
 *
 * For each Protocol section (div.pr-top) that contains at least one
 * toggle, inserts a small "[ expand notes ]" / "[ collapse notes ]" link
 * after the section heading so all notes can be opened or closed at once
 * (covers cite, aside, and cmtry toggles).
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

  function initCmtryToggles() {
    // div.cmtry is a block element produced by org-mode for commentary sections.
    // Its structure is:
    //   <div class="cmtry">
    //     <h5 (or h6)>Note</h5>          <- heading to replace with toggle button
    //     <div class="outline-text-N">   <- note body to hide/show
    //       <p>...</p>
    //     </div>
    //   </div>
    //
    // Strategy: hide the body div, replace the heading with a styled toggle
    // button. Mark the toggle with data-cmtry-toggle="true" so initSectionExpanders
    // can distinguish it from cite/aside toggles (whose content is nextElementSibling).
    document.querySelectorAll("div.cmtry").forEach(function (cmtry) {
      var heading = cmtry.querySelector("h5, h6");
      if (!heading) { return; }

      // The note body is the outline-text div that follows the heading.
      var body = cmtry.querySelector(
        "div.outline-text-5, div.outline-text-6, div.outline-text-7"
      );
      if (!body) { return; }

      // Build the toggle button to replace the heading.
      var toggle = document.createElement("span");
      toggle.className = "aside-toggle cmtry-toggle";
      toggle.textContent = "Note";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");
      // Mark so the expander knows this toggle's content is NOT nextElementSibling.
      toggle.setAttribute("data-cmtry-toggle", "true");

      function doToggle() {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          body.style.display = "none";
          toggle.textContent = "Note";
          toggle.setAttribute("aria-expanded", "false");
          cmtry.classList.remove("cmtry-open");
        } else {
          body.style.display = "";
          toggle.textContent = "Hide";
          toggle.setAttribute("aria-expanded", "true");
          cmtry.classList.add("cmtry-open");
        }
      }

      toggle.addEventListener("click", doToggle);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle();
        }
      });

      // Hide body initially; replace heading with toggle button.
      body.style.display = "none";
      heading.replaceWith(toggle);
    });
  }

  function initSectionExpanders() {
    document.querySelectorAll("div.pr-top").forEach(function (section) {
      // Collect every toggle button in this section, including cmtry toggles.
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
          var alreadyOpen = toggle.getAttribute("aria-expanded") === "true";

          if (toggle.getAttribute("data-cmtry-toggle") === "true") {
            // cmtry toggle: content is the outline-text div inside the parent cmtry,
            // controlled via display style rather than a .open class.
            var cmtry = toggle.closest("div.cmtry");
            if (!cmtry) { return; }
            var body = cmtry.querySelector(
              "div.outline-text-5, div.outline-text-6, div.outline-text-7"
            );
            if (!body) { return; }
            if (opening && !alreadyOpen) {
              body.style.display = "";
              toggle.textContent = "Hide";
              toggle.setAttribute("aria-expanded", "true");
              cmtry.classList.add("cmtry-open");
            } else if (!opening && alreadyOpen) {
              body.style.display = "none";
              toggle.textContent = "Note";
              toggle.setAttribute("aria-expanded", "false");
              cmtry.classList.remove("cmtry-open");
            }

          } else {
            // cite / aside toggle: content is nextElementSibling, uses .open class.
            var content = toggle.nextElementSibling;
            if (!content) { return; }
            if (opening && !alreadyOpen) {
              content.classList.add("open");
              toggle.setAttribute("aria-expanded", "true");
              toggle.textContent = "Hide";
            } else if (!opening && alreadyOpen) {
              content.classList.remove("open");
              toggle.setAttribute("aria-expanded", "false");
              toggle.textContent = toggle.classList.contains("cite-toggle") ? "Cite" : "Note";
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

      // Keep the expander label in sync when individual toggles are clicked.
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
    initCmtryToggles();   // must run before initSectionExpanders
    initSectionExpanders();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
