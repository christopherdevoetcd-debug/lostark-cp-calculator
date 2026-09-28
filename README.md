<div align="center">
  <h1>⚔️ Lost Ark Tier 4 CP Calculator & Benchmark</h1>
  <p><strong>The ultimate progression tool for Lost Ark's Tier 4 Endgame</strong></p>
  
  [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com/)
  [![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
</div>

<br />

## 📖 Overview

**Lost Ark CP Calculator** is an advanced, client-side web application designed to help players optimize their Tier 4 progression. It calculates Combat Power (CP) gains, simulates exact probabilistic honing costs using live market API data, and compares your character directly with top-tier players to generate a highly accurate, gold-efficient **Action Plan**.

## ✨ Key Features

- **📊 Probabilistic T4 Honing Engine**: Calculates the exact mathematical expectation for T4 honing (including Artisan Energy / Pity limits up to 500 taps).
- **📈 Live Market Prices Integration**: Fetches real-time EUC market data (Destruction Stones, Guardian Stones, Leapstones, Fusion Mats) to split your upgrade costs into *Raw Gold* vs *Market Value*.
- **🌐 Dynamic Roster Sync (OAuth)**: Securely connects to the `lostark.bible` API to import your live roster instantly.
- **⚡ Peer Profile Comparator**: Compare your character's exact build (Gems, Engravings, Ark Grid, Bracelets) against live reference profiles.
- **💡 Smart ROI Action Plan**: Calculates the precise gold cost of closing the CP gap with a benchmark profile (Dynamically scales T4 Gem costs, Accessory tuning rolls, and Astrogem RNG matrices).
- **🌍 Bilingual Interface**: Fully localized in English and French.

## 🛠️ Tech Stack

This project is built to be extremely fast, serverless, and easy to host:
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Hosting / Deployment**: Fully optimized for **Cloudflare Pages**.
- **APIs**: 
  - Smilegate / `lostark.bible` Open API (OAuth2 character data)
  - Loa-Buddy Market Data API (Live item prices)
- **Analytics**: Cloudflare Web Analytics integrated (Privacy-first).

## 🚀 Quick Start (Local Development)

The app is entirely static. You do not need Node.js or a complex build pipeline to run it locally.

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/yourusername/lostark-cp-calculator.git
   cd lostark-cp-calculator
   \`\`\`

2. **Serve the files:**
   You can use any local web server. For example, using Python 3:
   \`\`\`bash
   python -m http.server 3000
   \`\`\`
   Or using Node's `serve`:
   \`\`\`bash
   npx serve .
   \`\`\`

3. **Open in browser:**
   Navigate to `http://localhost:3000`.

## ⚙️ Configuration (OAuth & API)

If you plan to fork and host this project yourself, you must update the OAuth Configuration in `data.js` to match your own Smilegate / lostark.bible Developer Application:

\`\`\`javascript
// In data.js
window.OAUTH_CONFIG = {
    prodClientId: 'YOUR_PRODUCTION_CLIENT_ID',
    devClientId: 'YOUR_DEV_CLIENT_ID',
    scopes: 'identify rosters logs',
    authUrl: 'https://lostark.bible/oauth/authorize',
    ...
};
\`\`\`
*Don't forget to whitelist your domain (and `http://localhost:3000`) in your OAuth provider's **Allowed Redirect URIs** list.*

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
1. Fork the project.
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`).
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`).
4. Push to the branch (\`git push origin feature/AmazingFeature\`).
5. Open a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
