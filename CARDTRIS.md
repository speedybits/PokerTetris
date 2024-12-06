# Cardtris - A Card-Based Tetris Variant

## Game Overview
Cardtris combines the falling-block mechanics of Tetris with poker hand evaluation using a standard 52-card deck. Players must strategically place falling cards to create winning poker hands while managing the game board.

## Display Requirements
- Optimized for iPad screens in portrait orientation only
- Game board fills the majority of the screen height
- Next card preview and score display at the top of screen
- Cards sized appropriately for touch interaction
- Minimum supported resolution: 1024x768 (iPad)
- Maximum board width of 500px for larger screens

## Game Screens

### Start Screen
- High scores displayed at the top (top 5 scores with initials)
- Large "Start Game" button centered at the bottom of screen
- Each high score shows:
  - Player initials (3 characters)
  - Score
  - Date achieved

### Game Screen
- Width: 7 cards
- Height: 15 cards
- Cards fall one at a time from the top of the board
- Players can move cards left/right as they fall

### Game Over Screen
- Shows final score
- Prompts for player initials (3 characters)
- After entering initials:
  - If score makes the top 5, shows "New High Score!"
  - Returns to start screen after 3 seconds

## Gameplay Mechanics

### Card Movement
- Cards fall automatically at a steady rate
- A card stops falling when it:
  - Reaches the bottom of the board
  - Lands on top of another card
- Once a card stops, it locks in place and a new card appears at the top
- Player can:
  - Tap left or right of card to move one column in that direction
  - Tap the card to instantly drop it to lowest position in current column

### Hand Formation
- Valid poker hands can be formed in two ways:
  - 5 cards in a horizontal row
  - 5 cards in a vertical column
- Multiple hands can be evaluated simultaneously if formed
- Cards not part of a winning hand remain on the board
- Matched cards are removed and returned to the deck

### Scoring System
Poker hand rankings and their corresponding points:
- Royal Flush: 2000 points
- Straight Flush: 1000 points
- Four of a Kind: 500 points
- Full House: 300 points
- Flush: 200 points
- Straight: 150 points
- Three of a Kind: 100 points
- Two Pair: 50 points
- One Pair: 25 points

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
- Tap card: Drop card instantly in current column

## Special Features
- Next card preview
- Score tracking
- Multiple hand evaluation
- Cards from completed hands return to deck
- High score tracking with initials
- Persistent storage of high scores