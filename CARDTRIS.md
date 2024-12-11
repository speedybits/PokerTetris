# Cardtris - A Card-Based Tetris Variant

## Game Overview
Cardtris combines the falling-block mechanics of Tetris with poker hand evaluation using a standard 52-card deck. Players must strategically place falling cards to create winning poker hands while managing the game board. The game features a progressive level system where each complete cycle through the 52-card deck increases the level, adding both challenge and scoring opportunities.

## Core Display Specifications

### Screen Elements
- Game info display: top-right corner (10% of viewport height). Two rows of text:
  - First row: Current level and cards left until next level (e.g., "Level 3 (4 cards left)")
  - Second row: Current score value
- Next card preview: top-left corner (10% of viewport height... 1:2 aspect ratio)
- Board: centered on screen below Next card preview and Game info display
- Quick Drop button: below board (10% of viewport height)
- Touch areas: left/right sides of screen

### Board Layout
- Dimensions: 5 columns × 10 rows of cells (5:10 ratio)
- Each cell must have 1:2 aspect ratio (width:height)
- Initial board width: 90vw
- Initial board height: 180vw (90vw * 2)
- Maximum board height: 80vh
- Board width adjusts to maintain ratio when max-height is reached
- Grid styling:
  - Gap between cells: 1px
  - Border: 3px solid #ffd700 with inner shadow
  - Padding: 4px inside border
  - Cell hover: subtle golden glow effect
- Background: gradient from #1a0f2e to #2c1654

### Card Layout
- Each card must fit inside a cell
- Aspect ratio: 1:2 (width:height)
- Card width: 96% of cell width
- Card height: card width * 2
- Card position: centered in cell (transform: translate(-50%, -50%))
- Card padding: 8% vertical, 4% horizontal
- Card text:
  - Value: positioned at top half of the card, font-size as large as possible while still fitting
  - Suit: positioned at bottom half of the card, font-size as large as possible while still fitting
  - Colors: red for hearts/diamonds, black for clubs/spades
  - Values displayed as: A (1), 2-10, J (11), Q (12), K (13)
  - Suits displayed as: ♥ ♦ ♣ ♠

