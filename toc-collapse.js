/* toc-collapse.js
 * Makes the hamburger TOC drawer collapsible: top-level entries start
 * collapsed; clicking a chapter entry toggles its child list open/closed.
 *
 * Rationale for default-collapsed:
 *   (a) The Lighthouse book is long enough that a fully-expanded TOC
 *       would require heavy scrolling inside the drawer.
 *   (b) The first TOC entry is "Detailed table of contents," which gives
 *       readers a full expanded view whenever they want it.
 *
 * Structure assumed (standard org-mode HTML export):
 *   #text-table-of-contents
 *     ul                         <- top-level list
 *       li                       <- chapter entry
 *         a   (chapter link)
 *         ul  <- child list (sections within chapter); may be absent
 *           li
 *             a
 *             ul  <- grandchild list; collapsed with its parent
 *           ...
 *       li
 *         a   (leaf entry — no child ul)
 *       ...
 *
 * Behavior:
 *   - Any <li> that directly contains a child <ul> gets a toggle triangle
 *     (▶ collapsed, ▼ expanded) prepended before its <a>.
 *   - Child lists start hidden (collapsed).
 *   - Clicking the triangle toggles the child list open/closed.
 *   - Keyboard: Enter / Space on the triangle also toggles.
 *   - Clicking a collapsed chapter <a> expands its children but does NOT
 *     navigate — preventing the reader from jumping past the section list
 *     before seeing it. A second click on the same link navigates normally.
 *   - Clicking an already-expanded chapter <a> navigates immediately.
 *   - Grandchild lists collapse together with their parent; they do NOT
 *     get their own independent toggles (keeps the drawer simple).
 *   - Clicking a leaf <a> (no child list) navigates normally and closes
 *     the drawer — handled by the existing click-delegation in lighthouse-2.js.
 *   - ARIA: aria-expanded on each triangle reflects open/closed state.
 *
 * Usage in org-mode file header (load after lighthouse-2.js):
 *   #+HTML_HEAD: <script src="toc-collapse.js" defer></script>
 *
 * No external dependencies.
 */

(function () {

  function initTocCollapse() {

    var tocInner = document.getElementById("text-table-of-contents");
    if (!tocInner) { return; }

    /* Find every <li> that has a direct child <ul> (i.e., has sub-entries). */
    var parentItems = tocInner.querySelectorAll("li > ul");

    parentItems.forEach(function (childList) {
      var li = childList.parentElement;          /* the owning <li> */
      var link = li.querySelector(":scope > a"); /* the chapter <a> */

      /* ---- Build the toggle triangle ---------------------------------- */
      var triangle = document.createElement("span");
      triangle.className = "toc-toggle";
      triangle.setAttribute("role", "button");
      triangle.setAttribute("tabindex", "0");
      triangle.setAttribute("aria-expanded", "false");
      triangle.setAttribute("aria-label", "Expand section");
      triangle.textContent = "▶";

      /* ---- Start collapsed ------------------------------------------- */
      childList.classList.add("toc-collapsed");

      /* ---- Toggle logic ---------------------------------------------- */
      function doToggle(e) {
        e.stopPropagation(); /* don't bubble up to parent <li> toggles */
        var isOpen = childList.classList.toggle("toc-collapsed");
        /* classList.toggle returns true when the class was ADDED (i.e., now collapsed) */
        var nowOpen = !isOpen;
        triangle.textContent  = nowOpen ? "▼" : "▶";
        triangle.setAttribute("aria-expanded", nowOpen ? "true" : "false");
        triangle.setAttribute("aria-label",    nowOpen ? "Collapse section" : "Expand section");
      }

      triangle.addEventListener("click", doToggle);
      triangle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          doToggle(e);
        }
      });

      /* Two-click behavior on chapter links:
         - First click when collapsed: expand children, suppress navigation.
         - Click when already expanded: navigate normally (drawer closes via
           lighthouse-2.js's existing TOC click-delegation).
         This prevents the reader from jumping past the section list before
         seeing what it contains. */
      if (link) {
        link.addEventListener("click", function (e) {
          if (childList.classList.contains("toc-collapsed")) {
            /* Currently collapsed — expand only, don't navigate. */
            e.preventDefault();
            doToggle(e);
          }
          /* Already expanded — let the click navigate normally. */
        });
      }

      /* ---- Insert triangle before the <a> in the <li> ---------------- */
      if (link) {
        li.insertBefore(triangle, link);
      } else {
        li.prepend(triangle);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTocCollapse);
  } else {
    initTocCollapse();
  }

})();
