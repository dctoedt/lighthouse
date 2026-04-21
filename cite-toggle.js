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
      toggle.textContent = "Hide note";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "true");

      function doToggle() {
        var isOpen = content.classList.toggle("open");
        toggle.textContent = isOpen ? "Hide note" : "Show note";
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
      // Start open: add .open to content so it's visible on load.
      content.classList.add("open");
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
      toggle.textContent = "Hide note";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");
      // Mark so the expander knows this toggle's content is NOT nextElementSibling.
      toggle.setAttribute("data-cmtry-toggle", "true");

      function doToggle() {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          body.style.display = "none";
          toggle.textContent = "Show note";
          toggle.setAttribute("aria-expanded", "false");
        } else {
          body.style.display = "";
          toggle.textContent = "Hide note";
          toggle.setAttribute("aria-expanded", "true");
        }
      }

      toggle.addEventListener("click", doToggle);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle();
        }
      });

      // Start open: body visible, toggle shows "Hide".
      toggle.textContent = "Hide note";
      toggle.setAttribute("aria-expanded", "true");
      heading.replaceWith(toggle);
    });
  }


  function initAddlToggles() {
    // div.addl is a collapsible "additional notes" section.
    // Unlike div.cmtry, the heading stays visible at all times —
    // a small "[ show ]" / "[ hide ]" link is appended to it.
    //
    // org-mode's :HTML_CONTAINER_CLASS: addl wraps only the heading-level's
    // own outline-text div inside div.addl. Child headings (sub-sections)
    // are emitted as *siblings* of div.addl in the parent container, not as
    // children of it. So we collect div.addl's own content children PLUS
    // all following siblings of div.addl up to the next same-or-higher-level
    // outline div, wrap them all in a div.addl-body inserted after div.addl,
    // and hide/show that wrapper.
    document.querySelectorAll("div.addl").forEach(function (addl) {
      var heading = addl.querySelector("h3, h4, h5, h6");
      if (!heading) { return; }

      var parent = addl.parentElement;
      if (!parent) { return; }

      // Determine the outline level of div.addl so we know when to stop
      // collecting siblings (stop at a div whose outline level is <= ours).
      // org-mode uses classes like "outline-2", "outline-3", etc.
      function outlineLevel(el) {
        var m = (el.className || "").match(/outline-(\d+)/);
        return m ? parseInt(m[1], 10) : 999;
      }
      var addlLevel = outlineLevel(addl);

      // Collect: (a) content children of div.addl after the heading,
      //          (b) following siblings of div.addl up to next peer/ancestor.
      var bodyNodes = [];

      // (a) Children of div.addl after the heading (snapshot before moving)
      var allChildren = Array.prototype.slice.call(addl.children);
      var headingIndex = allChildren.indexOf(heading);
      allChildren.slice(headingIndex + 1).forEach(function (child) {
        bodyNodes.push(child);
      });

      // (b) Snapshot all following siblings of div.addl that belong to this
      //     section (outline level > addlLevel). Snapshot first, then move,
      //     to avoid breaking iteration when appendChild() removes nodes
      //     from the parent's child list.
      var siblingsToMove = [];
      var sib = addl.nextElementSibling;
      while (sib) {
        var sibLevel = outlineLevel(sib);
        if (sibLevel <= addlLevel) { break; }  // reached a peer or ancestor section
        siblingsToMove.push(sib);
        sib = sib.nextElementSibling;
      }
      siblingsToMove.forEach(function (s) { bodyNodes.push(s); });

      if (bodyNodes.length === 0) { return; }

      // Build the wrapper and move all collected nodes into it.
      var body = document.createElement("div");
      body.className = "addl-body";
      bodyNodes.forEach(function (node) {
        body.appendChild(node);
      });

      // Insert wrapper after div.addl in the parent.
      // Start open: add addl-open so CSS shows it on load.
      addl.insertAdjacentElement("afterend", body);
      body.classList.add("addl-open");

      var toggle = document.createElement("span");
      toggle.className = "addl-toggle";
      toggle.textContent = "[ hide note ]";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("data-addl-toggle", "true");

      function doToggle() {
        var isOpen = toggle.getAttribute("aria-expanded") === "true";
        if (isOpen) {
          body.style.display = "none";
          toggle.textContent = "[ show note ]";
          toggle.setAttribute("aria-expanded", "false");
        } else {
          body.style.display = "block";
          toggle.textContent = "[ hide note ]";
          toggle.setAttribute("aria-expanded", "true");
        }
      }

      toggle.addEventListener("click", doToggle);
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle();
        }
      });

      heading.appendChild(toggle);
    });
  }

  function initSectionExpanders() {
    document.querySelectorAll("div.pr-top").forEach(function (section) {
      // Collect every toggle button in this section, including cmtry toggles.
      var toggles = section.querySelectorAll(".aside-toggle, .addl-toggle");
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

          if (toggle.getAttribute("data-addl-toggle") === "true") {
            // addl toggle: heading stays visible; body is the .addl-body wrapper
            // div created by initAddlToggles, containing all post-heading siblings.
            var addl = toggle.closest("div.addl");
            if (!addl) { return; }
            // addl-body is inserted as a sibling of div.addl, not a child.
            var body = addl.nextElementSibling;
            if (!body || !body.classList.contains("addl-body")) { return; }
            if (!body) { return; }
            if (opening && !alreadyOpen) {
              body.style.display = "block";
              toggle.textContent = "[ hide note ]";
              toggle.setAttribute("aria-expanded", "true");
            } else if (!opening && alreadyOpen) {
              body.style.display = "none";
              toggle.textContent = "[ show note ]";
              toggle.setAttribute("aria-expanded", "false");
            }

          } else if (toggle.getAttribute("data-cmtry-toggle") === "true") {
            // cmtry toggle: content is the outline-text div inside the parent cmtry.
            var cmtry = toggle.closest("div.cmtry");
            if (!cmtry) { return; }
            var body = cmtry.querySelector(
              "div.outline-text-5, div.outline-text-6, div.outline-text-7"
            );
            if (!body) { return; }
            if (opening && !alreadyOpen) {
              body.style.display = "";
              toggle.textContent = "Hide note";
              toggle.setAttribute("aria-expanded", "true");
            } else if (!opening && alreadyOpen) {
              body.style.display = "none";
              toggle.textContent = "Show note";
              toggle.setAttribute("aria-expanded", "false");
            }

          } else {
            // cite / aside toggle: content is nextElementSibling, uses .open class.
            var content = toggle.nextElementSibling;
            if (!content) { return; }
            if (opening && !alreadyOpen) {
              content.classList.add("open");
              toggle.setAttribute("aria-expanded", "true");
              toggle.textContent = "Hide note";
            } else if (!opening && alreadyOpen) {
              content.classList.remove("open");
              toggle.setAttribute("aria-expanded", "false");
              toggle.textContent = toggle.classList.contains("cite-toggle") ? "Cite" : "Show note";
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
    initAddlToggles();    // must run before initSectionExpanders
    initSectionExpanders();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
