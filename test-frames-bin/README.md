# Real frames from @ParlamentSrbija, 24.11.2026

Replay: https://www.youtube.com/watch?v=QxOLhJHQs-U (1080p).

Each frame is the extension's own OCR input: `captureCaption()` from `src/content/capture.ts`, run
in the page on the real video frame (region 0/80/90/20 %, white threshold 225), so cropping,
scaling and binarisation are exactly what the extension does. The 1752×240 result is cut into
three 584×240 pieces: `fNNa.png` holds pieces 1–2 stacked, `fNNb.png` piece 3.
`index.txt` lists the video time of each frame; readings are 1.5 s apart inside each window,
as the extension reads them. `blank` = a frame with no caption pixels (OCR skipped).

    npx tsx scripts/try-frames.ts --mode only --speakers "Јово Бакић" --conf 1 --bin $(sh scripts/frames-args.sh)
