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
        'Not a substitute for legal advice '
        + '(<a href="#k-bound-NLA">see&nbsp;2.1.10</a>)';
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
   * 4. CITE-TOGGLE  —  cite / aside / cmtry / addl / section-expander
   * ================================================================== */

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
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doToggle(); }
      });

      cite.innerHTML = "";
      cite.appendChild(toggle);
      cite.appendChild(content);
    });
  }

  function initAsideToggles() {
    /* <aside> elements render their content directly — no per-aside toggle.
       We wrap the content in an aside-content span (open by default) so that
       the global "hide all notes" control can reach it.
       IMPORTANT: move live child nodes rather than copying via innerHTML, so
       that event listeners attached by initCiteToggles are preserved. */
    document.querySelectorAll("aside").forEach(function (aside) {
      var content = document.createElement("span");
      content.className = "aside-content open";
      /* Move every existing child node into the wrapper span */
      while (aside.firstChild) {
        content.appendChild(aside.firstChild);
      }
      aside.appendChild(content);
    });
  }

  function initCmtryToggles() {
    document.querySelectorAll("div.cmtry").forEach(function (cmtry) {
      var heading = cmtry.querySelector("h5, h6");
      if (!heading) { return; }
      var body = cmtry.querySelector(
        "div.outline-text-5, div.outline-text-6, div.outline-text-7"
      );
      if (!body) { return; }

      var toggle = document.createElement("span");
      toggle.className = "aside-toggle cmtry-toggle";
      toggle.textContent = "Hide note";
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");
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
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doToggle(); }
      });

      toggle.textContent = "Hide note";
      toggle.setAttribute("aria-expanded", "true");
      heading.replaceWith(toggle);
    });
  }

  function initAddlToggles() {
    document.querySelectorAll("div.addl").forEach(function (addl) {
      var heading = addl.querySelector("h3, h4, h5, h6");
      if (!heading) { return; }
      var parent = addl.parentElement;
      if (!parent) { return; }

      function outlineLevel(el) {
        var m = (el.className || "").match(/outline-(\d+)/);
        return m ? parseInt(m[1], 10) : 999;
      }
      var addlLevel = outlineLevel(addl);

      var bodyNodes = [];
      var allChildren = Array.prototype.slice.call(addl.children);
      var headingIndex = allChildren.indexOf(heading);
      allChildren.slice(headingIndex + 1).forEach(function (child) {
        bodyNodes.push(child);
      });

      var siblingsToMove = [];
      var sib = addl.nextElementSibling;
      while (sib) {
        if (outlineLevel(sib) <= addlLevel) { break; }
        siblingsToMove.push(sib);
        sib = sib.nextElementSibling;
      }
      siblingsToMove.forEach(function (s) { bodyNodes.push(s); });

      if (bodyNodes.length === 0) { return; }

      var body = document.createElement("div");
      body.className = "addl-body";
      bodyNodes.forEach(function (node) { body.appendChild(node); });
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
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doToggle(); }
      });

      heading.appendChild(toggle);
    });
  }

  function initSectionExpanders() {
    document.querySelectorAll("div.pr-top").forEach(function (section) {
      var toggles = section.querySelectorAll(".aside-toggle, .addl-toggle");
      if (toggles.length === 0) { return; }

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
            var addl = toggle.closest("div.addl");
            if (!addl) { return; }
            var body = addl.nextElementSibling;
            if (!body || !body.classList.contains("addl-body")) { return; }
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
            var content = toggle.classList.contains("cite-toggle")
              ? toggle.nextElementSibling
              : toggle.previousElementSibling;
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
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doExpand(); }
      });

      toggles.forEach(function (toggle) {
        toggle.addEventListener("click", updateLabel);
      });

      updateLabel();

      var wrapper = document.createElement("div");
      wrapper.className = "section-expander-wrapper";
      wrapper.appendChild(expander);
      heading.insertAdjacentElement("afterend", wrapper);
    });
  }

  /* ------------------------------------------------------------------ *
   * HIDE ALL NOTES — injects a global toggle into the .hlt bar
   *
   * Targets every note-type the page uses:
   *   • aside-content spans  (inside <aside>)
   *   • addl-body divs        (Field Notes)
   *   • cmtry body divs       (commentary outline-text-* inside .cmtry)
   *
   * The control is appended to the first .hlt element found; if none
   * exists it is prepended to #content.
   * ------------------------------------------------------------------ */
  function initHideAllNotes() {

    /* Collect all note bodies that should respond to the global toggle.
       Called fresh each time so late-initialised bodies are included. */
    function allNoteBodies() {
      var bodies = [];
      /* aside-content spans */
      document.querySelectorAll(".aside-content").forEach(function (el) {
        bodies.push({ type: "aside", el: el });
      });
      /* addl-body divs — skip any that have no corresponding addl-toggle
         (edge case: empty field-note sections) */
      document.querySelectorAll("div.addl-body").forEach(function (el) {
        bodies.push({ type: "addl", el: el });
      });
      /* cmtry outline-text divs */
      document.querySelectorAll(
        "div.cmtry div.outline-text-5, div.cmtry div.outline-text-6, div.cmtry div.outline-text-7"
      ).forEach(function (el) {
        bodies.push({ type: "cmtry", el: el });
      });
      return bodies;
    }

    function allVisible(bodies) {
      return bodies.every(function (b) {
        if (b.type === "aside") { return b.el.classList.contains("open"); }
        if (b.type === "addl")  { return b.el.style.display !== "none"; }
        if (b.type === "cmtry") { return b.el.style.display !== "none"; }
        return true;
      });
    }

    /* Sync the addl-toggle buttons so their per-note labels stay accurate */
    function syncAddlToggles(showing) {
      document.querySelectorAll("[data-addl-toggle='true']").forEach(function (t) {
        t.textContent = showing ? "[ hide note ]" : "[ show note ]";
        t.setAttribute("aria-expanded", showing ? "true" : "false");
      });
      document.querySelectorAll("[data-cmtry-toggle='true']").forEach(function (t) {
        t.textContent = showing ? "Hide note" : "Show note";
        t.setAttribute("aria-expanded", showing ? "true" : "false");
      });
      /* Section expanders ([ expand/collapse notes ]) */
      document.querySelectorAll(".section-expander").forEach(function (se) {
        se.textContent = showing ? "[ collapse notes ]" : "[ expand notes ]";
      });
    }

    function setAllNotes(show) {
      allNoteBodies().forEach(function (b) {
        if (b.type === "aside") {
          if (show) { b.el.classList.add("open"); }
          else      { b.el.classList.remove("open"); }
        } else {
          b.el.style.display = show ? "" : "none";
        }
      });
      syncAddlToggles(show);
    }

    function updateLabel() {
      var bodies = allNoteBodies();
      if (bodies.length === 0) { return; }
      var showing = allVisible(bodies);
      globalToggle.textContent = showing ? "[ hide all notes ]" : "[ show all notes ]";
      globalToggle.setAttribute("aria-expanded", showing ? "true" : "false");
    }

    var globalToggle = document.createElement("span");
    globalToggle.id = "global-notes-toggle";
    globalToggle.setAttribute("role", "button");
    globalToggle.setAttribute("tabindex", "0");

    function doToggle() {
      var showing = allVisible(allNoteBodies());
      setAllNotes(!showing);
      updateLabel();
    }
    globalToggle.addEventListener("click", doToggle);
    globalToggle.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doToggle(); }
    });

    /* Insert into .hlt bar if present; otherwise prepend to #content */
    var hlt = document.querySelector(".hlt");
    if (hlt) {
      /* Add a separator then the toggle link */
      var sep = document.createTextNode(" | ");
      hlt.appendChild(sep);
      hlt.appendChild(globalToggle);
    } else {
      var wrapper = document.createElement("div");
      wrapper.style.cssText = "margin-bottom:1em;font-size:0.85rem;";
      wrapper.appendChild(globalToggle);
      var content = document.getElementById("content");
      if (content) { content.insertBefore(wrapper, content.firstChild); }
      else { document.body.insertBefore(wrapper, document.body.firstChild); }
    }

    updateLabel();

    /* Re-check label whenever any individual note toggle fires */
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (
        t.classList.contains("aside-toggle") ||
        t.classList.contains("addl-toggle")  ||
        t.classList.contains("section-expander")
      ) {
        /* defer so the toggle's own handler runs first */
        setTimeout(updateLabel, 0);
      }
    });
  }

  function initCiteAll() {
    initCiteToggles();
/*    initAsideToggles(); */
    initCmtryToggles();
    initAddlToggles();
    initSectionExpanders();
    initHideAllNotes();   /* global toggle — must run after all others */
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
    initCiteAll();       /* cite/aside/cmtry/addl/expander */
    initTocTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
