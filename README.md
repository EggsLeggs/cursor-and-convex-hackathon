# Prompt Puppeteer

**AI and Convex powered multiplayer prompt battles**

🌐 **Live at**: [robot.thinkhuman.dev](https://robot.thinkhuman.dev)

A real-time multiplayer game where players compete to complete creative scenarios by crafting the perfect AI prompts. Each round, players receive a unique challenge and must write prompts that would successfully complete the scenario. An AI judge evaluates all submissions and determines the winners based on creativity, feasibility, and effectiveness.

## 🎮 How to Play

1. **Create or Join a Room**
   - Host a new game or enter a 6-character game code to join an existing room
   - Rooms support up to 6 players

2. **Start the Game**
   - The host can start the game once players have joined
   - Each game consists of 6 rounds

3. **Complete Scenarios**
   - Each round presents a unique scenario (e.g., "Herd the geese into the paddock", "Cross the raging river without getting wet")
   - Write a prompt that would successfully complete the scenario
   - Be creative! The AI judge evaluates your solution

4. **Sabotage Your Opponents**
   - Mention other players using `@Name` in your prompt to sabotage their attempts
   - The AI judge considers the logical sequence of events when evaluating sabotaged prompts

5. **Win Rounds**
   - After all players submit, the AI judge evaluates each prompt
   - Winners receive a point and advance on the scoreboard
   - The player with the most points after 6 rounds wins!

## ✨ Features

- **Real-time Multiplayer**: Powered by Convex for instant synchronization
- **AI-Powered Judging**: Uses OpenAI GPT-4o-mini to evaluate prompt effectiveness
- **Creative Scenarios**: 10+ unique challenges ranging from mundane to fantastical
- **Sabotage Mechanics**: Strategically mention other players to disrupt their plans
- **Live Scoreboard**: Track your progress and see who's winning
- **Room Management**: Host controls with ability to kick players
- **Responsive Design**: Beautiful UI that works on desktop and mobile

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend
- **Convex** - Real-time backend with automatic API generation
  - Real-time queries and mutations
  - Automatic type generation
  - Built-in authentication and data sync

### AI
- **OpenAI GPT-4o-mini** - AI judge for evaluating prompts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Convex account (sign up at [convex.dev](https://convex.dev))
- An OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cusror-x-convex-hackathon
   ```

2. **Install dependencies**
   ```bash
   cd my-app
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (or link to existing)
   - Generate API types
   - Start the development backend

4. **Configure environment variables**
   
   Set your OpenAI API key in Convex:
   ```bash
   npx convex env set OPENAI_API_KEY <your-openai-api-key>
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📁 Project Structure

```
my-app/
├── convex/              # Convex backend
│   ├── games.ts        # Game logic and room management
│   ├── players.ts      # Player management
│   ├── scenarios.ts    # Scenario seeding and retrieval
│   ├── openai.ts       # AI judging logic
│   └── schema.ts       # Database schema
├── src/
│   ├── components/     # React components
│   │   ├── GameScreen.tsx
│   │   ├── Lobby.tsx
│   │   └── ui/         # Reusable UI components
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main app component
└── public/             # Static assets
```

## 🎯 Game Mechanics

### Scenarios
Each round features a randomly selected scenario with a description. Players must craft a prompt that would successfully complete the scenario.

### Judging
The AI judge evaluates each prompt based on:
- **Creativity**: How innovative and original the solution is
- **Feasibility**: Whether the prompt would actually work
- **Effectiveness**: How well it addresses the scenario requirements

### Scoring
- Players earn 1 point for each round they win
- The player with the highest score after 6 rounds wins the game
- Ties are possible (multiple winners)

### Sabotage
Players can mention other players in their prompts using `@PlayerName`. The AI judge considers the logical sequence of events, so mentioning another player might cause their prompt to interact with yours in unexpected ways.

## 🚢 Deployment

The app is deployed at [robot.thinkhuman.dev](https://robot.thinkhuman.dev).

### Deploying to Convex

```bash
npx convex deploy --cmd 'npm run build'
```

This will:
1. Build the frontend
2. Deploy the Convex backend
3. Configure the production environment

Make sure to set production environment variables:
```bash
npx convex env set OPENAI_API_KEY <your-openai-api-key> --prod
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Add new scenarios

## 📝 License

This project was created for the Cursor x Convex Hackathon.

## 🙏 Acknowledgments

- Built with [Convex](https://convex.dev) for real-time backend
- Powered by [OpenAI](https://openai.com) for AI judging
- UI components from [Radix UI](https://radix-ui.com)
- Icons from [Lucide](https://lucide.dev)

---

**Have fun and may the best prompt win! 🎉**
