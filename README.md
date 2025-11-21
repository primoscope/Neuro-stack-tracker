# 🧬 NeuroStack V2 - Universal Nootropic Tracker

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/primoscope/Neuro-stack-tracker)

A production-ready, **offline-first** web application for tracking medications, supplements, and nootropics. Built for bio-hackers who need detailed correlation analysis between their stacks and mental state.

## ✨ Key Features

### 🏪 Dynamic "Pharmacy" System
- Add **any compound** (Bromantane, Taurine, Agmatine, Pregabalin, etc.)
- Custom dosing units (mg, g, ml, mcg, pills)
- Color-coded for quick visual identification
- Active/inactive toggle for compounds

### ⚡ One-Tap Stack Presets
- Create pre-configured compound combinations
- Example: "Morning Protocol" = Agmatine + Memantine + Pregabalin
- Quick log with a single tap
- Save time on repetitive daily logging

### 📊 Advanced Visualization
- **Trends Chart**: Overlay anxiety and functionality scores with daily dosages
- **GitHub-Style Heatmap**: See your logging consistency at a glance
- Interactive tooltips showing exact values
- 30-day rolling view

### 🤖 AI-Powered Analysis
- Integrate with Google Gemini API
- Analyze correlations: "Does Compound X reduce anxiety 2 hours later?"
- Pattern recognition across your entire history
- Client-side processing - your data never leaves your browser

### 🔐 Privacy-First Design
- **Zero backend** - all data in LocalStorage
- PIN-based authentication (4-digit)
- Export/Import functionality for backups
- No external database required

## 🚀 Quick Start

### Deploy to Vercel (Recommended)
1. Click the "Deploy with Vercel" button above
2. Vercel will clone the repo and deploy automatically
3. Visit your new app URL and set your 4-digit PIN
4. Start tracking!

### Local Development
```bash
# Clone the repository
git clone https://github.com/primoscope/Neuro-stack-tracker.git
cd Neuro-stack-tracker

# Install dependencies
npm install

# Run the development server
npm run dev

# Open http://localhost:3000
```

## 📖 How to Use

### First-Time Setup
1. **Set Your PIN**: On first launch, create a 4-digit security PIN
2. **Add Compounds**: Go to Settings → Pharmacy → Add your supplements/medications
3. **Create Presets** (Optional): Combine compounds into quick-log stacks
4. **Start Logging**: Use the floating action button (FAB) or preset buttons

### Daily Workflow
1. **Quick Log**: Tap a preset button ("Morning Stack", "Night Protocol")
2. **Rate Your State**: Set anxiety (1-10) and functionality (1-10) sliders
3. **Add Notes** (Optional): Document observations or context
4. **Save**: Data is instantly persisted to LocalStorage

### Data Management
- **Export**: Download your entire history as JSON (Settings → Data Management)
- **Import**: Restore from a backup file
- **AI Analysis**: Configure Gemini API key to get trend insights

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom Shadcn UI Components
- **State**: Zustand with LocalStorage persistence
- **Charts**: Recharts + react-activity-calendar
- **Icons**: Lucide React
- **Deployment**: Vercel (zero-config)

## 🎨 Design Philosophy

**Dark Mode Bio-Hacker Aesthetic**
- Background: Deep Slate (`#020617`)
- Glassmorphism effects with backdrop blur
- Color-coded metrics:
  - 🔴 Anxiety (Neon Red `#ff4444`)
  - 🟢 Functionality (Emerald `#10b981`)
  - 🔵 Dosage (Electric Blue `#3b82f6`)

## 🔒 Security & Privacy

- **No Server**: All computation happens in your browser
- **No Tracking**: Zero analytics or third-party scripts
- **Local PIN**: Authentication without accounts
- **Exportable Data**: You own your data completely

## 📱 Mobile-First Design

- Large touch targets (min 44px)
- Responsive charts and heatmaps
- Optimized for iOS Safari and Chrome
- Progressive Web App (PWA) ready

## 🤝 Contributing

Contributions are welcome! This is an open-source project designed to help the bio-hacking community.

## 📄 License

MIT License - feel free to fork and customize for your own tracking needs.

## ⚠️ Disclaimer

This app is for informational purposes only. Always consult with healthcare professionals before starting, stopping, or modifying any medication or supplement regimen.

---

**Built with 🧠 for bio-hackers, by bio-hackers.**
