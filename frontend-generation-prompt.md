# Frontend Generation Prompt for ChatGPT

Use this prompt with ChatGPT to generate a modern, beautiful frontend for the AI Multiplayer Game.

---

## Your Task

Create a modern, polished frontend for an AI-powered multiplayer game built with React + TypeScript + Vite + Convex. The game is fully functional but needs a beautiful, professional UI/UX redesign with smooth animations, modern styling, and excellent user experience.

## Tech Stack

- **React 18** with TypeScript
- **Vite** as the build tool
- **Convex** for real-time backend (using `useQuery`, `useMutation`, `useAction` hooks)
- **CSS** for styling (no CSS frameworks, but use modern CSS features like CSS variables, gradients, animations)
- Existing utilities in `src/utils/storage.ts` for localStorage token management

## Game Flow & Components

### 1. **Lobby Component** (`src/components/Lobby.tsx`)
**Current Functionality:**
- Player name input field
- "Create Room" button that generates a 6-character game code
- "Join Room" form with game code input (6 alphanumeric characters, auto-uppercase)
- Error messages for validation failures
- Uses `api.games.createRoom` and `api.games.joinRoom` mutations
- Stores player token in localStorage on first interaction

**Required Design:**
- Modern landing page aesthetic with gradient backgrounds
- Animated logo/title area
- Card-based layout with glassmorphism or subtle shadows
- Large, prominent input fields with floating labels or modern styling
- Smooth button hover effects and loading states
- Error messages with smooth slide-in animations
- Responsive design for mobile and desktop
- "OR" divider between create/join options (make it visually appealing)

### 2. **Waiting Room Component** (`src/components/WaitingRoom.tsx`)
**Current Functionality:**
- Displays game code prominently (for sharing)
- Real-time player list (updates via Convex queries)
- Shows which player is the host
- "Start Game" button (only visible to host, disabled if < 1 player)
- Waiting message for non-host players
- Uses `api.games.getRoom` query and `api.games.startGame` mutation

**Required Design:**
- Game code displayed in large, monospace font with a copy-to-clipboard button
- Animated game code display (subtle pulse or glow effect)
- Player cards with avatars/icons, smooth animations when players join
- Host badge with distinctive styling
- Start game button with attractive hover/active states
- Waiting indicator with subtle animation
- Real-time updates should feel smooth (no jarring re-renders)
- Share game code functionality with share icon/button

### 3. **Game Screen Component** (`src/components/GameScreen.tsx`)
**Current Functionality:**
- Displays round number (1-6) and total rounds
- Shows current scenario description
- Prompt input textarea with submit button
- Real-time status indicators ("prompt", "judging", "results")
- Results display showing all submissions with winner/loser status
- Scoreboard showing player rankings
- Next round button (host only)
- Game finished screen with final rankings

**Required Design:**
- **Round Header:** Elegant round indicator with progress bar/stepper showing round X of 6
- **Scenario Card:** Beautiful card design with iconography, readable typography, subtle animations
- **Prompt Input Area:**
  - Large, comfortable textarea with character count if desired
  - Hint text about sabotaging with @mentions
  - Submit button with loading states
  - "Submitted" confirmation with checkmark animation
  - Disable editing after submission
- **Judging State:** Animated loading indicator (spinner, progress dots, or skeleton screens)
  - Message: "AI is evaluating all submissions..."
  - Make it feel active and engaging
- **Results Display:**
  - Cards for each submission with smooth reveal animations
  - Winner cards with distinctive styling (gold accent, success colors)
  - Loser cards with appropriate styling
  - Show prompt text, outcome text, and win/loss badge
  - Highlight current player's submission
  - Animate results appearing in sequence
- **Scoreboard:**
  - Clean, modern leaderboard design
  - Top player highlighted with crown/medal icon
  - Smooth position changes on updates
  - Show "You" indicator for current player
- **Game Finished:**
  - Celebration-style final screen
  - Winner announcement with confetti or similar effect
  - Final leaderboard with emphasis on winner
- Responsive layout that works on mobile and desktop

