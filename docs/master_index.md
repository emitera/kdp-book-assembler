# 📚 Birdy Pages Master Technical Documentation

Master technical blueprint for Birdy Pages (web maintenance and native desktop application port in Flutter + Python).

---

## 📑 Documentation Index

1. [🏗 System Architecture & Tech Stack (`architecture.md`)](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/architecture.md)
   * 1.1 Technology Stack & High-level Topology
   * 1.2 Supabase Database Schema (`profiles`, `payment_settings`, `support_tickets`, `desktop_licenses`) & RLS Policies
   * 1.3 Auth, Payment Routing & MoR Pipeline

2. [📐 Core Business Logic & KDP Math Engine (`kdp_math.md`)](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/kdp_math.md)
   * 2.1 Canvas & Page Coordinate Systems (72 pt vs 300 DPI)
   * 2.2 Paperback vs. Hardcover Cascading Matrix & Constraints
   * 2.3 Cover Spread, Hinge ($0.394''$), Wrap ($0.591''$) & Spine Formulas
   * 2.4 Spine Text Rules, Thresholds ($N \ge 75/79$) & Safety Margins ($0.0625''$)

3. [🎨 UI/UX Rendering Engine & Zero-Crop Policy (`rendering_engine.md`)](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/rendering_engine.md)
   * 3.1 Independent 3-Layer DOM Architecture
   * 3.2 Non-Destructive Zero-Crop Standard (Immutable Blobs)
   * 3.3 Mathematical Aspect Ratio Contain & Auto-Centering Formulas

4. [🚀 Desktop Bridge: Upscaling & Flattening Roadmap (`desktop_bridge.md`)](file:///C:/Users/evgen/.gemini/antigravity-ide/brain/04176191-ab30-4c85-8015-3e381afe907d/desktop_bridge.md)
   * 4.1 Flutter UI ⟷ Python Engine Bridge
   * 4.2 Data Hooks & State Serialization Schema
   * 4.3 Raster Flattening & Complete Alpha Channel Stripping (RIP Safety)
   * 4.4 Local AI Upscaling Pipeline (Real-ESRGAN / ONNX Runtime)
   * 4.5 Offline/Online License Verification System
