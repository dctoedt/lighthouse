/* lighthouse-2.js
 * Injects the fixed hamburger button (top-left) and "Not legal advice" notice
 * (top-right) into the page, then wires up the TOC slide-in drawer.
 *
 * Replaces lighthouse-mobile.js for the no-sidebar layout introduced in LH-2.css.
 * No external dependencies.
 *
 * Usage in org-mode file header:
 *   #+HTML_HEAD: <script src="lighthouse-2.js" defer></script>
 */

(function () {

  function init() {

    /* ------------------------------------------------------------------ *
     * 1. Hamburger toggle button (top-left)
     * ------------------------------------------------------------------ */
    var menuToggle = document.getElementById("menu-toggle");
    if (!menuToggle) {
      menuToggle = document.createElement("button");
      menuToggle.id = "menu-toggle";
      menuToggle.setAttribute("aria-label", "Open table of contents");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-controls", "table-of-contents");
      menuToggle.innerHTML = "&#9776;"; /* ☰ */
      document.body.insertBefore(menuToggle, document.body.firstChild);
    }

    /* ------------------------------------------------------------------ *
     * 2. Overlay (dims page when drawer is open)
     * ------------------------------------------------------------------ */
    var overlay = document.getElementById("sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    /* ------------------------------------------------------------------ *
     * 3. "Not a substitute for legal advice" notice
     *    Positioned just to the right of the content column, flush with
     *    its right edge. Repositioned on resize so it tracks the column.
     * ------------------------------------------------------------------ */
    var nlaNotice = document.getElementById("nla-notice");
    if (!nlaNotice) {
      nlaNotice = document.createElement("div");
      nlaNotice.id = "nla-notice";
      nlaNotice.innerHTML =
        'Not a substitute for legal advice '
        + '(<a href="#k-bound-NLA">see&nbsp;2.1.10</a>)';
      document.body.insertBefore(nlaNotice, document.body.firstChild);
    }

    /* Position the notice just outside the right edge of #content.
     * Falls back to viewport-right if no room exists (narrow screens). */
    var contentEl = document.getElementById("content");

    function positionNlaNotice() {
      if (!contentEl) { return; }
      var rect = contentEl.getBoundingClientRect();
      var noticeWidth = nlaNotice.offsetWidth || 160;
      var gap = 12; /* px gap between column edge and notice */
      var availableRight = window.innerWidth - rect.right;

      if (availableRight >= noticeWidth + gap) {
        /* Enough room: anchor left edge just past the content column */
        nlaNotice.style.left  = (rect.right + gap) + "px";
        nlaNotice.style.right = "auto";
      } else {
        /* Too narrow: fall back to viewport right edge */
        nlaNotice.style.left  = "auto";
        nlaNotice.style.right = "0.5rem";
      }
    }

    positionNlaNotice();
    nlaNotice.style.visibility = "visible"; /* reveal after first position */
    window.addEventListener("resize", positionNlaNotice);

    /* ------------------------------------------------------------------ *
     * 4. Wire up drawer open/close
     * ------------------------------------------------------------------ */
    var toc = document.getElementById("table-of-contents");
    if (!toc) { return; } /* Nothing to toggle */

    function openDrawer() {
      toc.classList.add("show");
      overlay.classList.add("show");
      menuToggle.setAttribute("aria-expanded", "true");
      menuToggle.setAttribute("aria-label", "Close table of contents");
    }

    function closeDrawer() {
      toc.classList.remove("show");
      overlay.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open table of contents");
    }

    menuToggle.addEventListener("click", function () {
      if (toc.classList.contains("show")) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    /* Clicking the overlay closes the drawer */
    overlay.addEventListener("click", closeDrawer);

    /* Clicking any TOC link closes the drawer — but only when the click will
     * actually navigate.  toc-collapse.js calls e.preventDefault() on a
     * collapsed chapter link (expand-only, no navigation), so we check
     * e.defaultPrevented to avoid closing the drawer in that case. */
    toc.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && !e.defaultPrevented) {
        closeDrawer();
      }
    });

    /* Escape key closes the drawer */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toc.classList.contains("show")) {
        closeDrawer();
        menuToggle.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