### 4. **App Component** (`src/App.tsx`)
**Current Functionality:**
- Router logic switching between Lobby, WaitingRoom, and GameScreen
- Checks for player token on mount
- Auto-advances screens based on room status changes
- Uses Convex queries for real-time updates

**Required Design:**
- Smooth transitions between screens (fade, slide, or other transitions)
- Consistent layout wrapper with app header/navigation if desired
- Loading states handled gracefully

## Design System Requirements

### Color Palette
Create a modern color scheme with:
- Primary brand color (can be the existing #646cff or choose something vibrant)
- Success/winner colors (greens)
- Error/loser colors (reds)
- Neutral backgrounds with good contrast
- Support both light and dark mode (existing CSS variables in `index.css`)
- Use CSS custom properties for theming

### Typography
- Modern, readable font stack
- Clear hierarchy (h1, h2, body text)
- Appropriate font sizes for mobile and desktop
- Consider using system fonts or Google Fonts

### Spacing & Layout
- Consistent spacing scale (e.g., 4px, 8px, 16px, 24px, 32px)
- Max-width containers for content areas (responsive)
- Generous padding on mobile
- Card-based layouts with proper shadows/borders

### Animations & Interactions
- Smooth transitions on hover, focus, and active states
- Button press animations
- Loading spinners/indicators
- Slide-in animations for new content
- Stagger animations for lists (e.g., player list, results)
- Subtle background animations (gradients, particles optional)

### UI Components to Enhance
- **Buttons:** Modern, rounded, with hover effects, disabled states, loading spinners
- **Input Fields:** Clean borders, focus states with glow, placeholder styling
- **Cards:** Subtle shadows, hover effects if interactive, border radius
- **Badges:** Winner/loser badges, host badges, round indicators
- **Icons:** Use Unicode emoji or consider icon library (optional, not required)

## Technical Requirements

1. **Keep all existing functionality** - Don't break any Convex queries/mutations
2. **Preserve TypeScript types** - All props and component interfaces should remain typed
3. **Use existing storage utilities** - Don't modify `storage.ts`
4. **Real-time updates** - Ensure Convex queries trigger smooth re-renders
5. **Error handling** - Maintain existing error handling with better visual presentation
6. **Accessibility** - Use semantic HTML, proper labels, keyboard navigation
7. **Performance** - Optimize re-renders, use React best practices
8. **Responsive** - Mobile-first design that scales to desktop

## Specific Features to Implement

1. **Copy Game Code Button:** Add clipboard functionality to game code in WaitingRoom
2. **Share Functionality:** Add Web Share API for game code (optional, with fallback)
3. **Character Count:** Optional character counter for prompt textarea
4. **@Mention Highlighting:** Optionally highlight @mentions in prompt text
5. **Smooth State Transitions:** Add CSS transitions for status changes (prompt → judging → results)
6. **Loading States:** All async operations should show appropriate loading indicators
7. **Empty States:** Handle cases where no players exist, no submissions, etc.

## CSS Organization

- Update `src/index.css` with global styles, CSS variables, and theme support
- Update `src/App.css` if needed for app-level styles
- Inline styles are acceptable if well-organized, OR create component-specific CSS modules/files
- Use CSS custom properties (CSS variables) for theming

## What NOT to Change

- Don't modify Convex backend functions
- Don't change the data structure or API contracts
- Don't remove any existing features
- Don't change the routing logic in App.tsx structure

## Deliverables

Provide complete, ready-to-use code for:
1. `src/components/Lobby.tsx` - Fully redesigned
2. `src/components/WaitingRoom.tsx` - Fully redesigned
3. `src/components/GameScreen.tsx` - Fully redesigned
4. `src/App.tsx` - Updated if needed for transitions
5. `src/index.css` - Enhanced global styles and theme
6. `src/App.css` - Updated if needed

## Style Inspiration

Think of modern gaming apps, party games (like Jackbox), or creative AI tools. The design should feel:
- **Fun and engaging** (it's a game!)
- **Modern and polished** (professional quality)
- **Clear and intuitive** (easy to understand at a glance)
- **Responsive and fast** (smooth animations, no jank)

Make it look like a product you'd be proud to show off!

---

**Start by reviewing the existing code structure, then provide complete, production-ready components with modern styling and excellent UX.**

