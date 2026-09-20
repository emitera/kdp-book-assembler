# 📚 Birdy Pages Master Technical & Legal Documentation

Master Blueprint and Legal Documentation suite for **Birdy Pages** (Web Application & Native Desktop Port in Flutter + Python).

---

## 📑 Documentation Index

### I. Technical Architecture & Engineering Specifications
1. [🏗 **`architecture.md`** — System Architecture & Tech Stack](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/architecture.md)
   * 1.1 Technology Stack & System Topology
   * 1.2 Supabase Database Schema (`profiles`, `desktop_licenses`, `payment_settings`, `support_tickets`) & RLS Policies
   * 1.3 Auth, Payment Routing & Paddle MoR Pipeline
   * 1.4 Admin CRM & License Control Hub

2. [📐 **`kdp_math.md`** — Core Business Logic & KDP Math Engine](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/kdp_math.md)
   * 2.1 Canvas & Page Coordinate Systems (72 pt vs 300 DPI)
   * 2.2 Paperback vs. Hardcover Cascading Matrix & Constraints
   * 2.3 Cover Spread, Hinge ($0.394''$), Wrap ($0.591''$) & Spine Formulas
   * 2.4 Spine Text Rules, Thresholds ($N \ge 75/79$) & Safety Margins ($0.0625''$)

3. [🎨 **`rendering_engine.md`** — UI/UX Rendering & Zero-Crop Policy](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/rendering_engine.md)
   * 3.1 Independent 3-Layer DOM Architecture
   * 3.2 Non-Destructive Zero-Crop Standard (Immutable Blobs)
   * 3.3 Mathematical Aspect Ratio Contain & Auto-Centering Formulas

4. [🚀 **`desktop_bridge.md`** — Desktop Bridge: Upscaling, Flattening & Licensing](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/desktop_bridge.md)
   * 4.1 Flutter UI ⟷ Python Engine Bridge
   * 4.2 Data Hooks & State Serialization Schema
   * 4.3 Raster Flattening & Complete Alpha Channel Stripping (RIP Safety)
   * 4.4 Local AI Upscaling Pipeline (Real-ESRGAN / ONNX Runtime)
   * 4.5 Offline/Online License Verification System with Hardware ID Binding

---

### II. Desktop Legal Drafts (EULA, Privacy & Refund Policies)
5. [📜 **`terms_desktop_draft.md`** — Desktop EULA & Terms of Service](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/terms_desktop_draft.md)
   * Single-User License Grant, Node-Locked Hardware ID Binding (`hardware_id`), No-Resale Clause, Reverse Engineering Prohibitions, KDP Approval Disclaimers.

6. [🔒 **`privacy_desktop_draft.md`** — Desktop Privacy Policy (Zero-Upload Standard)](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/privacy_desktop_draft.md)
   * 100% Local File Processing Guarantee, Local AI Upscaling, Cryptographic SHA-256 Hardware ID Telemetry, Paddle Merchant of Record Privacy Standards.

7. [💳 **`refund_desktop_draft.md`** — Desktop Refund Policy](file:///Users/evgenymendus/Documents/WebDev/kdp%20book%20assembler/docs/refund_desktop_draft.md)
   * 14-Day Money-Back Guarantee, Instant Remote License Revocation (`revoked` status), Technical KDP Rejection Guarantee, Anti-Abuse Safeguards.
