/* diamond-lane.js — the site's one script (replaces lighthouse-all.js and copy-rule.js).
 *
 *   Part 1  Page furniture: hamburger menu, overlay, "incomplete draft" notice (centered over the
 *           content column), collapsible drawer TOC, external links, #top handling.
 *   Part 2  Clause tools: collapsible "Comment" blocks (with a "Show all comments" link in the
 *           notice), "Add to Addendum" buttons + panel, Addendum builder (HTML / print / PDF),
 *           shareable ?addendum= links, Word (.docx) export.
 *
 * Pair it with diamond-lane.css. The Word export loads docx.iife.js (a separate library file)
 * only when someone clicks "Word (.docx)" on a built Addendum.
 *
 * Org-mode setup file:
 *   #+HTML_HEAD: <link rel="stylesheet" type="text/css" href="./diamond-lane.css">
 *   #+HTML_HEAD: <script src="diamond-lane.js" defer></script>
 */

/* ==================================================================== *
 * PART 1 - PAGE FURNITURE
 * ==================================================================== */
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

    /* Position the notice to the side of the content column (to the right, or wrapped to the
       corner if there isn't room), so it never sits over the page's own top line — important now
       that clicking a link to a Clause can land right at the top of the viewport. */
    function positionNlaNotice() {
      if (!contentEl) { return; }
      var rect = contentEl.getBoundingClientRect();
      var noticeWidth = nlaNotice.offsetWidth || 160;
      var gap = 12;
      var availableRight = window.innerWidth - rect.right;
      nlaNotice.style.transform = "none";
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
    /* Org generates the detailed whole-document TOC inside .toc-det.
       Keep that TOC in the document, and clone it for the hamburger drawer. */
    var detailedToc = document.querySelector(".toc-det nav[role='doc-toc']");
    if (!detailedToc) { return; }

    var toc = document.getElementById("lighthouse-toc");
    if (!toc) {
      toc = detailedToc.cloneNode(true);
      toc.id = "lighthouse-toc";

      /* Avoid duplicating Org's inner TOC id in the cloned drawer. */
      var clonedInner = toc.querySelector("#text-table-of-contents");
      if (clonedInner) { clonedInner.id = "lighthouse-toc-inner"; }

      document.body.appendChild(toc);
    }

    menuToggle.setAttribute("aria-controls", "lighthouse-toc");

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

    var tocInner = document.getElementById("lighthouse-toc-inner");
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
      triangle.textContent = "▸";

      childList.classList.add("toc-collapsed");

      function doToggle(e) {
        e.stopPropagation();
        var isOpen = childList.classList.toggle("toc-collapsed");
        var nowOpen = !isOpen;
        triangle.textContent = nowOpen ? "▾" : "▸";
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
   * 4. TOC-TOP  —  intercept #top TOC link; scroll to true top;
   *                hide the spurious "↑ Top" body heading
   * ================================================================== */

  function initTocTop() {
    /* Intercept the TOC link pointing to #top and scroll to true page top. */
    var tocLinks = document.querySelectorAll("#lighthouse-toc a");
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
    initTocTop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();

/* ==================================================================== *
 * PART 2 - CLAUSE TOOLS (comments, Addendum, Word export)
 *
 * Settings are in CONFIG just below. Class names starting cr- / copy-rule- are this part's own.
 * ==================================================================== */
(function () {
  'use strict';

  var CONFIG = {
    // A Clause is any element with this class (Org's :HTML_CONTAINER_CLASS: pr-top).
    ruleContainerSelector: '.pr-top',
    // Inside a Clause, the operative language may be boxed off in one or more of these ("Clause
    // text" in Org, :HTML_CONTAINER_CLASS: pr-txt) rather than filling the whole Clause. See
    // extractOperativeContent.
    clauseTextSelector: '.pr-txt',
    // Show each such box's own inherited section number (e.g. "4.1.1") live on the page, not just
    // when an Addendum or record copy is built. false leaves the box's on-page heading as written
    // (the number is still added when a document is built, either way).
    numberClauseTextHeadings: true,
    // A chapter (its own <hN> heading's container) carrying BOTH these classes gets a button in
    // its title that adds every Clause in that chapter to the Addendum in one click (and removes
    // them again on a second click). Chapters without "addn" are unaffected.
    chapterAddendumSelector: '.chap.addn',
    // A trailing tag on a Clause's own title, kept on the live page but dropped everywhere a built
    // document (Addendum, record copy, Word) shows or lists that title — e.g. "Entire Agreement
    // Clause (and notes)" becomes "Entire Agreement Clause". Case-insensitive; add more as needed.
    titleSuffixesToStrip: ['(and notes)'],

    // Text put in front of the Rule title in the copy ('' for none).
    titlePrefix: 'ADDENDUM: ',
    // Drop the Rule's own section number ("4.1.") from its title. Sub-provision numbers
    // ("4.1.1.") are kept by stripSectionNumbers: false.
    stripRuleTitleNumber: true,

    // Certification inserted right after the title (HTML allowed; '' to disable).
    // {date} = the copier's local date as YYYY-MM-DD; {rule} = the Clause's section number,
    // e.g. "4.1"; {url} = link to that Clause on the published site. If the Clause has no number, legendNoNumberHtml is used instead. To restore emphasis, wrap text in <i>/<b>.
    legendHtml: 'Copied and pasted {date} from <a href="{url}">Clause {rule}</a> of the Diamond Lane Clauses at ' +
                '<a href="https://diamondlaneclauses.org">https://diamondlaneclauses.org</a> \u2014 ' +
                'each party certifies that it has not changed the text below ' +
                'from the Diamond Lane version without redlining it.',
    legendNoNumberHtml: 'Copied and pasted {date} from the Diamond Lane Clauses at ' +
                '<a href="https://diamondlaneclauses.org">https://diamondlaneclauses.org</a> \u2014 ' +
                'each party certifies that it has not changed the text below ' +
                'from the Diamond Lane version without redlining it.',

    // Last line of the copy ('' for none).
    endMarker: '[END OF ADDENDUM]',

    // Plain output: headings become paragraphs; bold/italic/size/font/class/id are dropped.
    // Only paragraphs, lists, tables and hyperlinks survive.
    plainFormatting: true,
    // Addendum only (HTML / print / Word): keep bold, italic and the brown "variable" text
    // (span.v on the site). The single-Clause copy stays plain.
    addendumKeepFormatting: true,
    variableClass: 'v',         // class of the brown text on the site
    variableColor: 'brown',     // colour used for it in the Addendum

    // Visible-text renames applied to the copied text (not to link addresses). Case-sensitive
    // on purpose: lowercase "rule" (as in "overrule", "the general rule") is left alone.
    // The published text now says "Clause" itself, so this is empty: the copy is verbatim.
    // Example, if ever needed:  [[/\bRules?\b/g, 'Clause']]
    termReplacements: [],

    // Comments: each .cmtry block shows only its heading ("Comment") at first; clicking the
    // heading shows or hides the text under it. A page-level control ("Show all comments" /
    // "Hide all comments") opens or closes them all. This changes only what the browser displays, never
    // what is copied or put in an Addendum.
    commentToggles: true,
    commentSelector: '.cmtry',
    commentsCollapsedOnLoad: true,   // false = everything starts open (then also delete the hide rule in diamond-lane.css)
    // "Show all comments" / "Hide all comments" is added as a link inside the yellow notice that
    // Part 1 of this file puts at the top of the page (element id below). On narrow screens, where the
    // site hides that notice, a plain button under the page title is used instead.
    globalToggle: true,
    noticeId: 'nla-notice',

    // "Add to Addendum" button + "Build Addendum": collect Clauses, then compile them into one
    // standalone HTML page (Print / Save as PDF from there). Runs entirely in the browser.
    addendumButton: true,
    addendumTitle: 'Diamond Lane Custom Clause Addendum',
    // {date} = generation date (YYYY-MM-DD); {count} = number of Clauses.
    // "Show Clauses Only": a live reading-mode toggle, next to the full-document button. Hides,
    // for every Clause written with "Clause text" boxes, everything except the Clause's own title
    // and those boxes — the same material a built Addendum or record copy already leaves out
    // (explanatory framing prose, "Clause text" labels, comments, additional material, contents
    // lists). A Clause with no boxes (the older style) is untouched either way, since for it
    // there's no separate framing layer to hide.
    clausesOnlyLabel: 'Clauses only',
    clausesOnlyActiveLabel: 'Clauses + notes',
    // "Build Full Document": every Clause on the page, top to bottom, no selection needed.
    fullDocButtonLabel: 'Create record copy w/ all Clauses',
    fullDocTitle: 'The Diamond Lane Clauses',
    // {timestamp} = UTC date/time when built, e.g. "2026-09-21 21:47 UTC". {url} = the site link below.
    fullDocSubtitleHtml: 'Downloaded {timestamp} from <a href="{url}">{url}</a>',
    fullDocUrl: 'https://diamondlaneclauses.org',
    fullDocFileBase: 'Diamond-Lane-Clauses',

    // {timestamp} = UTC date/time when built, e.g. "2026-09-29 19:50 UTC"; {count} = number of
    // Clauses included.
    addendumPrefaceHtml: 'Generated {timestamp} (without annotations) from the Diamond Lane Clauses at ' +
                '<a href="https://diamondlaneclauses.org">https://diamondlaneclauses.org</a> \u2014 ' +
                'each party certifies that it has not changed the text below ' +
                'from the Diamond Lane version without redlining it.',
    contentsLabel: 'Clauses included:',   // list of the included Clauses under the preface ('' = no list)
    // Build Full Document only: group Clauses under the chapter (<h2>) each one falls under on the
    // live page, in document order. Each chapter starts on a new page, with its own title and a
    // local table of contents (Clauses only, not their numbered sub-provisions).
    groupIntoChapters: true,
    chapterTitleHtml: 'Chapter {num}&nbsp;&nbsp;&nbsp;{title}',
    chapterContentsLabel: 'Clauses in this chapter:',
    // Full-Document main table of contents lists chapters, not individual Clauses.
    fullDocContentsLabel: 'Chapters:',
    // Body text (paragraphs, lists, the "Source:" line, contents lists) in the generated page.
    bodyFont: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    bodyFontSize: '13pt',
    bodyLineHeight: '1.6',
    bodyParagraphSpacing: '1.1em',   // space below each paragraph
    // Headings are <h1> ADDENDUM/full-document title, <h2 class="chapter-title"> chapter (Build
    // Full Document only), <h2 class="clause-title"> Clause title, <h3 class="section-heading">
    // numbered sub-provisions. Keep these in descending order: addendumTitleSize > chapterTitleSize
    // > clauseTitleSize > the section-heading size set on .section-heading below — which in turn
    // should stay a bit above bodyFontSize, so a section heading still reads as a heading.
    addendumTitleSize: '22pt',
    chapterTitleSize: '21pt',
    clauseTitleSize: '17pt',
    // Font for the numbered sub-provision headings (h3.section-heading in the generated page).
    provisionHeadingFont: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    sourceLabel: 'Source: ',    // printed before the source URL under each Clause heading
    pageBreakBetweenClauses: false,
    undoSeconds: 20,            // how long the "Undo" link stays after Clear
    addendumStorageKey: 'diamondLaneAddendum',   // where the list is remembered in this browser
    // Word export loads this library the first time it is used. Upload docx.iife.js (docx 9.7.1)
    // to your site. To use a CDN instead: 'https://cdn.jsdelivr.net/npm/docx@9.7.1/dist/index.iife.js'
    docxLibUrl: 'docx.iife.js',   // self-hosted; resolved relative to the PAGE, so upload it next to index.html
    docxFont: 'Times New Roman',

    // Copy Clause button. Off by design: lawyers use "Clause Only", then copy and paste, which adds
    // a little friction against editing the Clause text. (An earlier build silently dropped this
    // setting, which is why the button vanished; it is now explicit.)
    autoButtons: false,

    stripSectionNumbers: false, // true drops ALL section numbers from the copy
    stripFootnoteRefs: true,    // footnote refs would otherwise paste as stray digits
    stripSoftHyphens: true,     // remove U+00AD (&shy;) so Word text stays searchable
    // Internal links (href="#...") become absolute links into the published Protocol.
    // Set to '' to strip them to plain text instead.
    internalLinkBase: 'https://diamondlaneclauses.org/',
    removeSelectors: [          // everything matching is deleted from the copy
      '[class~="cmtry"]',       // commentary (any element, incl. Org's outline-N cmtry containers)
      '[role="doc-toc"]',       // every table of contents, at any depth
      '.addl',                  // additional-material blocks (any element)
      // Added by page scripts (toggle buttons, wrappers) or annotations, never Clause text:
      '.addl-body', '.addl-toggle',
      '.see-addl',              // "(See also the additional notes at § …)" pointers
      '.section-expander', '.section-expander-wrapper',
      'cite', 'aside', '.cite-toggle', '.aside-toggle',
      '.copy-rule-btn',
      '[data-copy-rule]',
      '.copy-rule-add',
      '[data-add-addendum]',
      '.cr-chapter-add',
      '[data-chapter-addn]',
      '.tag',
      'script', 'style', 'noscript'
    ]
  };

  var HEADING = 'h1,h2,h3,h4,h5,h6';
  var INLINE = 'b,i,em,strong,u,span,code,tt,kbd,samp,var,cite,small,big,mark,del,ins,s,strike,sup,sub,font,abbr,q';
  var KEEP_ATTRS = { a: ['href'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'], ol: ['start'] };
  var WS = /[ \t\r\n]+/g;

  /* ---------- locate Rules ---------- */

  // Org sometimes nests a headline's deeper descendants inside its own container div, and
  // sometimes exports them as flat siblings of it instead (their nominal heading level is still
  // deeper, just not literally inside the parent's div). Everything below works from the
  // headings' OWN reading order and levels rather than assuming either shape, so it handles both
  // — and a document that mixes them.
  var _allHeadings = null;
  function allHeadingsInOrder() {
    if (!_allHeadings) _allHeadings = [].slice.call(document.querySelectorAll(HEADING));
    return _allHeadings;
  }

  // The nearest earlier heading (in reading order) that is shallower than h — h's chapter, or,
  // repeated, each further step up its logical ancestry — regardless of how the HTML nests them.
  function nearestShallowerHeading(h) {
    var all = allHeadingsInOrder(), idx = all.indexOf(h), lvl = +h.tagName.charAt(1);
    for (var i = idx - 1; i >= 0; i--) {
      if (+all[i].tagName.charAt(1) < lvl) return all[i];
    }
    return null;
  }

  // True if h's own logical ancestry (by level and reading order, not HTML nesting) passes through
  // another heading whose container also matches selector — regardless of how the HTML nests them.
  function hasAncestorMatching(h, selector) {
    var anc = nearestShallowerHeading(h);
    while (anc) {
      if (anc.parentElement && anc.parentElement.matches(selector)) return true;
      anc = nearestShallowerHeading(anc);
    }
    return false;
  }

  // A Clause is any .pr-top whose own container isn't itself sitting inside another Clause (that
  // would make it a distinct, already-nonexistent case now that "Clause text" boxes use their own
  // class — see CONFIG.clauseTextSelector — but the check is cheap insurance either way).
  function findRuleHeadings() {
    var out = [];
    document.querySelectorAll(CONFIG.ruleContainerSelector).forEach(function (box) {
      if (box.closest('[class~="cmtry"]')) return;
      var h = null;
      for (var c = box.firstElementChild; c; c = c.nextElementSibling) {
        if (/^H[1-6]$/.test(c.tagName)) { h = c; break; }
      }
      if (!h || !h.id) return;
      if (hasAncestorMatching(h, CONFIG.ruleContainerSelector)) return;
      out.push(h);
    });
    return out;
  }

  function headingForId(id) {
    var el = document.getElementById(id);
    return el ? el.closest(HEADING) : null;
  }

  // Org wraps heading + own text in <div class="outline-N ...">. Gathers h plus everything at a
  // deeper level up to the next heading at h's own level or shallower, whether that content is
  // nested inside h's container in the HTML or laid out as flat siblings of it.
  function cloneRule(h) {
    var p = h.parentElement, hasWrap = p && /(^|\s)outline-\d+(\s|$)/.test(p.className);
    var root = hasWrap ? p.cloneNode(true) : document.createElement('div');
    var covered = hasWrap ? [p] : [];
    if (!hasWrap) {
      root.appendChild(h.cloneNode(true));
      for (var s = h.nextElementSibling; s; s = s.nextElementSibling) {
        if (/^H[1-6]$/.test(s.tagName)) break;   // the sweep below picks up from here
        root.appendChild(s.cloneNode(true));
      }
    }
    var lvl = +h.tagName.charAt(1), all = allHeadingsInOrder(), idx = all.indexOf(h);
    for (var i = idx + 1; i < all.length; i++) {
      var hh = all[i], hl = +hh.tagName.charAt(1);
      if (hl <= lvl) break;
      var cont = hh.parentElement;
      if (covered.some(function (c) { return c && c.contains(cont); })) continue;   // already cloned
      var toAppend = (cont && /(^|\s)outline-\d+(\s|$)/.test(cont.className)) ? cont : hh;
      root.appendChild(toAppend.cloneNode(true));
      covered.push(toAppend);
    }
    return root;
  }

  // The section number of box's nearest numbered ancestor within root — e.g. "4.1.1" for a box
  // that sits under an unnumbered "Clause text" heading, itself under the numbered "4.1.1 ..."
  // heading. Your export nests genuinely from "4.1.1" downward, even though "4.1.1" itself sits as
  // a flat sibling of the Clause — so this walks root's headings in document order (however deep
  // each actually sits), not just root's direct children. Called after the Clause's own title
  // heading has already been moved out of root (see extractOperativeContent below), so root's own
  // headings never include it — nothing to exclude here.
  function numberedAncestor(root, box) {
    var boxHeading = box.firstElementChild;
    if (!boxHeading || !/^H[1-6]$/.test(boxHeading.tagName)) return '';
    var headings = [].slice.call(root.querySelectorAll(HEADING));
    var idx = headings.indexOf(boxHeading), minLvl = +boxHeading.tagName.charAt(1);
    for (var i = idx - 1; i >= 0; i--) {
      var hl = +headings[i].tagName.charAt(1);
      if (hl < minLvl) {
        var num = ruleNumber(headings[i]);
        if (num) return num;
        minLvl = hl;   // unnumbered (e.g. "Clause text"): keep climbing past it
      }
    }
    return '';
  }

  // Live-page counterpart of numberedAncestor: adds each "Clause text" box's own inherited number
  // (e.g. "4.1.1") to its heading on the page itself, once, on load — governed by
  // CONFIG.numberClauseTextHeadings. Marks each one it touches (data-cr-numbered) so a later
  // Addendum or record-copy build (extractOperativeContent) knows not to add it a second time.
  function addLiveSectionNumbers() {
    if (!CONFIG.numberClauseTextHeadings) return;
    document.querySelectorAll(CONFIG.clauseTextSelector).forEach(function (box) {
      var bh = box.firstElementChild;
      if (!bh || !/^H[1-6]$/.test(bh.tagName) || bh.hasAttribute('data-cr-numbered')) return;
      var anc = nearestShallowerHeading(bh), num = '';
      while (anc) {
        num = ruleNumber(anc);
        if (num) break;
        anc = nearestShallowerHeading(anc);   // unnumbered (e.g. "Clause text"): keep climbing
      }
      if (num) {
        bh.insertBefore(document.createTextNode(num + '. '), bh.firstChild);
        bh.setAttribute('data-cr-numbered', '');
      }
    });
  }

  // Some Clauses box off the operative language in one or more "Clause text" containers (Org's
  // pr-txt, CONFIG.clauseTextSelector), surrounded by explanatory prose that isn't part of the
  // Clause. When any such box exists, keep only the Clause's own title heading plus those boxes
  // (each with its own heading, marked so it styles as a section heading below), and drop
  // everything else. A Clause with no box is returned unchanged.
  function extractOperativeContent(root) {
    var raw = [].slice.call(root.querySelectorAll(CONFIG.clauseTextSelector));
    // Keep only the outermost boxes: a box nested inside ANOTHER box (rare) comes along with its
    // parent automatically, so don't also list it separately here.
    var boxes = raw.filter(function (b) {
      var anc = b.parentElement;
      while (anc && anc !== root) {
        if (anc.matches && anc.matches(CONFIG.clauseTextSelector)) return false;
        anc = anc.parentElement;
      }
      return true;
    });
    if (!boxes.length) return root;
    var frag = document.createElement('div'), title = root.firstElementChild;
    if (title && /^H[1-6]$/.test(title.tagName)) frag.appendChild(title);
    boxes.forEach(function (box) {
      var bh = box.firstElementChild;
      if (bh && /^H[1-6]$/.test(bh.tagName)) {
        bh.setAttribute('data-cr-section', '');
        // Already numbered live (addLiveSectionNumbers)? Don't prepend it again.
        var num = bh.hasAttribute('data-cr-numbered') ? '' : numberedAncestor(root, box);
        if (num) bh.insertBefore(document.createTextNode(num + '. '), bh.firstChild);
      }
      frag.appendChild(box);
    });
    return frag;
  }

  /* ---------- clean the copy ---------- */

  function remove(n) { if (n.parentNode) n.parentNode.removeChild(n); }

  function unwrap(el) {
    var p = el.parentNode;
    if (!p) return;
    while (el.firstChild) p.insertBefore(el.firstChild, el);
    p.removeChild(el);
  }

  function renameTerms(v) {
    CONFIG.termReplacements.forEach(function (r) { v = v.replace(r[0], r[1]); });
    return v;
  }

  // opts.addendum: keep the Clause's own number, no ADDENDUM prefix, keep heading tags.
  function clean(root, opts) {
    opts = opts || {};
    // 1. every table of contents (role="doc-toc") and its "Contents:" / "Table of contents:" label
    root.querySelectorAll('[role="doc-toc"]').forEach(function (toc) {
      var prev = toc.previousElementSibling;
      if (prev && prev.tagName === 'P' && /^\s*(table of )?contents:?\s*$/i.test(prev.textContent)) remove(prev);
    });
    // 2. delete unwanted elements (commentary etc.)
    root.querySelectorAll(CONFIG.removeSelectors.join(',')).forEach(remove);

    // 3. section numbers, footnote refs
    var title = root.querySelector(HEADING);
    if (CONFIG.stripSectionNumbers) {
      root.querySelectorAll('[class*="section-number-"]').forEach(remove);
    } else if (CONFIG.stripRuleTitleNumber && !opts.addendum && title) {
      title.querySelectorAll('[class*="section-number-"]').forEach(remove);
    }
    if (CONFIG.stripFootnoteRefs) {
      root.querySelectorAll('a.footref').forEach(function (a) { remove(a.closest('sup') || a); });
    }
    if (CONFIG.titlePrefix && title && !opts.addendum) {
      title.insertBefore(document.createTextNode(CONFIG.titlePrefix), title.firstChild);
    }

    // 4. links: keep them all. A link to another Clause included in THIS document (opts.idToAnchor)
    // points at that Clause's own anchor here; any other internal link becomes absolute so it still
    // works outside the page.
    root.querySelectorAll('a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href) { if (a.textContent.trim()) unwrap(a); else remove(a); return; }
      if (href.charAt(0) !== '#') return;
      var anchor = opts.idToAnchor && opts.idToAnchor[href.slice(1)];
      if (anchor) a.setAttribute('href', '#' + anchor);
      else if (CONFIG.internalLinkBase) a.setAttribute('href', CONFIG.internalLinkBase + href);
      else unwrap(a);
    });

    // 5. plain formatting: no inline styling, no headings, no wrapper divs
    var keepFmt = !!(opts.addendum && CONFIG.addendumKeepFormatting);
    function isVar(el) { return el.tagName === 'SPAN' && el.classList.contains(CONFIG.variableClass); }
    if (CONFIG.plainFormatting) {
      root.querySelectorAll(INLINE).forEach(function (el) {
        if (keepFmt && (/^(B|STRONG|I|EM)$/.test(el.tagName) || isVar(el))) return;
        unwrap(el);
      });
      if (!opts.addendum) root.querySelectorAll(HEADING).forEach(function (h) {
        var p = document.createElement('p');
        while (h.firstChild) p.appendChild(h.firstChild);
        h.parentNode.replaceChild(p, h);
      });
      root.querySelectorAll('div').forEach(unwrap);
    }

    // 6. strip id/class/style/etc. (data-cr-section is our own marker from extractOperativeContent,
    // read afterward by compileSections; keep it alive through this cleanup)
    [root].concat([].slice.call(root.querySelectorAll('*'))).forEach(function (n) {
      var keep = KEEP_ATTRS[n.tagName.toLowerCase()] || [], keepV = keepFmt && isVar(n);
      [].slice.call(n.attributes).forEach(function (at) {
        if (keep.indexOf(at.name) === -1 && at.name !== 'data-cr-section') n.removeAttribute(at.name);
      });
      if (keepV) n.setAttribute('class', 'v');
    });

    // 7. text tidying: merge text nodes, drop soft hyphens, collapse whitespace, trim block edges
    root.normalize();
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), t;
    while ((t = w.nextNode())) {
      var v = t.nodeValue;
      if (CONFIG.stripSoftHyphens) v = v.replace(/\u00AD/g, '');
      v = v.replace(WS, ' ');
      t.nodeValue = renameTerms(v);
    }
    root.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6').forEach(function (b) {
      var f = b.firstChild, l = b.lastChild;
      if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^ +/, '');
      if (l && l.nodeType === 3) l.nodeValue = l.nodeValue.replace(/ +$/, '');
    });

    // 8. drop empty shells (children before parents), e.g. the <p> that held a manual button
    [].slice.call(root.querySelectorAll('span,a,p,li,ul,ol')).reverse().forEach(function (n) {
      if (!n.textContent.trim() && !n.querySelector('img')) remove(n);
    });
    return root;
  }

  /* ---------- plain-text flavor ---------- */

  function textOf(el) { return el.textContent.replace(WS, ' ').trim(); }

  function listLines(list, depth, lines) {
    var n = 0, pad = new Array(depth + 1).join('    ');
    [].slice.call(list.children).forEach(function (li) {
      if (li.tagName !== 'LI') return;
      n++;
      var c = li.cloneNode(true);
      c.querySelectorAll('ul,ol').forEach(remove);
      lines.push(pad + (list.tagName === 'OL' ? n + '. ' : '\u2022 ') + textOf(c));
      [].slice.call(li.children).forEach(function (sub) {
        if (sub.tagName === 'UL' || sub.tagName === 'OL') listLines(sub, depth + 1, lines);
      });
    });
  }

  function plainText(root) {
    var blocks = [];
    [].slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeType === 3) { var s = n.nodeValue.replace(WS, ' ').trim(); if (s) blocks.push(s); return; }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'UL' || n.tagName === 'OL') {
        var lines = []; listLines(n, 0, lines); blocks.push(lines.join('\n'));
      } else if (n.tagName === 'TABLE') {
        blocks.push([].slice.call(n.querySelectorAll('tr')).map(function (tr) {
          return [].slice.call(tr.children).map(textOf).join('\t');
        }).join('\n'));
      } else {
        var s2 = textOf(n); if (s2) blocks.push(s2);
      }
    });
    return blocks.join('\n\n') + '\n';
  }

  // Local date as YYYY-MM-DD (local, not UTC, so evening copies don't roll to tomorrow).
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  // "4.1." in <span class="section-number-3">4.1.</span>  ->  "4.1"
  function ruleNumber(h) {
    var sp = h.querySelector('[class*="section-number-"]');
    return sp ? sp.textContent.replace(/[^0-9A-Za-z.\-]/g, '').replace(/\.+$/, '') : '';
  }

  // Build Full Document: the chapter that a Clause's own heading sits under — the nearest shallower
  // heading before it in reading order. Works whether or not the HTML actually nests the Clause
  // inside the chapter's own container (see the note above allHeadingsInOrder).
  function chapterHeadingFor(h) {
    return nearestShallowerHeading(h);
  }

  // A chapter heading's title text, with its own number ("6.") and any removed elements (comments,
  // buttons) stripped — e.g. "Payments" from "6.  Payments".
  // When every included Clause traces back to the SAME chapter, and that chapter is one marked
  // for this (CONFIG.chapterAddendumSelector, e.g. "Ground Rules Addendum"), its bare title (no
  // number, no "Chapter" word) — used to label this Addendum as that chapter's own package.
  // '' for an ordinary Addendum spanning several chapters, or none at all.
  function singleChapterTitleFor(ids) {
    if (!ids.length) return '';
    var chEls = ids.map(function (id) { var h = headingForId(id); return h && chapterHeadingFor(h); });
    var first = chEls[0];
    if (!first || !chEls.every(function (c) { return c === first; })) return '';
    if (!first.parentElement || !first.parentElement.matches(CONFIG.chapterAddendumSelector)) return '';
    return chapterTitleText(first);
  }

  function chapterTitleText(h) {
    var t = displayTitle(h), num = ruleNumber(h);
    if (num) t = t.replace(new RegExp('^' + num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.?\\s*'), '');
    return t;
  }

  function build(id) {
    var h = headingForId(id);
    if (!h) return null;
    var num = ruleNumber(h);               // read from the live heading, before cleaning
    var root = clean(cloneRule(h));
    [].slice.call(root.childNodes).forEach(function (n) {   // whitespace-only gaps between blocks
      if (n.nodeType === 3 && !n.nodeValue.trim()) remove(n);
    });
    var url = clauseUrl(h.id);
    var legend = (num
      ? CONFIG.legendHtml.replace(/\{rule\}/g, num).replace(/\{url\}/g, url)
      : CONFIG.legendNoNumberHtml).replace(/\{date\}/g, today());
    if (legend) {
      var lg = document.createElement('p');
      lg.innerHTML = legend;
      var first = root.firstElementChild;
      root.insertBefore(lg, first ? first.nextSibling : root.firstChild);
    }
    if (CONFIG.endMarker) {
      var end = document.createElement('p');
      end.textContent = CONFIG.endMarker;
      root.appendChild(end);
    }
    return {
      html: '<html><head><meta charset="utf-8"></head><body>' + root.innerHTML + '</body></html>',
      text: plainText(root)
    };
  }

  /* ---------- write to clipboard ---------- */

  function legacyCopy(text, html) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea'), prev = document.activeElement, ok = false;
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(ta);
      ta.select();
      function onCopy(e) {
        e.clipboardData.setData('text/html', html);
        e.clipboardData.setData('text/plain', text);
        e.preventDefault();
      }
      document.addEventListener('copy', onCopy);
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      document.removeEventListener('copy', onCopy);
      document.body.removeChild(ta);
      if (prev && prev.focus) prev.focus();
      ok ? resolve() : reject(new Error('execCommand copy failed'));
    });
  }

  function writeClipboard(payload) {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      var item = new ClipboardItem({
        'text/html': new Blob([payload.html], { type: 'text/html' }),
        'text/plain': new Blob([payload.text], { type: 'text/plain' })
      });
      return navigator.clipboard.write([item]).catch(function (err) {
        console.warn('CopyRule: clipboard.write failed, trying fallback', err);
        return legacyCopy(payload.text, payload.html);
      });
    }
    return legacyCopy(payload.text, payload.html);
  }

  /* ---------- UI ---------- */

  function flash(btn, state) {
    btn.setAttribute('data-state', state);
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.removeAttribute('data-state'); }, 1800);
  }

  /* ---------- addendum builder ("Add to Addendum" / "Build Addendum") ---------- */

  var state = { ids: [] };
  var panel = null;
  var msgHtml = '';
  var undoIds = null, undoTimer = null;

  function dropUndo() { undoIds = null; clearTimeout(undoTimer); }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clauseUrl(id) {
    return (CONFIG.internalLinkBase || 'https://diamondlaneclauses.org/') + '#' + encodeURIComponent(id);
  }

  function displayTitle(h) {
    var c = h.cloneNode(true);
    c.querySelectorAll(CONFIG.removeSelectors.join(',')).forEach(remove);
    var v = c.textContent;
    if (CONFIG.stripSoftHyphens) v = v.replace(/\u00AD/g, '');
    return renameTerms(v.replace(WS, ' ').trim());
  }

  // True only for ids of Clause headings (the heading inside a .pr-top container).
  function isClauseId(id) {
    var h = headingForId(id);
    return !!(h && h.id === id && h.parentElement && h.parentElement.matches(CONFIG.ruleContainerSelector));
  }

  function loadState() {
    try {
      var v = JSON.parse(localStorage.getItem(CONFIG.addendumStorageKey) || '[]');
      if (Array.isArray(v)) state.ids = v.filter(function (id) { return typeof id === 'string' && isClauseId(id); });
    } catch (e) { /* storage unavailable: list lives only until the page closes */ }
  }

  function saveState() {
    try { localStorage.setItem(CONFIG.addendumStorageKey, JSON.stringify(state.ids)); } catch (e) { }
  }

  function setMsg(html) {
    msgHtml = html || '';
    var m = panel && panel.querySelector('.cr-panel-msg');
    if (m) m.innerHTML = msgHtml;
  }

  function render() {
    [].slice.call(document.querySelectorAll('[data-add-addendum]')).forEach(function (b) {
      var on = state.ids.indexOf(b.getAttribute('data-add-addendum')) !== -1;
      var label = on ? 'Remove this Clause from the Addendum' : 'Add this Clause to the Addendum';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', label);
      b.title = label;
    });
    [].slice.call(document.querySelectorAll('[data-chapter-addn]')).forEach(function (b) {
      var chH = document.getElementById(b.getAttribute('data-chapter-addn'));
      var ids = chH ? clauseIdsInChapter(chH) : [];
      var on = ids.length > 0 && ids.every(function (id) { return state.ids.indexOf(id) !== -1; });
      var label = on ? 'Remove all Clauses in this chapter from the Addendum' : 'Add all Clauses in this chapter to the Addendum';
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', label);
      b.title = label;
    });
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'cr-panel';
      panel.setAttribute('aria-label', 'Addendum list');
      document.body.appendChild(panel);
    }
    if (!state.ids.length) {
      if (!undoIds) { panel.hidden = true; panel.innerHTML = ''; return; }
      panel.innerHTML = '<p class="cr-panel-msg" role="status"></p>';   // just the Undo message
      panel.hidden = false;
      setMsg(msgHtml);
      return;
    }
    var html = '<div class="cr-panel-head">Addendum (' + state.ids.length + ')</div><ol class="cr-panel-list">';
    state.ids.forEach(function (id, i) {
      var h = headingForId(id), a = ' data-cr-id="' + esc(id) + '"';
      html += '<li><span class="cr-panel-title">' + esc(h ? displayTitle(h) : id) + '</span>' +
        '<span class="cr-panel-ctl">' +
        '<button type="button" data-cr-act="up"' + a + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">\u2191</button>' +
        '<button type="button" data-cr-act="down"' + a + (i === state.ids.length - 1 ? ' disabled' : '') + ' aria-label="Move down">\u2193</button>' +
        '<button type="button" data-cr-act="remove"' + a + ' aria-label="Remove from Addendum">\u00d7</button>' +
        '</span></li>';
    });
    html += '</ol><div class="cr-panel-actions">' +
      '<button type="button" data-cr-act="build">Build Addendum</button>' +
      '<button type="button" data-cr-act="link">Copy Link</button>' +
      '<button type="button" data-cr-act="clear">Clear</button></div>' +
      '<p class="cr-panel-msg" role="status"></p>';
    panel.innerHTML = html;
    panel.hidden = false;
    setMsg(msgHtml);
  }

  function changed() { saveState(); render(); }

  function toggleId(id) {
    dropUndo();
    var i = state.ids.indexOf(id);
    if (i === -1) state.ids.push(id); else state.ids.splice(i, 1);
    setMsg('');
    changed();
  }

  // Every top-level Clause whose chapter is exactly chapterHeading (see chapterHeadingFor).
  function clauseIdsInChapter(chapterHeading) {
    return findRuleHeadings()
      .filter(function (h) { return chapterHeadingFor(h) === chapterHeading; })
      .map(function (h) { return h.id; });
  }

  // One click adds every Clause in the chapter that isn't already in the Addendum; if they're all
  // already in, the same click removes them instead (mirrors the per-Clause Add/Remove toggle).
  function toggleChapter(chapterHeading) {
    var ids = clauseIdsInChapter(chapterHeading);
    if (!ids.length) return;
    dropUndo();
    var allIn = ids.every(function (id) { return state.ids.indexOf(id) !== -1; });
    if (allIn) {
      state.ids = state.ids.filter(function (id) { return ids.indexOf(id) === -1; });
    } else {
      ids.forEach(function (id) { if (state.ids.indexOf(id) === -1) state.ids.push(id); });
    }
    setMsg('');
    changed();
  }

  function panelAction(el) {
    var act = el.getAttribute('data-cr-act'), id = el.getAttribute('data-cr-id'), i = state.ids.indexOf(id), t;
    setMsg('');
    if (act !== 'undo' && act !== 'clear') dropUndo();
    if (act === 'up' && i > 0) { t = state.ids[i - 1]; state.ids[i - 1] = id; state.ids[i] = t; }
    else if (act === 'down' && i > -1 && i < state.ids.length - 1) { t = state.ids[i + 1]; state.ids[i + 1] = id; state.ids[i] = t; }
    else if (act === 'remove' && i > -1) state.ids.splice(i, 1);
    else if (act === 'clear') {
      if (!state.ids.length) return;
      undoIds = state.ids.slice();
      state.ids = [];
      clearTimeout(undoTimer);
      undoTimer = setTimeout(function () { undoIds = null; msgHtml = ''; render(); }, CONFIG.undoSeconds * 1000);
      msgHtml = 'Cleared ' + undoIds.length + ' Clause' + (undoIds.length === 1 ? '' : 's') +
                '. <button type="button" data-cr-act="undo" style="margin-left:.4em">Undo</button>';
    } else if (act === 'undo') {
      if (!undoIds) return;
      state.ids = undoIds.filter(isClauseId);
      dropUndo();
      msgHtml = 'List restored.';
    }
    else if (act === 'build') { openAddendum(); return; }
    else if (act === 'buildall') { openFullDocument(); return; }
    else if (act === 'link') { copyLink(); return; }
    changed();
  }

  var DOC_CSS =
    'body{margin:0;background:#fff;color:#000;font:' + CONFIG.bodyFontSize + '/' + CONFIG.bodyLineHeight + ' ' + CONFIG.bodyFont + '}' +
    '.toolbar{position:sticky;top:0;padding:.6em 1em;background:#f1f3f7;border-bottom:1px solid #c9ceda;font:14px system-ui,sans-serif}' +
    '.toolbar button{margin-right:.5em;padding:.35em .9em;font:inherit;cursor:pointer}' +
    'main{max-width:7.5in;margin:0 auto;padding:.6in}' +
    'h1{font-size:' + CONFIG.addendumTitleSize + ';margin:0 0 .6em}' +
    '.chapter-title{font-size:' + CONFIG.chapterTitleSize + ';margin:0 0 .5em;break-after:avoid}' +
    '.clause-title{font-size:' + CONFIG.clauseTitleSize + ';margin:2.4em 0 .15em;break-after:avoid}' +
    '.chapter .clause-title:first-of-type{margin-top:1.2em}' +
    '.section-heading{font-family:' + CONFIG.provisionHeadingFont + ';font-size:14pt;font-weight:bold;font-style:normal;margin:1.3em 0 .35em;break-after:avoid}' +
    'h4,h5,h6{font-size:' + CONFIG.bodyFontSize + ';margin:1.1em 0 .35em;break-after:avoid}' +
    'p{margin:0 0 ' + CONFIG.bodyParagraphSpacing + '}' +
    'li{margin:0 0 .4em}' +
    '.src{margin:0 0 .9em;font-size:10.5pt;color:#333;overflow-wrap:anywhere}' +
    '.end{margin-top:2em}' +
    '.v{color:' + CONFIG.variableColor + '}#wordmsg{margin-left:.5em;font-size:13px}' +
    '.toc-label{margin-bottom:.3em}.toc{list-style:none;margin:0 0 1.4em;padding-left:1.3em}' +
    '.toc li{margin:.25em 0}.toc a{text-decoration:none}' +
    'a{color:inherit;text-decoration:underline}' +
    '@page{margin:.9in}' +
    '@media print{.no-print{display:none!important}main{max-width:none;padding:0}}';

  // One cleaned DOM tree per selected Clause: <h2 class="clause-title"> heading, "Source:" line,
  // then the Clause text (numbered sub-provisions get class="section-heading"). opts.idToAnchor,
  // when given, rewrites "#..." links that target another included Clause to point at that
  // Clause's own anchor within this document, instead of out to the published site.
  // Removes a configured trailing tag (CONFIG.titleSuffixesToStrip), such as "(and notes)", from a
  // Clause's own compiled title heading — e.g. a trailing "<i>(and notes)</i>" — along with the
  // whitespace before it. Left alone if the title doesn't end with one of those exact tags.
  function stripTitleSuffixes(heading) {
    var suffixes = CONFIG.titleSuffixesToStrip || [];
    if (!suffixes.length) return;
    while (heading.lastChild && heading.lastChild.nodeType === 3 && !heading.lastChild.nodeValue.trim()) {
      heading.removeChild(heading.lastChild);
    }
    var last = heading.lastChild;
    if (!last) return;
    var text = (last.textContent || '').trim().toLowerCase();
    var hit = suffixes.some(function (s) { return text === s.toLowerCase(); });
    if (!hit) return;
    heading.removeChild(last);
    while (heading.lastChild && heading.lastChild.nodeType === 3 && !heading.lastChild.nodeValue.trim()) {
      heading.removeChild(heading.lastChild);
    }
    if (heading.lastChild && heading.lastChild.nodeType === 3) {
      heading.lastChild.nodeValue = heading.lastChild.nodeValue.replace(/\s+$/, '');
    }
  }

  function compileSections(ids, opts) {
    opts = opts || {};
    var out = [];
    (ids || state.ids).forEach(function (id) {
      var h = headingForId(id);
      if (!h) return;
      var base = +h.tagName.charAt(1);
      var root = clean(extractOperativeContent(cloneRule(h)), { addendum: true, idToAnchor: opts.idToAnchor });
      [].slice.call(root.childNodes).forEach(function (x) {
        if (x.nodeType === 3 && !x.nodeValue.trim()) remove(x);
      });
      // Clause heading becomes <h2>; sub-provision headings shift down with it.
      [].slice.call(root.querySelectorAll(HEADING)).forEach(function (x) {
        var offset = +x.tagName.charAt(1) - base;
        var e = document.createElement('h' + Math.min(6, Math.max(2, offset + 2)));
        if (offset === 0) e.className = 'clause-title';
        else if (offset === 1 || x.hasAttribute('data-cr-section')) e.className = 'section-heading';
        while (x.firstChild) e.appendChild(x.firstChild);
        if (offset === 0) stripTitleSuffixes(e);
        x.parentNode.replaceChild(e, x);
      });
      var url = clauseUrl(id), src = document.createElement('p');
      src.className = 'src';
      src.innerHTML = esc(CONFIG.sourceLabel) + '<a href="' + esc(url) + '">' + esc(url) + '</a>';
      var head = root.firstElementChild;
      root.insertBefore(src, head ? head.nextSibling : root.firstChild);
      out.push(root);
    });
    return out;
  }

  function clauseTitle(root) {
    var h = root.querySelector('h2');
    return h ? h.textContent.replace(WS, ' ').trim() : '';
  }

  function prefaceHtml(n, date) {
    return CONFIG.addendumPrefaceHtml.replace(/\{date\}/g, date || today())
      .replace(/\{timestamp\}/g, utcStamp())
      .replace(/\{count\}/g, n);
  }

  // "2026-09-21 21:47 UTC"
  function utcStamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' +
      p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ' UTC';
  }

  // Every Clause on the page, top to bottom (document order), regardless of the Addendum list.
  function allClauseIds() {
    return findRuleHeadings().map(function (h) { return h.id; });
  }

  // Groups ids into consecutive runs that share the same chapter heading (the live page's <h2>
  // one level above the Clause's own heading). A run whose Clauses have no chapter (chapterEl null)
  // is a group too, just one that gets no chapter title, local contents list, or page break.
  // Groups ids into consecutive runs that share the same chapter heading (the live page's <h2>
  // one level above the Clause's own heading). A run whose Clauses have no chapter (chEl null) is
  // a group too, just one that gets no chapter title, local contents list, or forced page break.
  function groupByChapter(ids) {
    var groups = [], cur = null;
    ids.forEach(function (id) {
      var h = headingForId(id), chEl = h && chapterHeadingFor(h);
      if (!cur || cur.chEl !== chEl) { cur = { chEl: chEl, ids: [] }; groups.push(cur); }
      cur.ids.push(id);
    });
    return groups;
  }

  function buildAddendumHtml(opts) {
    opts = opts || {};
    var ids = (opts.ids || state.ids).slice(), date = today();
    var title = opts.title || CONFIG.addendumTitle;
    var preface = opts.prefaceHtml || prefaceHtml(ids.length, date);
    var endMarker = 'endMarker' in opts ? opts.endMarker : CONFIG.endMarker;
    var fileBase = opts.fileBase || 'Addendum';
    var chaptered = !!(opts.fullDocument && CONFIG.groupIntoChapters);
    if (!ids.length) return '';

    // Anchor ids ("clause-N") are assigned up front, by position in the whole document, so a
    // cross-reference to a later Clause can be rewritten before that Clause is even reached.
    var idToAnchor = {};
    ids.forEach(function (id, i) { idToAnchor[id] = 'clause-' + (i + 1); });
    var linkMap = opts.fullDocument ? idToAnchor : null;

    var groups = chaptered ? groupByChapter(ids) : [{ chEl: null, ids: ids }];
    var sections = [], mainToc = [], n = 0;
    groups.forEach(function (g) {
      var roots = compileSections(g.ids, { idToAnchor: linkMap });
      var clauses = roots.map(function (root) {
        n++;
        var html = '<section class="clause" id="clause-' + n + '"' +
          (CONFIG.pageBreakBetweenClauses && n > 1 ? ' style="break-before:page"' : '') +
          '>' + root.innerHTML + '</section>';
        return { html: html, title: clauseTitle(root), anchor: 'clause-' + n };
      });
      if (g.chEl) {
        var chNum = ruleNumber(g.chEl), chTitle = chapterTitleText(g.chEl);
        var chAnchor = 'chapter-' + (mainToc.length + 1);
        mainToc.push({ anchor: chAnchor, label: esc(chNum) + '. ' + esc(chTitle) });
        var localToc = '<p class="toc-label">' + esc(CONFIG.chapterContentsLabel) + '</p><ul class="toc">' +
          clauses.map(function (c) { return '<li><a href="#' + c.anchor + '">' + esc(c.title) + '</a></li>'; }).join('') +
          '</ul>';
        sections.push('<section class="chapter" id="' + chAnchor + '"' +
          (mainToc.length > 1 ? ' style="break-before:page"' : '') + '>' +
          '<h2 class="chapter-title">' + CONFIG.chapterTitleHtml.replace(/\{num\}/g, esc(chNum)).replace(/\{title\}/g, esc(chTitle)) + '</h2>' +
          localToc + clauses.map(function (c) { return c.html; }).join('\n') + '</section>');
      } else {
        clauses.forEach(function (c) {
          if (!chaptered) mainToc.push({ anchor: c.anchor, label: esc(c.title) });
          sections.push(c.html);
        });
      }
    });

    // When this Addendum is exactly one "chapter-add" chapter's worth of Clauses, label the
    // contents list with that chapter's own title (no number, no "Chapter" word) and repeat it as
    // a heading right after the list, identifying this Addendum as that chapter's package.
    var singleChapterTitle = opts.fullDocument ? '' : singleChapterTitleFor(ids);
    var tocLabel = chaptered ? CONFIG.fullDocContentsLabel : (singleChapterTitle || CONFIG.contentsLabel);
    var toc = (tocLabel && mainToc.length)
      ? '<p class="toc-label">' + esc(tocLabel) + '</p><ul class="toc">' +
        mainToc.map(function (t) { return '<li><a href="#' + t.anchor + '">' + t.label + '</a></li>'; }).join('') + '</ul>'
      : '';
    var chapterHeadingHtml = singleChapterTitle ? '<h2 class="chapter-title">' + esc(singleChapterTitle) + '</h2>' : '';
    var dl = fileBase + '-' + date + '.html', wf = fileBase + '-' + date + '.docx';
    var showWord = !opts.fullDocument;   // full document is print/PDF or HTML only, for now
    // "Download HTML": saves this page without the toolbar and scripts.
    var script = '(function(){var b=document.getElementById("dl");if(!b)return;' +
      'b.addEventListener("click",function(){var c=document.documentElement.cloneNode(true);' +
      '["#bar","script"].forEach(function(s){var n=c.querySelector(s);if(n)n.parentNode.removeChild(n);});' +
      'var u=URL.createObjectURL(new Blob(["<!doctype html>"+c.outerHTML],{type:"text/html"}));' +
      'var a=document.createElement("a");a.href=u;a.download=b.getAttribute("data-file");' +
      'document.body.appendChild(a);a.click();document.body.removeChild(a);});})();';
    // "Word (.docx)": asks the page that built this Addendum (window.opener) to create the file.
    if (showWord) script += '(function(){var w=document.getElementById("word");if(!w)return;var m=document.getElementById("wordmsg");' +
      'w.addEventListener("click",function(){var o;' +
      'try{o=window.opener;if(!o||o.closed||!o.CopyRule||!o.CopyRule.wordFile)throw 0;}catch(e){' +
      'm.textContent="Word export needs the page that built this Addendum to still be open (and to be the published site, not a local file).";return;}' +
      'var t=w.textContent;w.disabled=true;w.textContent="Preparing\u2026";m.textContent="";' +
      'o.CopyRule.wordFile(' + JSON.stringify(ids).replace(/</g, '\\u003c') + ',' + JSON.stringify(date) + ').then(function(b){' +
      'var a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=w.getAttribute("data-file");' +
      'document.body.appendChild(a);a.click();document.body.removeChild(a);' +
      '}).catch(function(e){m.textContent="Could not create the Word file: "+((e&&e.message)||e);})' +
      '.then(function(){w.disabled=false;w.textContent=t;});});})();';
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(title + ' \u2014 ' + date) + '</title>' +
      '<style>' + DOC_CSS + '</style></head><body>' +
      '<div class="toolbar no-print" id="bar">' +
      '<button type="button" onclick="window.print()">Print / Save as PDF</button>' +
      '<button type="button" id="dl" data-file="' + esc(dl) + '">Download HTML</button>' +
      (showWord ? '<button type="button" id="word" data-file="' + esc(wf) + '">Word (.docx)</button>' +
      '<span id="wordmsg" role="status"></span>' : '') + '</div>' +
      '<main><h1>' + esc(title) + '</h1><p class="preface">' + preface + '</p>' + toc + chapterHeadingHtml +
      sections.join('\n') +
      (endMarker ? '<p class="end">' + esc(endMarker) + '</p>' : '') +
      '</main><script>' + script + '<' + '/script></body></html>';
  }

  function openBuiltPage(html, emptyMsg, label) {
    if (!html) { setMsg(emptyMsg); return; }
    var url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    var win = window.open(url, '_blank');
    if (!win) setMsg('Your browser blocked the pop-up. <a href="' + url + '" target="_blank" rel="opener">Open the ' + label + '</a>');
  }

  function openAddendum() {
    openBuiltPage(buildAddendumHtml(), 'Add at least one Clause first.', 'Addendum');
  }

  // Every Clause on the page, top to bottom; no certification, since nothing was chosen or omitted.
  // Grouped into chapters (CONFIG.groupIntoChapters) and, unlike a curated Addendum, its
  // cross-references point at other Clauses within this same document rather than back to the site.
  function openFullDocument() {
    var ids = allClauseIds();
    var html = buildAddendumHtml({
      ids: ids,
      fullDocument: true,
      title: CONFIG.fullDocTitle,
      prefaceHtml: CONFIG.fullDocSubtitleHtml.replace(/\{timestamp\}/g, utcStamp())
        .replace(/\{url\}/g, esc(CONFIG.fullDocUrl)),
      endMarker: '',
      fileBase: CONFIG.fullDocFileBase
    });
    openBuiltPage(html, 'No Clauses were found on this page.', 'document');
  }

  /* ---------- Word (.docx) export ---------- */

  // Loads the docx library on first use (needs network unless you self-host CONFIG.docxLibUrl).
  function loadDocx() {
    return new Promise(function (resolve, reject) {
      if (window.docx && window.docx.Document) return resolve(window.docx);
      var s = document.createElement('script');
      s.src = CONFIG.docxLibUrl;
      s.onload = function () {
        if (window.docx && window.docx.Document) resolve(window.docx);
        else reject(new Error('library loaded but "docx" not found'));
      };
      s.onerror = function () { reject(new Error('could not load ' + CONFIG.docxLibUrl)); };
      document.head.appendChild(s);
    });
  }

  function withFmt(fmt, more) {
    var o = {}, k;
    for (k in fmt) o[k] = fmt[k];
    for (k in more) o[k] = more[k];
    return o;
  }

  // fmt carries bold / italics / colour down into nested runs.
  function inlineRuns(D, node, out, fmt) {
    fmt = fmt || {};
    [].slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        if (n.nodeValue) out.push(new D.TextRun(withFmt(fmt, { text: n.nodeValue })));
      } else if (n.nodeType === 1) {
        var t = n.tagName;
        if (t === 'A' && n.getAttribute('href')) {
          out.push(new D.ExternalHyperlink({
            link: n.getAttribute('href'),
            children: inlineRuns(D, n, [], withFmt(fmt, { style: 'Hyperlink' }))
          }));
        } else if (t === 'BR') {
          out.push(new D.TextRun({ break: 1 }));
        } else if (t === 'B' || t === 'STRONG') {
          inlineRuns(D, n, out, withFmt(fmt, { bold: true }));
        } else if (t === 'I' || t === 'EM') {
          inlineRuns(D, n, out, withFmt(fmt, { italics: true }));
        } else if (t === 'SPAN' && n.classList.contains('v')) {
          inlineRuns(D, n, out, withFmt(fmt, { color: 'A52A2A' }));   // CSS "brown"
        } else {
          inlineRuns(D, n, out, fmt);
        }
      }
    });
    return out;
  }

  function listParas(D, list, level, ctx, out) {
    var ordered = list.tagName === 'OL', inst = ++ctx.lists;
    [].slice.call(list.children).forEach(function (li) {
      if (li.tagName !== 'LI') return;
      var c = li.cloneNode(true);
      c.querySelectorAll('ul,ol').forEach(remove);
      out.push(new D.Paragraph({
        children: inlineRuns(D, c, []),
        numbering: { reference: ordered ? 'cr-ol' : 'cr-ul', level: Math.min(level, 2), instance: inst }
      }));
      [].slice.call(li.children).forEach(function (sub) {
        if (sub.tagName === 'UL' || sub.tagName === 'OL') listParas(D, sub, level + 1, ctx, out);
      });
    });
  }

  function tableFor(D, tbl) {
    var rows = [].slice.call(tbl.querySelectorAll('tr')).map(function (tr) {
      return new D.TableRow({
        children: [].slice.call(tr.children).map(function (td) {
          return new D.TableCell({ children: [new D.Paragraph({ children: inlineRuns(D, td, []) })] });
        })
      });
    });
    return rows.length ? new D.Table({ rows: rows, width: { size: 100, type: D.WidthType.PERCENTAGE } }) : null;
  }

  function blocksFor(D, root, ctx) {
    var out = [];
    [].slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        if (n.nodeValue.trim()) out.push(new D.Paragraph({ children: [new D.TextRun(n.nodeValue.trim())] }));
        return;
      }
      if (n.nodeType !== 1) return;
      var t = n.tagName;
      if (/^H[1-6]$/.test(t)) {
        var opts = { heading: D.HeadingLevel['HEADING_' + t.charAt(1)], children: inlineRuns(D, n, []) };
        if (ctx.breakNext) { opts.pageBreakBefore = true; ctx.breakNext = false; }
        out.push(new D.Paragraph(opts));
      } else if (t === 'UL' || t === 'OL') {
        listParas(D, n, 0, ctx, out);
      } else if (t === 'TABLE') {
        var tb = tableFor(D, n);
        if (tb) out.push(tb);
      } else {
        out.push(new D.Paragraph({ children: inlineRuns(D, n, []) }));
      }
    });
    return out;
  }

  function buildDocxBlob(D, o) {
    o = o || {};
    var ids = o.ids || state.ids;
    var secs = compileSections(ids);
    if (!secs.length) return Promise.reject(new Error('no Clauses selected'));
    var ctx = { lists: 0, breakNext: false }, kids = [], pf = document.createElement('p');
    var singleChapterTitle = singleChapterTitleFor(ids);

    kids.push(new D.Paragraph({ heading: D.HeadingLevel.HEADING_1, children: [new D.TextRun(o.title || CONFIG.addendumTitle)] }));
    pf.innerHTML = prefaceHtml(secs.length, o.date);
    kids.push(new D.Paragraph({ children: inlineRuns(D, pf, []) }));
    if (CONFIG.contentsLabel) {
      kids.push(new D.Paragraph({ children: [new D.TextRun(singleChapterTitle || CONFIG.contentsLabel)], keepNext: true }));
      secs.forEach(function (r) {
        kids.push(new D.Paragraph({ children: [new D.TextRun(clauseTitle(r))], indent: { left: 360 }, spacing: { after: 40 } }));
      });
    }
    if (singleChapterTitle) {
      kids.push(new D.Paragraph({
        children: [new D.TextRun({ text: singleChapterTitle, bold: true, size: pt2half(CONFIG.chapterTitleSize) })],
        spacing: { before: 240, after: 120 }
      }));
    }
    secs.forEach(function (root, i) {
      ctx.breakNext = CONFIG.pageBreakBetweenClauses && i > 0;
      blocksFor(D, root, ctx).forEach(function (k) { kids.push(k); });
    });
    if (CONFIG.endMarker) kids.push(new D.Paragraph({ children: [new D.TextRun(CONFIG.endMarker)] }));

    function lvls(fmt, text) {
      return [0, 1, 2].map(function (i) {
        return {
          level: i, format: fmt, text: typeof text === 'function' ? text(i) : text,
          alignment: D.AlignmentType.START,
          style: { paragraph: { indent: { left: 720 * (i + 1), hanging: 360 } } }
        };
      });
    }
    function pt2half(v) { return Math.round(parseFloat(v) * 2) || 28; }
    function head(size, plain) {
      return {
        run: { font: plain ? 'Arial' : CONFIG.docxFont, bold: !plain, italics: !!plain, color: '000000', size: size },
        paragraph: { keepNext: true, spacing: { before: 240, after: 80 } }
      };
    }
    var doc = new D.Document({
      creator: 'diamondlaneclauses.org',
      title: o.title || CONFIG.addendumTitle,
      styles: {
        default: {
          document: { run: { font: CONFIG.docxFont, size: 22 }, paragraph: { spacing: { after: 120 } } },
          heading1: head(pt2half(CONFIG.addendumTitleSize)), heading2: head(pt2half(CONFIG.clauseTitleSize)), heading3: head(24, true),
          heading4: head(22), heading5: head(22), heading6: head(22)
        }
      },
      numbering: { config: [
        { reference: 'cr-ol', levels: lvls(D.LevelFormat.DECIMAL, function (i) { return '%' + (i + 1) + '.'; }) },
        { reference: 'cr-ul', levels: lvls(D.LevelFormat.BULLET, '\u2022') }
      ] },
      sections: [{ children: kids }]
    });
    return D.Packer.toBlob(doc);
  }

  // Called (via window.opener) by the "Word (.docx)" button on the generated Addendum page.
  // Needs docx.iife.js (CONFIG.docxLibUrl) on the site.
  function wordFile(ids, date) {
    var list = (ids || state.ids).filter(isClauseId);
    if (!list.length) return Promise.reject(new Error('no Clauses selected'));
    return loadDocx().then(function (D) { return buildDocxBlob(D, { ids: list, date: date }); });
  }

  /* ---------- shareable selection link ---------- */

  function shareUrl() {
    return (CONFIG.internalLinkBase || 'https://diamondlaneclauses.org/') +
      '?addendum=' + state.ids.map(encodeURIComponent).join(',');
  }

  function copyLink() {
    if (!state.ids.length) return;
    var u = shareUrl();
    writeClipboard({
      text: u,
      html: '<html><body><a href="' + esc(u) + '">' + esc(u) + '</a></body></html>'
    }).then(
      function () { setMsg('Link copied (' + state.ids.length + ' Clause' + (state.ids.length === 1 ? '' : 's') + ').'); },
      function () { setMsg('Could not copy automatically. Link: ' + esc(u)); }
    );
  }

  // Opening a link like  https://diamondlaneclauses.org/?addendum=k-adopt,k-nomen  loads that list.
  function applyLinkParam() {
    var raw = null;
    // 'appendix' is still accepted so links made before the rename keep working.
    try {
      var q = new URLSearchParams(window.location.search);
      raw = q.get('addendum') || q.get('appendix');
    } catch (e) { return; }
    if (!raw) return;
    var ids = [], bad = 0;
    raw.split(',').forEach(function (id) {
      id = id.trim();
      if (!id || ids.indexOf(id) !== -1) return;
      if (isClauseId(id)) ids.push(id); else bad++;
    });
    if (ids.length) {
      state.ids = ids;
      saveState();
      setMsg('Loaded ' + ids.length + ' Clause' + (ids.length === 1 ? '' : 's') + ' from a shared link.' +
             (bad ? ' ' + bad + ' not found.' : ''));
    } else {
      setMsg('None of the Clauses in that link were found.');
    }
    try { history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (e) { }
  }

  var OPEN = 'cr-open';               // on a .cmtry block: its text is showing
  var HEAD = 'cr-cmtry-head';         // on the heading of a .cmtry block (the clickable part)
  var allOpen = false;

  // The hiding itself is a rule in diamond-lane.css (a .cmtry block without .cr-open shows only its
  // heading), so nothing flashes on load; this script only adds/removes .cr-open.
  function extrasSelector() { return CONFIG.commentSelector; }

  function syncBox(box) {
    var f = box.firstElementChild;
    if (f && f.classList.contains(HEAD)) f.setAttribute('aria-expanded', box.classList.contains(OPEN) ? 'true' : 'false');
  }

  // Make each comment heading a button.
  function prepareComments() {
    [].slice.call(document.querySelectorAll(CONFIG.commentSelector)).forEach(function (box) {
      var f = box.firstElementChild;
      if (f && /^H[1-6]$/.test(f.tagName)) {
        f.classList.add(HEAD);
        f.setAttribute('role', 'button');
        f.setAttribute('tabindex', '0');
        f.setAttribute('aria-expanded', 'false');
        f.title = 'Click to show or hide this comment';
      }
    });
  }

  function toggleComment(box) {
    box.classList.toggle(OPEN);
    syncBox(box);
  }

  // Open or close every comment on the page.
  function setAllOpen(on) {
    allOpen = on;
    [].slice.call(document.querySelectorAll(extrasSelector())).forEach(function (el) {
      el.classList.toggle(OPEN, on);
      syncBox(el);
    });
    syncGlobal();
  }

  function syncGlobal() {
    [].slice.call(document.querySelectorAll('[data-toggle-all]')).forEach(function (g) {
      g.textContent = allOpen ? 'Hide all comments' : 'Show all comments';
      g.setAttribute('aria-pressed', allOpen ? 'true' : 'false');
    });
  }

  // Links (or URLs) that point INTO collapsed comments open them first, so a cross-reference
  // still lands on something visible.
  function revealId(id) {
    var el = id && document.getElementById(id), changed = false;
    if (!el) return false;
    var x = el.closest(extrasSelector());
    while (x) {
      var head = x.firstElementChild && x.firstElementChild.classList.contains(HEAD) ? x.firstElementChild : null;
      var onHeading = head && (head === el || head.contains(el));
      if (!onHeading && !x.classList.contains(OPEN)) { x.classList.add(OPEN); syncBox(x); changed = true; }
      x = x.parentElement && x.parentElement.closest(extrasSelector());
    }
    return changed;
  }

  function revealHash() {
    var id = '';
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (e) { return; }
    if (revealId(id)) {
      var el = document.getElementById(id);
      if (el && el.scrollIntoView) el.scrollIntoView();
    }
  }

  // "Show all comments" as a plain button under the page title. It is shown on narrow screens,
  // where the site hides the yellow notice, and everywhere if the notice is missing.
  function addFallbackToggle(solo) {
    if (document.querySelector('.cr-global-bar')) return;
    var bar = document.createElement('div'), b = document.createElement('button');
    bar.className = 'cr-global-bar' + (solo ? ' cr-global-solo' : '');
    b.type = 'button';
    b.className = 'cr-global-toggle';
    b.setAttribute('data-toggle-all', '');
    bar.appendChild(b);
    var host = document.getElementById('content') || document.body, title = null;
    for (var c = host.firstElementChild; c; c = c.nextElementSibling) {
      if (c.tagName === 'H1') { title = c; break; }
    }
    host.insertBefore(bar, title ? title.nextSibling : host.firstChild);
    syncGlobal();
  }

  // Adds "· Show all comments" as a link inside the notice.
  function attachNoticeLink(n) {
    if (n.querySelector('.cr-notice-extra')) return;
    var span = document.createElement('span'), a = document.createElement('a');
    span.className = 'cr-notice-extra';
    span.appendChild(document.createTextNode(' \u00B7 '));
    a.setAttribute('role', 'button');
    a.setAttribute('tabindex', '0');
    a.setAttribute('data-toggle-all', '');
    span.appendChild(a);
    n.appendChild(span);
    syncGlobal();
  }

  // Standalone button, independent of the Addendum list: builds a document of every Clause on
  // the page. Placed near the top of the content, so it's reachable without picking anything or
  // scrolling down to the corner panels first.
  var clausesOnlyOn = false;

  // Hides el entirely, UNLESS el itself is an operative "Clause text" box or contains one
  // somewhere inside it — in which case its non-box children are hidden one level down instead,
  // recursing as needed, so a genuinely nested box stays fully visible no matter how many
  // "framing" wrapper levels (a numbered sub-heading, a "Clause text" label) sit around it.
  function markNonOperative(el, on) {
    if (el.matches(CONFIG.clauseTextSelector)) return;
    if (el.querySelector(CONFIG.clauseTextSelector)) {
      [].slice.call(el.children).forEach(function (kid) { markNonOperative(kid, on); });
      return;
    }
    el.classList.toggle('cr-note-hidden', on);
  }

  // Turns "Clauses Only" mode on or off across the whole page. Applies the cr-note-hidden class
  // directly to everything that should disappear, rather than a body-level CSS rule, so it doesn't
  // depend on this stylesheet's cascade order (it's long, and keeps growing).
  function setClausesOnly(on) {
    clausesOnlyOn = on;
    document.body.classList.toggle('cr-clauses-only', on);
    document.querySelectorAll('.cmtry, .addl, .see-addl').forEach(function (el) {
      el.classList.toggle('cr-note-hidden', on);
    });
    // Mini tables of contents, scoped to INSIDE a Clause only — never the site's own navigation
    // (the hamburger drawer's TOC is a clone of the page's main nav and also carries
    // role="doc-toc", so an unscoped match here would empty out the drawer menu too).
    document.querySelectorAll(CONFIG.ruleContainerSelector + ' [role="doc-toc"]').forEach(function (toc) {
      toc.classList.toggle('cr-note-hidden', on);
      // "Contents:" label right before it (no reliable pure-CSS way to catch this one either).
      var prev = toc.previousElementSibling;
      if (prev && prev.tagName === 'P' && /^\s*(table of )?contents:?\s*$/i.test(prev.textContent)) {
        prev.classList.toggle('cr-note-hidden', on);
      }
    });
    // Per-Clause framing (the numbered sub-headings and their own prose, "Clause text" labels):
    // only for Clauses that actually use the box pattern — gathered the same way cloneRule does,
    // since this material can sit as genuine descendants or as flat siblings of the Clause's own
    // container. A Clause with no box anywhere in its range is left alone entirely.
    findRuleHeadings().forEach(function (h) {
      // A trailing tag on the Clause's own title (e.g. "(and notes)") describes material the
      // reader has just asked not to see, so it disappears too — same suffix list as the one used
      // when building a document (CONFIG.titleSuffixesToStrip).
      var last = h.lastChild;
      while (last && (
        (last.nodeType === 3 && !last.nodeValue.trim()) ||
        (last.nodeType === 1 && last.classList && last.classList.contains('copy-rule-add'))
      )) last = last.previousSibling;
      if (last && last.nodeType === 1) {
        var suffixText = (last.textContent || '').trim().toLowerCase();
        if ((CONFIG.titleSuffixesToStrip || []).some(function (s) { return suffixText === s.toLowerCase(); })) {
          last.classList.toggle('cr-note-hidden', on);
        }
      }
      var p = h.parentElement, hasWrap = p && /(^|\s)outline-\d+(\s|$)/.test(p.className);
      var roots = hasWrap ? [p] : [], covered = hasWrap ? [p] : [];
      var lvl = +h.tagName.charAt(1), all = allHeadingsInOrder(), idx = all.indexOf(h);
      for (var i = idx + 1; i < all.length; i++) {
        var hh = all[i], hl = +hh.tagName.charAt(1);
        if (hl <= lvl) break;
        var cont = hh.parentElement;
        if (covered.some(function (c) { return c && c.contains(cont); })) continue;
        var top = (cont && /(^|\s)outline-\d+(\s|$)/.test(cont.className)) ? cont : hh;
        roots.push(top);
        covered.push(top);
      }
      var hasBox = roots.some(function (r) { return r.matches(CONFIG.clauseTextSelector) || r.querySelector(CONFIG.clauseTextSelector); });
      if (!hasBox) return;
      roots.forEach(function (r) {
        if (r === p) {
          [].slice.call(p.children).forEach(function (kid) { if (kid !== h) markNonOperative(kid, on); });
        } else {
          markNonOperative(r, on);
        }
      });
    });
    syncClausesOnlyButton();
  }

  function syncClausesOnlyButton() {
    var b = document.querySelector('[data-clauses-only]');
    if (!b) return;
    b.textContent = clausesOnlyOn ? CONFIG.clausesOnlyActiveLabel : CONFIG.clausesOnlyLabel;
    b.setAttribute('aria-pressed', clausesOnlyOn ? 'true' : 'false');
  }

  function addFullDocPanel() {
    if (document.querySelector('[data-cr-act="buildall"]') || !document.querySelector(CONFIG.ruleContainerSelector)) return;
    var bar = document.createElement('div'), b = document.createElement('button'), t = document.createElement('button');
    bar.className = 'cr-fulldoc-bar';
    t.type = 'button';
    t.className = 'cr-clauses-only-btn';
    t.setAttribute('data-clauses-only', '');
    t.setAttribute('aria-pressed', 'false');
    t.textContent = CONFIG.clausesOnlyLabel;
    bar.appendChild(t);
    b.type = 'button';
    b.className = 'cr-fulldoc-btn';
    b.setAttribute('data-cr-act', 'buildall');
    b.textContent = CONFIG.fullDocButtonLabel;
    bar.appendChild(b);
    var host = document.getElementById('content') || document.body, title = null;
    for (var c = host.firstElementChild; c; c = c.nextElementSibling) {
      if (c.tagName === 'H1') { title = c; break; }
    }
    host.insertBefore(bar, title ? title.nextSibling : host.firstChild);
  }

  function placeGlobalToggle() {
    if (!CONFIG.globalToggle || !document.querySelector(CONFIG.commentSelector)) return;
    var n = document.getElementById(CONFIG.noticeId);
    if (n) {
      attachNoticeLink(n);
      addFallbackToggle(false);
      window.dispatchEvent(new Event('resize'));   // lets the site re-center the (now wider) notice
    } else {
      addFallbackToggle(true);
    }
  }

  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var gl = e.target && e.target.closest && e.target.closest('[data-toggle-all]');
    if (gl && gl.tagName !== 'BUTTON') { e.preventDefault(); setAllOpen(!allOpen); return; }
    var hd = e.target && e.target.classList && e.target.classList.contains(HEAD) ? e.target : null;
    if (hd && hd.parentElement) { e.preventDefault(); toggleComment(hd.parentElement); }
  }

  function onClick(e) {
    var lk = e.target.closest && e.target.closest('a[href^="#"]');
    if (lk && lk.getAttribute('href').length > 1) {
      try { revealId(decodeURIComponent(lk.getAttribute('href').slice(1))); } catch (err) { }
    }
    var hd = e.target.closest && e.target.closest('.' + HEAD);
    if (hd && !lk && hd.parentElement) { toggleComment(hd.parentElement); return; }

    var ad = e.target.closest && e.target.closest('[data-add-addendum]');
    if (ad) { e.preventDefault(); toggleId(ad.getAttribute('data-add-addendum')); return; }
    var ca = e.target.closest && e.target.closest('[data-chapter-addn]');
    if (ca) {
      e.preventDefault();
      var chH = document.getElementById(ca.getAttribute('data-chapter-addn'));
      if (chH) toggleChapter(chH);
      return;
    }
    var act = e.target.closest && e.target.closest('[data-cr-act]');
    if (act) { e.preventDefault(); panelAction(act); return; }

    var co = e.target.closest && e.target.closest('[data-clauses-only]');
    if (co) { e.preventDefault(); setClausesOnly(!clausesOnlyOn); return; }

    var ga = e.target.closest && e.target.closest('[data-toggle-all]');
    if (ga) { e.preventDefault(); setAllOpen(!allOpen); return; }

    var btn = e.target.closest && e.target.closest('[data-copy-rule]');
    if (!btn) return;
    e.preventDefault();
    var id = btn.getAttribute('data-copy-rule'), payload = build(id);
    if (!payload) {
      console.warn('CopyRule: no heading found with id "' + id + '"');
      flash(btn, 'error');
      return;
    }
    writeClipboard(payload).then(
      function () { flash(btn, 'copied'); },
      function (err) { console.warn('CopyRule: copy failed', err); flash(btn, 'error'); }
    );
  }

  function init() {
    addLiveSectionNumbers();
    if (CONFIG.commentToggles) prepareComments();
    findRuleHeadings().forEach(function (h) {
      if (CONFIG.autoButtons && !document.querySelector('[data-copy-rule="' + h.id + '"]')) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'copy-rule-btn';
        b.setAttribute('data-copy-rule', h.id);
        b.setAttribute('aria-label', 'Copy this Clause to the clipboard (commentary omitted)');
        b.title = 'Copy this Clause to the clipboard (commentary omitted)';
        h.appendChild(b);
      }
    });
    if (CONFIG.commentToggles) {
      setAllOpen(!CONFIG.commentsCollapsedOnLoad);
      revealHash();
      window.addEventListener('hashchange', revealHash);
      document.addEventListener('keydown', onKey);
    }
    placeGlobalToggle();
    if (CONFIG.addendumButton) {
      addFullDocPanel();
      findRuleHeadings().forEach(function (h) {
        if (h.querySelector('[data-add-addendum]')) return;
        var a = document.createElement('button');
        a.type = 'button';
        a.className = 'copy-rule-add';
        a.setAttribute('data-add-addendum', h.id);
        a.setAttribute('aria-pressed', 'false');
        h.appendChild(a);
      });
      document.querySelectorAll(CONFIG.chapterAddendumSelector).forEach(function (chap) {
        var h = chap.firstElementChild;
        if (!h || !/^H[1-6]$/.test(h.tagName) || !h.id || h.querySelector('[data-chapter-addn]')) return;
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'cr-chapter-add';
        c.setAttribute('data-chapter-addn', h.id);
        c.setAttribute('aria-pressed', 'false');
        h.appendChild(c);
      });
      loadState();
      applyLinkParam();
      render();
    }
    document.addEventListener('click', onClick);
  }

  window.CopyRule = { build: build, buildAddendumHtml: buildAddendumHtml, buildDocx: buildDocxBlob, wordFile: wordFile, shareUrl: shareUrl, state: state, config: CONFIG };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
