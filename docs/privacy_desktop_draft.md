# Privacy Policy — Desktop Edition (Zero-Upload Standard)

**Product:** Birdy Pages Desktop (macOS / Windows / Linux)  
**Developer & Operator:** emITera (Haifa, Israel)  
**Last Updated:** September 2026  

---

## 1. Core Architecture: Zero-Upload Guarantee
At Birdy Pages, we recognize that unpublished manuscripts, cover art, and intellectual property require the highest level of privacy and protection.

**Birdy Pages Desktop operates on a 100% Local Processing Model:**
* **Zero Cloud Uploads:** Your cover images, interior page art, text files, and compiled PDF manuscripts **never leave your local device**.
* **Local AI Processing:** All image processing (including Real-ESRGAN/ONNX AI upscaling, color space conversion, and raster flattening) executes locally on your CPU/GPU.
* **No Cloud Storage of Content:** We do not maintain cloud servers that store, parse, index, or transmit your book files.

---

## 2. Information We Collect & Transmit
The desktop application requires network connectivity strictly for licensing and service integrity:

### A. License Verification Data
When you activate the Software or perform periodic license checks, the application transmits:
1. **License Key:** The `BIRDY-XXXX-XXXX-XXXX` activation code provided upon purchase.
2. **Hardware Identifier (`hardware_id`):** An irreversible, one-way SHA-256 cryptographic hash derived from hardware components (e.g., CPU identifier and motherboard UUID). This hash cannot be reverse-engineered to identify your physical device or personal specifications.
3. **Application Version:** To notify you of critical security patches and KDP specification updates.

### B. Purchase & Billing Data (Managed by Paddle)
* When purchasing a license via our website, payment processing is handled exclusively by **Paddle.com** as Merchant of Record.
* We do not collect, store, or process your credit card numbers, CVV security codes, or banking credentials on our infrastructure. We retain only your registered email address, transaction identifier, and active license key.

### C. Optional Anonymous Diagnostic Telemetry
* If an unhandled application crash occurs, the Software may prompt you to submit an anonymous stack trace error log.
* Crash reports contain only diagnostic runtime stack traces and do not include user images, filenames, manuscript content, or personal identifiers.

---

## 3. Data Storage on Your Local Computer
Birdy Pages Desktop stores minimal local data on your operating system's secure credential store:
* **Local Authorization Token:** Encrypted JWT stored via OS Keychain (macOS) or DPAPI / Credential Manager (Windows) to allow offline work without constant internet access.
* **User Application Preferences:** UI settings (theme, recent book trim presets, units of measurement) stored locally in standard JSON configuration files.

---

## 4. Third-Party Service Providers
* **Merchant of Record & Tax Compliance:** Paddle.com Market Limited (governed by Paddle's Privacy Policy).
* **Licensing Database & Backend:** Supabase (PostgreSQL with Row-Level Security) and Cloudflare Workers API for license validation requests.
* **Transactional Email:** Resend API for delivering license keys upon purchase.

---

## 5. Your Rights & Data Deletion
* You may request deletion of your email address and license records from our database by contacting **support@birdypages.io**. Note that deleting your active license record will deactivate the Software's Pro features.

---

## 6. Contact Information
For questions regarding our privacy practices or the Zero-Upload architecture, reach us at:
* **Email:** support@birdypages.io
* **Website:** https://birdypages.io
