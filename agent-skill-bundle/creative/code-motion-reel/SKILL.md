---
name: code-motion-reel
description: >
  Generates 100% code-crafted, 60fps cinematic brand motion reels and viral vertical reels
  in Remotion (React) with procedural audio synthesized in code. Use whenever the user
  mentions "code-motion-reel", "create a video", "brand reel", "viral reel", "remotion video",
  "make a video in code", or wants to turn a portfolio/website into a 60fps motion reel.
  Upon activation, immediately asks the user 5 simple intake questions, then autonomously
  builds, synthesizes audio, renders, and deploys the finished MP4 to D:\AI\.
argument-hint: "[vertical|horizontal]"
license: MIT
---

# Code Motion Reel Skill

Generate high-retention, 60fps brand motion reels and viral reels entirely in code using React, Remotion, and procedural Web Audio synthesis. Zero stock footage. Zero external audio. 100% deterministic code.

---

## 1. Activation Behavior: The 5 Intake Questions

When this skill is triggered, **DO NOT write code yet**. Immediately ask the user the following 5 structured questions in a clean, concise format (or using the `ask_question` tool):

1. **Brand / Creator Identity**:
   - What is the brand name or person's name?
   - What is the primary slogan or tagline?
2. **Data & Proof Points**:
   - Website URL (or provide 3–4 metrics: e.g., "20+ Shipped, 4.9★ Rating, WordPress & React").
3. **Assets (Photos & Logos)**:
   - Provide file paths or uploads for:
     - Transparent cutout portrait photo (PNG).
     - Logo mark (SVG or PNG). If none, state "generate for me".
4. **Format & Duration**:
   - **Option A (Default for Socials)**: **18s Viral Vertical Reel** (1080×1920, 9:16, 60fps) — Fast cuts every 2s, shock hook, 140 BPM phonk/trap 808 beat.
   - **Option B**: **24s Cinematic Brand Reel** (1920×1080, 16:9, 60fps) — Horizontal 11-scene portfolio reel.
5. **Color Aesthetic**:
   - *Electric Cyber* (Cosmic Navy `#06071B` + Living Blue `#2932D6` + Electric Cyan `#00F2FE`) [Default]
   - *Neon Matrix* (Obsidian `#0A0D0A` + Emerald Green `#00FF88`)
   - *Sunset Synth* (Dark Violet `#0F051D` + Hot Pink `#FF007A` + Neon Amber `#FFB800`)
   - Custom hex colors.

---

## 2. Autonomous Execution Pipeline

Once the user provides the answers (or chooses defaults):

### Step 1: Synthesize Synchronized Audio Score (Pure Math)
Write a Node.js script (`scripts/generate-audio.js`) that outputs a 44.1kHz stereo WAV file into `public/`:
- **For 18s Vertical Reel**: 140 BPM phonk/trap electronic beat with pitch-drop 808s, 16th-note hi-hats, transition whooshes on cuts, and a supernova shimmer.
- **For 24s Horizontal Reel**: 120 BPM heartbeat pulse, 55Hz sub drone, riser into title slam, terminal typing clicks, and finale logo boom.
- Normalize to -0.94 peak using soft limiting (`Math.tanh`).

### Step 2: Build the Remotion Composition (React)
1. **Living Background**: Radial gradient with smooth trigonometric drift (`Math.sin(frame * speed)`), cyber grid lines, soft edge vignette.
2. **HUD Overlay**: Mobile/screen safe margins, corner brackets, timecode counter (`MM:SS:FF`), blinking REC light, glowing bottom progress bar.
3. **Dynamic Scenes**:
   - **Scene 1 (Hook)**: High dopamine disruption (e.g. `⚠️ ERROR 500: AFTER EFFECTS CRASHED` → `PURE REACT.` with 20px screen shake).
   - **Scene 2 (Speedrun / Terminal)**: Hyperspace warp streaks or 3D floating perspective CLI typing live code with syntax highlights.
   - **Scene 3 (3D Math / Spectrum)**: Real-time 3D Torus point cloud (~650 points with perspective projection) or responsive audio oscilloscope.
   - **Scene 4 (Architect / Creator)**: Full hero presence of creator cutout photo with cyan laser scanline and animated metric badges.
   - **Scene 5 (Supernova Finale & Viral CTA)**: ~1,000 particles swirling into the crisp logo mark with shockwave ring, followed by the high-conversion call to action (`👇 COMMENT "CODE"`).

### Step 3: Verification Before Render
1. Render milestone still frames (`npx remotion still ...`) for the Hook, 3D Geometry, and Creator scenes.
2. Visually verify contrast, typography, and safe margin compliance (no text clipped by app UI).

### Step 4: Render Master MP4
Execute the Remotion render command:
```powershell
npx remotion render src/index.ts <CompositionId> out/<reel-name>.mp4 --codec=h264 --audio-codec=aac --quality=90
```

### Step 5: Deliver & Verify
1. Copy the output video directly to `D:\AI\<reel-name>.mp4`.
2. Copy project source code to `D:\AI\<reel-folder>\`.
3. Verify stream parameters with `ffmpeg -i D:\AI\<reel-name>.mp4`:
   - Exact resolution (1080×1920 or 1920×1080)
   - Exact 60.00 fps progressive
   - AAC stereo audio track
4. Present verified output links and a ready-to-publish social media caption with hashtags.