## Visual Design
- Dark theme with gradient background (#1a0f2e to #2c1654)
- Neon-style effects with golden (#ffd700) and pink (#ff00de) accents
- Card animations for matching and removal effects
- Responsive text sizing using clamp() and viewport units
- Smooth transitions and hover effects
- Blur effects on overlays using backdrop-filter

## Display Requirements
- Optimized for mobile devices in portrait orientation
- Landscape orientation shows a warning message to rotate device
- Next card preview and score display in top corners
- Cards sized appropriately for touch interaction
- Responsive design that works on all mobile devices
- Touch interaction disabled for smoother gameplay
- No user selection or callouts allowed

## Game Screens

### Start Screen
- High scores displayed at the top (top 5 scores with initials)
- Large "Start Game" button with gradient effect
- Neon glow effects on button hover
- Each high score shows:
  - Player initials (3 characters)
  - Score
  - Date achieved
- High scores panel with translucent background
- Golden border and shadow effects

### Game Screen
- Width: 5 cards
- Height: 10 cards
- Cards fall one at a time from the top of the board
- Players can move cards left/right as they fall
- Game info panels in top corners showing:
  - Next card preview (left)
  - Level and score info (right, two rows)
- Quick Drop button at bottom
- Touch areas for left/right movement
- Translucent panels with blur effect

### Game Over Screen
- Shows final score with large display
- Prompts for initials with custom input styling
- Translucent dark overlay
- After entering initials:
  - Score is saved if it makes the top 5
  - Returns to start screen
- "New High Score" message with golden text

## Card Design
- White gradient background
- Red color for hearts and diamonds
- Black color for clubs and spades
- Card number at top
- Large suit symbol in center
- Subtle inner shadow effect
- Hover animation with scale and glow
- Matching animation with golden pulse
- Explosion animation when removed

## Animations
- Card Match:
  - Golden pulse effect
  - Scale transform
  - Gradient background shift
- Card Explosion:
  - Rotate and scale
  - Opacity fade
  - Color shift
  - Multiple shadow layers
- Button Hover:
  - Scale transform
  - Enhanced glow effect
- Score Notification:
  - Pop-in scale effect
  - Slide transition

## Gameplay Mechanics

### Card Movement
- Cards fall automatically at a steady rate
- A card stops falling when it:
  - Reaches the bottom of the board
  - Lands on top of another card
- Once a card stops, it locks in place and a new card appears at the top
- Player can:
  - Tap left or right of card to move one column in that direction
  - Use Quick Drop button to instantly drop card to lowest position in current column

### Hand Formation and Effects
- Valid poker hands can be formed in two ways:
  - 5 cards in a horizontal row
  - 5 cards in a vertical column
- When a valid poker hand is formed by a card that settles on top of an existing card, or settles on the bottom of the board:
  - The cards that make up the hand pulse with a golden glow (Eg. If the 5th card completes a pair, only the pair pulses with a golden glow)
  - If the hand is valid for the current level:
    - Game pauses until the animation finishes
    - Notification appears showing hand type and points earned
    - Cards "explode" with animation and are removed
    - Cards above fall down to fill empty spaces
  - If the hand is not valid for the current level:
    - Cards pulse with golden glow briefly
    - Notification appears for 3 seconds showing what hand was not matched (e.g., "Level 3: Two Pair not matched!")
    - Cards remain on the board
- Multiple hands can be evaluated simultaneously
- After cards are removed:
  - Cards above fall down to fill empty spaces
  - Cards continue falling until they hit another card or the bottom
  - Multiple cards can fall simultaneously
  - New matches can form after cards fall
- Matched cards that are removed are returned to the deck

### Level System
- Players start at Level 1
- Each time all 52 cards are used, the level increases by 1
- Each level affects gameplay in two ways:
  1. Point Multiplier:
     - Level 1: 1x points
     - Level 2: 2x points
     - Level 3: 3x points
     - Level 4: 4x points
     - Level 5: 5x points
     - And so on (adding 1x per level)
     - All point calculations are rounded up to the nearest integer
  2. Hand Restrictions:
     - Level 1: All poker hands are valid (except high card)
     - Level 2: Pairs no longer count
     - Level 3: Two Pairs also no longer count
     - Level 4: Three of a Kind also no longer count
     - Level 5: Straight also no longer count
     - Level 6: Flush also no longer count
     - Level 7: Full House also no longer count
     - Level 8: Four of a Kind also no longer count
     - Level 9+: Only Royal Flush and Straight Flush count

### Scoring System
Base points for poker hands (before level multiplier):
- Royal Flush: 2000 points
- Straight Flush: 1000 points
- Four of a Kind: 500 points
- Full House: 300 points
- Flush: 200 points
- Straight: 150 points
- Three of a Kind: 100 points
- Two Pair: 50 points
- One Pair: 25 points

Final points are calculated by multiplying the base points by the level multiplier and rounding up to the nearest integer.

## Technical Implementation

### Game Engine
- Base drop interval: 500ms
- Minimum drop interval: 200ms
- Pause system for animations and matches
- RequestAnimationFrame-based game loop
- Collision detection system
- Gravity simulation for falling cards

### Controls
- Touch controls:
  - Left/right touch areas for movement
  - Quick Drop button below the board for instant placement
- Mouse controls (for testing):
  - Click left/right areas for movement
- Spacebar: Alternative control for Quick Drop (for testing)

### Card System
- Standard 52-card deck implementation
- Automatic deck reshuffling when empty
- Card properties:
  - Suit (hearts, diamonds, clubs, spades)
  - Value (1-13, with face cards)
  - Color (red for hearts/diamonds)
- Card return system after matches

### High Score System
- Local storage persistence
- Maximum of 5 high scores
- Score entry validation
- Automatic sorting
- Date tracking for each score
- Real-time score updates
- Score format:
  - Player initials (3 characters)
  - Score value
  - Date achieved

### Match Detection
- Horizontal and vertical hand checking
- Poker hand evaluation:
  - Royal Flush (2000 points)
  - Straight Flush (1000 points)
  - Four of a Kind (500 points)
  - Full House (300 points)
  - Flush (200 points)
  - Straight (150 points)
  - Three of a Kind (100 points)
  - Two Pair (50 points)
  - One Pair (25 points)
- Special case handling:
  - Ace-high straights
  - Multiple simultaneous matches
  - Cascading matches after gravity

### Animation System
- Match animations:
  - Duration: 4 seconds total
  - Initial scale and color change
  - Pulsing effect
  - Explosion and removal
- Gravity animations:
  - 500ms settling time
  - Smooth card falling
- Score notifications:
  - Pop-in animation
  - Auto-removal after matches
- Multiple simultaneous animations handling

### Performance Optimizations
- Touch event optimization:
  - Passive event listeners where possible
  - Prevention of default behaviors
  - Touch action none for smoother play
- Efficient board updates:
  - Grid-based rendering
  - Minimal DOM updates
  - RequestAnimationFrame synchronization

## Game Over Conditions
The game ends when:
- Cards stack up to the top of the board
- No more valid moves are possible

## Strategy Tips
- Plan ahead for potential poker hands
- Keep track of cards that have appeared
- Create opportunities for multiple hand combinations
- Manage board space efficiently to prevent stacking
- Consider both horizontal and vertical hand possibilities

## Controls
- Tap left/right: Move card one column in that direction
- Quick Drop button: Drop card instantly to lowest position in current column
- Spacebar: Alternative control for Quick Drop (for testing)

## Special Features
- Next card preview
- Score tracking
- Multiple hand evaluation
- Cards from completed hands return to deck
- High score tracking with initials
- Persistent storage of high scores
- Visual feedback for poker hands:
  - Hand type notification
  - Points earned display
  - Card highlight effects
  - Explosion animations

## Deck Management
- Uses a standard 52-card deck (no jokers)
- Each card appears exactly once in the deck
- Cards are uniquely identified by:
  - Suit (hearts ♥, diamonds ♦, clubs ♣, spades ♠)
  - Value (A=1, 2-10, J=11, Q=12, K=13)
- When cards are matched and removed from the board:
  - They are returned to the deck
  - The deck is reshuffled when empty
- Duplicate cards are impossible by design