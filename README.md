# LineBalancer AI

## 🧠 Autonomous Bottleneck & Throughput Optimizer

An AI-powered agent system that detects bottlenecks, predicts delays, and recommends line reconfiguration — like a senior industrial engineer in software.



---

## ✨ Core Capabilities

### 🔍 Bottleneck Detection Agent
- **Automatic Detection**: Finds stations causing delay using statistical analysis
- **Shift-Based Analysis**: Identifies shift or operator-based slowdowns
- **Pattern Recognition**: Detects pattern changes automatically
- **Root Cause Analysis**: AI-powered identification of why bottlenecks occur
- **Confidence Scoring**: Each finding includes confidence levels and evidence

### 🔮 What-If Simulation
Ask questions like *"What if we add 1 operator to Station 3?"* and the agent simulates throughput impact using historical data.

- Operator addition/removal simulation
- Cycle time change modeling
- Line efficiency projections
- Bottleneck shift prediction

### ⚠️ Early Warning System
Predicts slowdowns before they happen using trend analysis and pattern detection.

- Trend-based delay prediction
- Equipment degradation alerts
- Quality drift warnings
- Maintenance scheduling recommendations

### 🧠 Natural Language Queries
Ask questions in plain English:
- *"Which station hurt output most last week?"*
- *"Compare performance across shifts"*
- *"What's causing downtime at the welding station?"*

The agent translates your question to SQL, executes it, and provides a clear explanation.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS with custom industrial theme |
| **Charts** | Recharts |
| **Database** | SQLite (better-sqlite3) |
| **AI Agent** | Custom reasoning engine with NLP parser |
| **Icons** | Lucide React |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/linebalancer-ai.git
   cd linebalancer-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Seed the database**
   ```bash
   npm run seed
   ```
   This creates a SQLite database with 30 days of realistic manufacturing data including:
   - 10 production stations
   - 30+ operators across 3 shifts
   - ~50,000 production records
   - Pre-configured alerts and simulations

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
linebalancer-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── alerts/        # Alert management
│   │   │   ├── bottlenecks/   # Bottleneck analysis
│   │   │   ├── metrics/       # Dashboard metrics
│   │   │   ├── query/         # NLP query processing
│   │   │   ├── simulate/      # What-if simulation
│   │   │   ├── stations/      # Station data
│   │   │   └── trends/        # Trend data
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main dashboard
│   ├── components/            # React components
│   │   ├── AlertsPanel.tsx    # Active alerts display
│   │   ├── BottleneckPanel.tsx # Bottleneck analysis
│   │   ├── Header.tsx         # Navigation header
│   │   ├── MetricsGrid.tsx    # KPI metrics
│   │   ├── NLPQueryPanel.tsx  # Natural language interface
│   │   ├── ProductionLine.tsx # Line visualization
│   │   ├── SimulationPanel.tsx # What-if simulator
│   │   └── TrendChart.tsx     # Performance trends
│   ├── lib/                   # Core libraries
│   │   ├── agent.ts           # AI reasoning engine
│   │   ├── database.ts        # SQLite operations
│   │   ├── seed-database.ts   # Data generation
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript definitions
│       └── index.ts           # All type definitions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🔌 API Reference

### GET `/api/metrics`
Returns dashboard KPIs including OEE, throughput, efficiency, and alert counts.

### GET `/api/stations`
Returns all stations with current metrics (cycle time, utilization, defect rate).

### GET `/api/bottlenecks`
Returns detailed bottleneck analysis with root causes and recommendations.

### GET `/api/alerts`
Returns active alerts sorted by severity.

### POST `/api/alerts/[id]/acknowledge`
Acknowledges and resolves an alert.

### POST `/api/query`
Processes natural language queries.
```json
{
  "query": "Which station hurt output most last week?"
}
```

### POST `/api/simulate`
Runs what-if simulation.
```json
{
  "changes": [
    {
      "type": "add_operator",
      "stationId": "ST003",
      "value": 1,
      "description": "Add 1 operator to Welding Cell"
    }
  ]
}
```

### GET `/api/trends`
Returns trend data for charts.
- `metric`: cycle_time | throughput | defect_rate
- `hours`: Time range (default: 168)
- `stationId`: Optional filter

---

## 🎨 Design Philosophy

The UI follows an **industrial-grade** aesthetic designed for:
- **Operator-friendly**: Large touch targets, clear visual hierarchy
- **At-a-glance status**: Color-coded severity, real-time indicators
- **Dark theme**: Reduces eye strain in factory environments
- **Responsive**: Works on control room displays and tablets

---

## 🤖 Agent Architecture

The AI agent uses a **structured reasoning approach**:

1. **Query Parsing**: Natural language → intent + entities
2. **SQL Generation**: Intent → optimized SQL query
3. **Data Analysis**: Statistical analysis of results
4. **Root Cause Inference**: Pattern matching + confidence scoring
5. **Recommendation Generation**: Evidence-based suggestions
6. **Response Synthesis**: Clear, actionable explanations

---

## 📊 Data Model

### Stations
- Production line positions with target cycle times
- Status tracking (running, idle, maintenance, blocked)

### Operators
- Skill levels and efficiency ratings
- Shift assignments (day, night, swing)

### Production Records
- Cycle time measurements
- Defect counts
- Downtime with reasons

### Alerts
- Type-based categorization
- Severity levels with acknowledgment workflow

---

## 🔮 Future Enhancements

- [ ] Real-time data streaming via WebSockets
- [ ] Integration with PLCs and SCADA systems
- [ ] Advanced ML models for prediction
- [ ] Multi-line support
- [ ] Role-based access control
- [ ] Export reports to PDF
- [ ] Mobile-native app

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with modern web technologies and inspired by real-world manufacturing optimization challenges.

---

**LineBalancer AI** — *Turning data into decisions, bottlenecks into breakthroughs.*
