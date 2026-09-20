# 📐 Core Business Logic & KDP Math Engine (`kdp_math.md`)

[⬅ Back to Architecture](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/architecture.md) | [Master Index](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/master_index.md) | [Next: Rendering Engine ➡](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/rendering_engine.md)

---

## 2.1 Canvas & Page Coordinate Systems
KDP uses standard typographical points ($1\text{ in} = 72\text{ pt}$) for PDF internal coordinates, while layout formulas are calculated in inches ($\text{in}$) at 300 DPI for raster assets.

$$\text{DPI} = 300 \implies 1\text{ inch} = 300\text{ px}$$
$$\text{PDF Points} = \text{Inches} \times 72$$

---

## 2.2 Paperback vs. Hardcover Matrix & Cascading Rules

| Parameter | Paperback (Softcover) | Hardcover (Case Laminate) |
| :--- | :--- | :--- |
| **Minimum Page Count** | 24 pages | **75 pages** |
| **Maximum Page Count** | 828 pages (B&W White), 590 (Standard Color) | **550 pages** |
| **Available Trim Sizes** | All standard sizes ($5\times8''$ to $8.5\times11.69''$) | Restricted: $5.5\times8.5''$, $6\times9''$, $6.14\times9.21''$, $7\times10''$, $8.25\times11''$, $8.5\times11''$ |
| **Outer Wrap / Turn-in** | N/A (Standard Bleed $0.125''$) | **$0.591''$ ($15.0\text{ mm}$)** on all 4 edges |
| **Hinge Zone (Joint)** | N/A | **$0.394''$ ($10.0\text{ mm}$)** on left & right of spine |
| **Cover Corner Allowance**| Flat cut | Rounded foldover allowance ($+0.125''$ total width, $+0.25''$ total height) |

---

## 2.3 Cover Spread, Hinge, Wrap & Spine Formulas

### 1. Paper Thickness Multipliers ($T_\text{paper}$):
* **Black & White / Standard Color (White Paper):** $0.002252\text{ in / page}$
* **Black & White (Cream Paper):** $0.0025\text{ in / page}$
* **Premium Color (White Paper):** $0.002347\text{ in / page}$

### 2. Spine Width Calculation ($W_\text{spine}$):
$$W_\text{spine} = N_\text{pages} \times T_\text{paper}$$

### 3. Paperback Full Cover Spread:
$$W_\text{cover\_pb} = (2 \times W_\text{trim}) + W_\text{spine} + (2 \times 0.125'')$$
$$H_\text{cover\_pb} = H_\text{trim} + (2 \times 0.125'')$$

### 4. Hardcover Full Cover Spread:
KDP Hardcover uses wrap foldovers and board hinge allowances:
$$W_\text{wrap} = 0.591'', \quad W_\text{hinge} = 0.394''$$
$$W_\text{cover\_hc} = (2 \times W_\text{trim}) + W_\text{spine} + (2 \times W_\text{wrap}) + 0.125''$$
$$H_\text{cover\_hc} = H_\text{trim} + (2 \times W_\text{wrap}) + 0.250''$$

```
|<----------------------------- Full Cover Spread Width ----------------------------->|
+-------------------------------------------------------------------------------------+
| WRAP (0.591")                                                                       |
|   +-----------------------------------+---+-----------+---+---------------------+   |
|   |                                   | H |           | H |                     |   |
| W |            BACK COVER             | I |   SPINE   | I |     FRONT COVER     | W |
| R |                                   | N |           | N |                     | R |
| A |                                   | G |           | G |                     | A |
| P |                                   | E |           | E |                     | P |
|   +-----------------------------------+---+-----------+---+---------------------+   |
|                                                                        WRAP (0.591")|
+-------------------------------------------------------------------------------------+
```

---

## 2.4 Spine Text Rules & Safe Margins
* **Spine Text Eligibility Threshold:** Allowed **only** if $N_\text{pages} \ge 79$ (Paperback) or $N_\text{pages} \ge 75$ (Hardcover).
* **Spine Safety Margins:** $0.0625''$ ($1/16\text{ in}$) on left and right borders of the spine.
$$\text{Max Text Height on Spine} = W_\text{spine} - (2 \times 0.0625'')$$
* **Text Direction:**
  * Standard: Top-to-Bottom (Rotated 90° clockwise).
  * Alternative: Bottom-to-Top (Rotated 90° counter-clockwise).
