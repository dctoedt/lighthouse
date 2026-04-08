/* section-reformat.js
 * Reformats the innermost section numbers in Lighthouse HTML export
 * from org-mode's default dot-separated format to a parenthetical-letter
 * format, e.g., "28.16.1.2." becomes "(b) "
 *
 * Targets .section-number-5 spans inside <h5> elements that are children
 * of a .cl8 container (i.e., fourth-level org-mode headings marked with
 * the cl8 HTML container class). Subdivision numbers are converted to
 * lowercase letters (1→a, 2→b, etc.), matching the convention used in
 * modern U.S. statutes.
 *
 * Usage in org-mode file header:
 *   #+HTML_HEAD: <script src="section-reformat.js" defer></script>
 *
 * No external dependencies.
 */
(function () {
  function reformatSectionNumbers() {
    document.querySelectorAll(".cl8 h5 .section-number-5").forEach(function (span) {
      span.textContent = span.textContent.replace(
        /^(\d+\.\d+\.\d+)\.(\d+)\.\s*$/,
        function (match, prefix, num) {
          var letter = String.fromCharCode(96 + parseInt(num, 10));
          return "(" + letter + ") ";
        }
      );
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reformatSectionNumbers);
  } else {
    reformatSectionNumbers();
  }
})();
