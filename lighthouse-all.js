/* lighthouse-all.js
 * Combined script for Lighthouse HTML export.
 * Merges: lighthouse-2.js, toc-collapse.js, external-links.js,
 *         cite-toggle.js, and toc-top (scroll-to-top for TOC "↑ Top" link).
 *
 * Load order within this file matches the original defer-load order:
 *   1. lighthouse-2.js  (hamburger, overlay, NLA notice, drawer wiring)
 *   2. toc-collapse.js  (collapsible TOC entries)
 *   3. external-links.js
 *   4. cite-toggle.js   (cite / aside / cmtry / addl / section-expander toggles)
 *   5. toc-top          (intercepts #top TOC link; hides spurious body heading)
 *
 * Usage in org-mode file header — replace the four separate script tags with:
 *   #+HTML_HEAD: <script src="lighthouse-all.js" defer></script>
 *
 * No external dependencies.
 */

(function () {

  /* ================================================================== *
   * 1. LIGHTHOUSE-2  —  hamburger, overlay, NLA notice, drawer
   * ================================================================== */

  function initLighthouse() {

    /* ---- Hamburger toggle button (top-left) ------------------------- */
    var menuToggle = document.getElementById("menu-toggle");
    if (!menuToggle) {
      menuToggle = document.createElement("button");
      menuToggle.id = "menu-toggle";
      menuToggle.setAttribute("aria-label", "Open table of contents");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-controls", "table-of-contents");
      menuToggle.innerHTML = "&#9776;";
      document.body.insertBefore(menuToggle, document.body.firstChild);
    }

    /* ---- Overlay (dims page when drawer is open) -------------------- */
    var overlay = document.getElementById("sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sidebar-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    /* ---- "Not a substitute for legal advice" notice ---------------- */
    var nlaNotice = document.getElementById("nla-notice");
    if (!nlaNotice) {
      nlaNotice = document.createElement("div");
      nlaNotice.id = "nla-notice";
      nlaNotice.innerHTML =
        'INCOMPLETE DRAFT — not a substitute for legal advice '
        + '(<a href="#k-bound-NLA">see&nbsp;2.1.14</a>)';
      document.body.insertBefore(nlaNotice, document.body.firstChild);
    }

    var contentEl = document.getElementById("content");

    function positionNlaNotice() {
      if (!contentEl) { return; }
      var rect = contentEl.getBoundingClientRect();
      var noticeWidth = nlaNotice.offsetWidth || 160;
      var gap = 12;
      var availableRight = window.innerWidth - rect.right;
      if (availableRight >= noticeWidth + gap) {
        nlaNotice.style.left  = (rect.right + gap) + "px";
        nlaNotice.style.right = "auto";
      } else {
        nlaNotice.style.left  = "auto";
        nlaNotice.style.right = "0.5rem";
      }
    }

    positionNlaNotice();
    nlaNotice.style.visibility = "visible";
    window.addEventListener("resize", positionNlaNotice);

    /* ---- Drawer open/close ----------------------------------------- */
    var toc = document.getElementById("table-of-contents");
    if (!toc) { return; }

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
      if (toc.classList.contains("show")) { closeDrawer(); } else { openDrawer(); }
    });

    overlay.addEventListener("click", closeDrawer);

    toc.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && !e.defaultPrevented) {
        closeDrawer();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toc.classList.contains("show")) {
        closeDrawer();
        menuToggle.focus();
      }
    });
  }


  /* ================================================================== *
   * 2. TOC-COLLAPSE  —  collapsible drawer entries
   * ================================================================== */

  function initTocCollapse() {

    var tocInner = document.getElementById("text-table-of-contents");
    if (!tocInner) { return; }

    var parentItems = tocInner.querySelectorAll("li > ul");

    parentItems.forEach(function (childList) {
      var li   = childList.parentElement;
      var link = li.querySelector(":scope > a");

      var triangle = document.createElement("span");
      triangle.className = "toc-toggle";
      triangle.setAttribute("role", "button");
      triangle.setAttribute("tabindex", "0");
      triangle.setAttribute("aria-expanded", "false");
      triangle.setAttribute("aria-label", "Expand section");
      triangle.textContent = "▶";

      childList.classList.add("toc-collapsed");

      function doToggle(e) {
        e.stopPropagation();
        var isOpen = childList.classList.toggle("toc-collapsed");
        var nowOpen = !isOpen;
        triangle.textContent = nowOpen ? "▼" : "▶";
        triangle.setAttribute("aria-expanded", nowOpen ? "true" : "false");
        triangle.setAttribute("aria-label",    nowOpen ? "Collapse section" : "Expand section");
      }

      triangle.addEventListener("click", doToggle);
      triangle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doToggle(e); }
      });

      if (link) {
        link.addEventListener("click", function (e) {
          if (childList.classList.contains("toc-collapsed")) {
            e.preventDefault();
            doToggle(e);
          }
        });
      }

      if (link) { li.insertBefore(triangle, link); } else { li.prepend(triangle); }
    });
  }


  /* ================================================================== *
   * 3. EXTERNAL-LINKS  —  open external links in new tab
   * ================================================================== */

  function initExternalLinks() {
    var currentHost = window.location.hostname;
    document.querySelectorAll("a[href]").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!/^https?:\/\//i.test(href)) { return; }
      try {
        var linkHost = new URL(href).hostname;
        if (linkHost && linkHost !== currentHost) {
          a.setAttribute("target", "_blank");
          a.setAttribute("rel", "noopener noreferrer");
        }
      } catch (e) { /* malformed URL — leave alone */ }
    });
  }



  /* ================================================================== *
   * 5. TOC-TOP  —  intercept #top TOC link; scroll to true top;
   *                hide the spurious "↑ Top" body heading
   * ================================================================== */

  function initTocTop() {
    /* Intercept the TOC link pointing to #top and scroll to true page top. */
    var tocLinks = document.querySelectorAll("#table-of-contents a");
    for (var i = 0; i < tocLinks.length; i++) {
      if (tocLinks[i].getAttribute("href") === "#top") {
        tocLinks[i].addEventListener("click", function (e) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "instant" });
        });
        break;
      }
    }

    /* Hide the "↑ Top" heading that org-mode renders in the document body. */
    var topHeading = document.getElementById("top");
    if (topHeading) {
      var wrapper = topHeading.closest("div[class^='outline-']");
      if (wrapper) { wrapper.style.display = "none"; }
    }
  }


  /* ================================================================== *
   * INIT  —  run everything on DOMContentLoaded
   * ================================================================== */

  function init() {
    initLighthouse();    /* must run first — wires up drawer close logic */
    initTocCollapse();   /* must run after initLighthouse */
    initExternalLinks();
/*    initCiteAll();       cite/aside/cmtry/addl/expander 
*/
    initTocTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
