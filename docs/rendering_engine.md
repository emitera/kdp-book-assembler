# 🎨 UI/UX Rendering Engine & Zero-Crop Policy (`rendering_engine.md`)

[⬅ Back to KDP Math Engine](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/kdp_math.md) | [Master Index](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/master_index.md) | [Next: Desktop Bridge ➡](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/desktop_bridge.md)

---

## 3.1 DOM Layering Hierarchy
To eliminate coordinate coupling bugs (where scaling images accidentally scaled the print guides), the rendering viewport uses an **Independent 3-Layer Architecture**:

```
Layer 3: Guides & Overlays (Z-Index: 30) - Pointer-events: none
├── Bleed Box (Dashed Red)
├── Safe Zone Margin (Dashed Green)
├── Spine Boundaries & Hinge Guides (Dashed Blue)
└── Barcode Exclusion Zone (0.75" x 2.0" at bottom-right of Back Cover)

Layer 2: Image Render Layer (Z-Index: 10) - Pointer-events: auto
└── <img / canvas> element placed with pure transform matrix (Translate/Scale)

Layer 1: Canvas Base Coordinate Frame (Z-Index: 0)
└── Fixed Physical Aspect Ratio Box (Width x Height matching KDP print dimensions)
```

---

## 3.2 Zero-Crop Standard (Non-Destructive State)
Under no circumstances is a user-uploaded image destructively sliced or cropped upon loading or layout switching.
1. The original binary `Blob` / `File` reference is preserved immutably in memory:
   ```ts
   interface PageAsset {
     id: string;
     originalBlob: Blob;
     previewUrl: string;
     naturalWidth: number;
     naturalHeight: number;
     transform: {
       scale: number;
       offsetX: number;
       offsetY: number;
     };
   }
   ```
2. Any user adjustment (pan, zoom) updates `transform` metadata only.

---

## 3.3 Auto-Scaling & Fitting Formulas (`contain`)
When the user triggers "Optimize / Fit to Canvas", the engine calculates a non-destructive aspect ratio scale:

$$\text{Scale Factor } S = \min\left(\frac{W_\text{canvas}}{W_\text{image}}, \frac{H_\text{canvas}}{H_\text{image}}\right)$$

$$\text{Rendered Width} = W_\text{image} \times S$$
$$\text{Rendered Height} = H_\text{image} \times S$$
$$\text{Offset}_X = \frac{W_\text{canvas} - \text{Rendered Width}}{2}$$
$$\text{Offset}_Y = \frac{H_\text{canvas} - \text{Rendered Height}}{2}$$

This guarantees $100\%$ content visibility without edge clipping or destructive modifications.
