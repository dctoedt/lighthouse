#!/bin/bash
# Show sizes of ONLY images actually used in index.html

echo "IMAGES ACTUALLY USED IN INDEX.HTML"
echo "===================================================================="
echo ""

# The 14 images referenced in your HTML (from our earlier scan)
declare -a USED_IMAGES=(
    "img/!Cape-Henry-Lighthouse-Carol-M-Highsmith-LOC.png"
    "img/by-sa.png"
    "img/DCT-head-shot-2025-04-12-MFAH.png"
    "img/Freaky_Friday_(2003_film).png"
    "img/Trading-Places-poster-Rotten-Tomatoes.jpg"
    "img/Spaghetti-ChatGPT-2025-12-04-02-09_55 PM.png"
    "img/Megan_Thee_Stallion_Adweek_pose.jpg"
    "img/HillOfProofPPTDwg.png"
    "img/Affiliate-Alphabet-Google-YouTube-Fitbit.png"
    "img/INDIA-TILT-WHALER-H-diagram.png"
    "img/Purchase-order-swim-lane-ChatGPT-compressed.jpeg"
    "img/UCC-2-207-3-2.png"
    "img/SigBlocks.png"
    "img/Legalese.png"
)

echo "Image File                                                     Size"
echo "===================================================================="

TOTAL=0
FOUND=0
MISSING=0

for img in "${USED_IMAGES[@]}"; do
    if [ -f "$img" ]; then
        SIZE=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
        SIZE_KB=$(echo "scale=1; $SIZE / 1024" | bc)
        
        printf "%-60s %8s KB\n" "$(basename "$img")" "$SIZE_KB"
        
        TOTAL=$((TOTAL + SIZE))
        FOUND=$((FOUND + 1))
    else
        printf "%-60s %8s\n" "$(basename "$img")" "NOT FOUND"
        MISSING=$((MISSING + 1))
    fi
done

echo "===================================================================="
echo ""

TOTAL_KB=$(echo "scale=1; $TOTAL / 1024" | bc)
TOTAL_MB=$(echo "scale=2; $TOTAL / 1048576" | bc)

echo "Summary:"
echo "  Images used in HTML: 14"
echo "  Found: $FOUND"
echo "  Missing: $MISSING"
echo "  Total bandwidth per page load: $TOTAL_KB KB ($TOTAL_MB MB)"
echo ""
echo "Plus index.html size (check with: ls -lh index.html)"
echo ""
echo "Compare to total img folder:"
echo "  Total img folder: 87 MB"
echo "  Actually used: $TOTAL_MB MB"
echo "  Unused images: $(echo "scale=2; 87 - $TOTAL_MB" | bc) MB (not loaded by browser)"
