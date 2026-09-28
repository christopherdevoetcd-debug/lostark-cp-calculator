<div align="center">
  <h1>⚔️ Lost Ark Tier 4 CP Calculator & Benchmark</h1>
  <p><strong>The ultimate progression tool for Lost Ark's Tier 4 Endgame</strong></p>
  
  [![Live Website](https://img.shields.io/badge/🌐_Website-lostark--cp.pages.dev-00C7B7?style=for-the-badge&logo=googlechrome&logoColor=white)](https://lostark-cp.pages.dev/)
  [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
  [![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

  <br />

  ### 🔗 **[👉 Launch Web App (lostark-cp.pages.dev) 👈](https://lostark-cp.pages.dev/)**
  *Staging / Beta environment: [staging.lostark-cp.pages.dev](https://staging.lostark-cp.pages.dev/)*
</div>

<br />

---

## 📖 Overview

**Lost Ark CP Calculator** is an advanced, high-performance client-side web application designed to help players optimize their Tier 4 progression. It calculates Combat Power (CP) gains, simulates exact probabilistic honing costs using live EUC market API data, and compares your character directly with top-tier players to generate a highly accurate, gold-efficient **Action Plan** and **Smart Roadmap**.

---

## ✨ Key Features

- **📊 Probabilistic T4 Honing Engine**: Calculates exact mathematical expectations for T4 honing up to +25 (including Artisan Energy / Pity limits up to 500 taps).
- **📈 Live Market Prices Integration**: Fetches real-time EUC market data (Destruction Stones, Guardian Stones, Leapstones, Fusion Mats) via Loa-Buddy API to split costs into *Raw Gold* vs *Market Value*.
- **🌐 Dynamic Roster Sync (OAuth)**: Securely connects to the `lostark.bible` API to import your live roster instantly.
- **⚡ Peer Profile Comparator**: Compare your character's exact build (Gems, Engravings, Ark Grid, Bracelets, Accessories) against live reference profiles.
- **💡 Smart Upgrade Advisor (Cost-Efficiency Planner)**: Automatically computes the cheapest gold path to hit your raid CP and iLvl thresholds across all systems:
  - 🔨 **T4 Honing** (Weapon & Armor up to +25)
  - ✨ **Ark Grid** (Epic Astrogems & 17P Cores)
  - 💍 **T4 Accessories** (Dead Line Polishing & Mid ➔ High Rolls)
  - 💎 **T4 Gems** (Lv. 8 ➔ Lv. 9 and Lv. 9 ➔ Lv. 10)
  - 📜 **Relic Engraving Books** (Missing books to 20/20)
  - 📿 **T4 Bracelet** (Diagnostic & BiS Perk targets)
- **🛡️ Full Support & DPS Symmetry**: Specialized buff power scaling formulas for Paladins, Bards, and Artists, accurately treating offensive-only lines as dead stats on supports.
- **🌍 Bilingual Interface**: Fully localized in English and French.

---

## 🛠️ Tech Stack

This project is built to be extremely fast, serverless, and easy to host:
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (No framework overhead).
- **Hosting / Deployment**: Fully optimized for **Cloudflare Pages**.
- **APIs**: 
  - `lostark.bible` Open API (OAuth2 character telemetry & live data)
  - `loa-buddy` Market API (Live EUC item prices)
- **Analytics**: Cloudflare Web Analytics integrated (Privacy-first).

---

## 🚀 Quick Start (Local Development)

The application is entirely static and runs directly in any browser:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/christopherdevoetcd-debug/lostark-cp-calculator.git
   cd lostark-cp-calculator
   ```

2. **Serve the files:**
   You can use any local web server. For example, using Python 3:
   ```bash
   python -m http.server 3000
   ```
   Or using Node's `serve`:
   ```bash
   npx serve .
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`.

---

---

## 🔄 Local Raid Tracker Companion (Optional)

For players using a local DPS meter (such as **LOA Logs**), the project includes an optional, lightweight companion script located in the [`agent/`](agent/) folder. It automatically synchronizes your weekly raid clears, gates completed, and gold revenues directly with the web dashboard.

### 🚀 How to Run the Companion

1. **Option A (Instant Start via Batch File):**
   - Navigate to the `agent/` folder.
   - Double-click **`start-agent.bat`** (or run `node agent/lostark-raid-agent.js`).
   - The agent starts locally on port `4848` and connects to your browser automatically.

2. **Option B (Silent Background Service):**
   - Run `start-agent-hidden.vbs` to launch silently without leaving a terminal window open.

---

### 🛡️ Privacy, Security & Anti-Cheat Guarantee

We take player security and privacy with the utmost seriousness:

- 🔒 **100% Local Execution (`127.0.0.1:4848`)**: The companion only creates a local loopback server on your computer. **Zero data is ever transmitted, uploaded, or shared with external servers or third parties.** Everything stays strictly between your local logs and your local browser.
- 🛡️ **Zero Game Process Interference (EAC Safe)**: The script **NEVER** hooks into `LostArk.exe`, does **NOT** read game memory, and has **zero interaction** with Easy Anti-Cheat (EAC). It simply performs passive, read-only queries on the local SQLite log database (`%LOCALAPPDATA%\LOA Logs\encounters.db`) already written to your disk by your meter.
- 🔍 **100% Open Source & Auditable**: The script is fewer than 400 lines of standard, readable JavaScript with zero obfuscation. You can inspect every line yourself in [`agent/lostark-raid-agent.js`](agent/lostark-raid-agent.js).

---

## ⚙️ Configuration (OAuth & API)

If you plan to fork and host this project on your own domain, update the OAuth Configuration in `data.js`:

```javascript
// In data.js
window.OAUTH_CONFIG = {
    prodClientId: 'YOUR_PRODUCTION_CLIENT_ID',
    devClientId: 'YOUR_DEV_CLIENT_ID',
    scopes: 'identify rosters logs',
    authUrl: 'https://lostark.bible/oauth/authorize',
    ...
};
```
*Remember to whitelist your domain (and `http://localhost:3000`) in your OAuth provider's **Allowed Redirect URIs** list.*

---

## 🙏 Credits & Special Thanks

This tool would not have been possible without the immense work, research, and data shared by the Lost Ark theorycrafting community:

- **🔥 Arsonistic** — Author of the legendary *Lost Ark Arsonistic DPS Calculator.xlsx*. His mathematical models, Combat Power formulas, Support Buff Power equations, and Tier 4 accessory scaling formed the core foundation of our calculation engine.
- **📊 Cracine, Portia & Riyon** — Creators of the *Automatic Gold to DMG Efficiency* spreadsheet. Their EUC gold-to-damage ROI frameworks directly inspired our dynamic priority roadmap and benchmark diagnostic logic.
- **🌐 lostark.bible Team** — For providing exceptional character telemetry, public profiles, and seamless OAuth API integrations for the global Lost Ark community.
- **💎 Loa-Buddy Project** — For open-sourcing live market scraping and community API access for European Central (EUC) Auction House prices.
- **📖 Maxroll.gg** — For comprehensive, up-to-date game mechanics guides, honing probability tables, and Ark Grid system breakdowns.
- **🇰🇷 Inven Community** — For early Tier 4 data mining, Relic Book scaling, and pioneer theorycrafting on the Ark Passive systems.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
