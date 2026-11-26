#!/bin/sh
# Prints the frame arguments for try-frames.ts --bin, in time order, from test-frames-bin/index.txt.
D="$(dirname "$0")/../test-frames-bin"
while read -r n t blank; do
  if [ "$blank" = blank ]; then printf 'blank '; else printf '%s/f%sa.png+%s/f%sb.png ' "$D" "$n" "$D" "$n"; fi
done < "$D/index.txt"
