Feature: Cardtris Game
  As a player
  I want to play a card-based version of Tetris
  So that I can create poker hands and score points

  Background:
    Given the game is loaded on a mobile device in portrait mode
    And the game board is 5 cards wide and 10 cards tall
    And I have a standard 52-card deck shuffled
    And each cell has a 1:2 aspect ratio
    And there is a 1px gap between cells

  Scenario: Start Screen Display
    Given I am on the start screen
    Then I should see the top 5 high scores at the top
    And each high score should show initials, score, and date
    And I should see a "Start Game" button with gradient effect
    And the high scores should have a translucent background with golden border
    When I tap the "Start Game" button
    Then the game should begin

  Scenario: Game Display Layout
    Given I am playing the game
    Then the game board should be maximum 75vh in height
    And the board width should be half its height
    And the board should have a 3px solid golden border with inner shadow
    And the next card preview should be visible in the top-right corner
    And the current score should be visible in the top-left corner
    And the Quick Drop button should be visible below the board
    And the background should have a gradient from #1a0f2e to #2c1654
    And I should see touch areas on the left and right sides
    And I should see a landscape orientation warning if device is rotated

  Scenario: Card Display
    Given a card is on the board
    Then the card should fit inside its cell
    And the card should have a 1:2 aspect ratio
    And the card width should be 96% of the cell width
    And the card should be centered in the cell
    And the card should have 8% vertical padding and 4% horizontal padding
    And hearts and diamonds should be displayed in red
    And clubs and spades should be displayed in black
    And the card value should be displayed at the top half
    And the suit symbol should be displayed at the bottom half
    When the card is part of a match
    Then it should show a golden pulse effect

  Scenario: Game Speed
    Given I am playing the game
    Then cards should initially fall every 500ms
    And the minimum fall interval should be 200ms

  Scenario: Deck Management
    Given I am playing the game
    When all cards from the deck have been used
    Then the deck should be automatically reshuffled
    And matched cards should be returned to the deck for reuse

  Scenario: Card Movement
    Given a card is falling
    When I tap the screen left or right
    Then the card should move one column in that direction
    And the card should snap to the nearest column

  Scenario: Quick Drop
    Given a card is falling
    When I tap the card
    Then the card should instantly drop to the lowest possible position in that column

  Scenario: Card Landing
    Given a card is falling
    When the card reaches the bottom of the board
    Then the card should lock in place
    And a new card should appear at the top
    
    Given a card is falling
    When the card lands on top of another card
    Then the card should lock in place
    And a new card should appear at the top

  Scenario: Gravity After Matches
    Given there are cards stacked on the board
    When cards are removed due to a poker hand match
    Then any cards above the removed cards should fall down
    And cards should continue falling until they hit another card or the bottom
    And multiple cards should be able to fall simultaneously
    
    Given cards have fallen after a match
    When the cards finish falling
    Then they should lock in their new positions
    And any new poker hands formed should be evaluated

  Scenario: Match Animations
    Given a poker hand is formed
    Then the matching cards should pulse with a golden glow for 4 seconds total
    And the cards should show a scale and color change
    And finally show an explosion animation before removal
    And score notifications should pop in with animation
    And score notifications should auto-remove after matches

  Scenario: Forming Poker Hands
    Given there are cards placed on the board
    When 5 cards form a valid poker hand horizontally or vertically
    Then the game should pause for 3 seconds
    And the matching cards should pulse with a golden glow
    And I should see a notification showing the hand type and points earned
    And after 3 seconds the cards should explode with animation
    And those cards should be removed
    And any cards above the removed cards should fall down
    And the cards should be returned to the deck
    And I should receive points based on the poker hand value

  Scenario: Chain Reactions
    Given a poker hand is formed and removed
    When cards fall down to fill the empty spaces
    Then any new poker hands formed by the falling cards should be evaluated
    And this process should continue until no new hands are formed
    And points should be awarded for all hands in the chain

  Scenario Outline: Scoring System
    Given I form a <hand_type> poker hand
    Then the game should pause for 3 seconds
    And I should see a notification showing "<hand_type>: <points> points!"
    And I should receive <points> points

    Examples:
      | hand_type     | points |
      | Royal Flush   | 2000   |
      | Straight Flush| 1000   |
      | Four of a Kind| 500    |
      | Full House    | 300    |
      | Flush         | 200    |
      | Straight      | 150    |
      | Three of a Kind| 100   |
      | Two Pair      | 50     |
      | One Pair      | 25     |

  Scenario: Game Over
    Given cards are stacked on the board
    When the stack reaches the top of the board
    Then the game should end
    And I should see a translucent dark overlay
    And I should see my final score with large display
    And I should be prompted to enter my initials
    When I enter my initials
    Then my score should be saved if it's in the top 5
    And I should return to the start screen

  Scenario: Alternative Game Over
    Given I am playing the game
    When no more valid moves are possible
    Then the game should end
    And the game over sequence should begin

  Scenario: New High Score
    Given I have achieved a top 5 score
    When I enter my initials
    Then I should see a "New High Score" message in golden text
    And my score should appear in the high scores list
    And I should return to the start screen

  Scenario: Multiple Hand Evaluation
    Given multiple poker hands are formed simultaneously
    Then the game should pause for 3 seconds
    And all matching cards should pulse with a golden glow
    And I should see a notification showing each hand type and points
    And I should see the total points earned for all hands
    And after 3 seconds all matched cards should explode with animation
    And all matched cards should be removed
    And points should be awarded for each hand
    And all matched cards should return to the deck

  Scenario: Performance Optimization
    Given I am playing the game
    Then touch events should use passive event listeners where possible
    And default touch behaviors should be prevented
    And touch-action should be set to none for smoother play

  Scenario: Responsive Layout
    Given I am playing the game
    When the viewport height is 800 pixels
    Then the game board height should be 600 pixels
    And the board width should be 300 pixels
    
    When the viewport height changes to 1000 pixels
    Then the game board height should automatically adjust to 750 pixels
    And the board width should automatically adjust to 375 pixels
    
    When the viewport height changes to 600 pixels
    Then the game board height should automatically adjust to 450 pixels
    And the board width should automatically adjust to 225 pixels

  Scenario: Level Display
    Given I am playing the game
    Then I should see the current level displayed in the top-center
    And I should see the point multiplier for the current level
    And the level display should have the same styling as other game elements

  Scenario: Level Progression
    Given I am at Level 1
    When I use all 52 cards in the deck
    Then my level should increase to 2
    And I should see a level-up animation
    And the point multiplier should increase to 1.2x

  Scenario: Level-Based Hand Restrictions
    Given I am at Level 1
    Then all poker hands should be valid

    Given I am at Level 2
    When I form a pair
    Then it should not be considered a valid hand
    And the cards should still show the matching animation
    And I should see a message "Level 2: Pairs Stay!" next to the matched cards
    And the message should fade out after the animation completes
    And the cards should remain on the board
    
    Given I am at Level 3
    When I form a two pair
    Then it should not be considered a valid hand
    And the cards should still show the matching animation
    And I should see a message "Level 3: Two Pairs Stay!" next to the matched cards
    And the message should fade out after the animation completes
    And the cards should remain on the board
    But when I form a three of a kind
    Then it should be considered a valid hand
    And the cards should be removed after the animation

  Scenario: Restricted Hand Animation
    Given I am at a level where certain hands are restricted
    When I form a restricted hand type
    Then the cards should pulse with the golden glow animation
    And the animation duration should match regular hand matches
    And a message should appear next to the matched cards
    And the message should use the same styling as other game notifications
    And the message should show the current level and hand type
    And the message should fade out after the animation completes
    And the cards should remain on the board

  Scenario Outline: Level-Based Scoring
    Given I am at level <level>
    When I form a <hand_type>
    Then the base points <base_points> should be multiplied by <multiplier>
    And the result should be rounded up to the nearest integer
    And I should receive <final_points> points

    Examples:
      | level | hand_type     | base_points | multiplier | final_points |
      | 1     | Royal Flush   | 2000        | 1.0        | 2000         |
      | 2     | Straight Flush| 1000        | 1.2        | 1200         |
      | 3     | Four of a Kind| 500         | 1.4        | 700          |
      | 4     | Full House    | 300         | 1.6        | 480          |
      | 5     | Flush         | 200         | 1.8        | 360          |
      | 6     | Straight      | 150         | 2.0        | 300          |
      | 7     | Three of a Kind| 100        | 2.2        | 220          |
      | 8     | Two Pair      | 50          | 2.4        | 120          |
      | 9     | One Pair      | 25          | 2.6        | 65           |

  Scenario: Score Display Format
    Given I am playing the game
    Then I should see the score display in the top-right corner
    And it should have two rows of text
    And the first row should say "Score"
    And the second row should show the score value

  Scenario: Visual Design Elements
    Given I am playing the game
    Then I should see a dark theme with gradient background from #1a0f2e to #2c1654
    And I should see neon-style effects with golden (#ffd700) and pink (#ff00de) accents
    And I should see responsive text sizing using viewport units
    And I should see smooth transitions and hover effects
    And I should see blur effects on overlays

  Scenario: Card Animations
    Given a card is being matched
    Then it should show a golden pulse effect
    And it should show a scale transform
    And it should show a gradient background shift
    When the card is being removed
    Then it should show a rotation and scale animation
    And it should show an opacity fade
    And it should show a color shift
    And it should show multiple shadow layers

  Scenario: Button Animations
    Given I hover over a button
    Then it should show a scale transform
    And it should show an enhanced glow effect

  Scenario: Score Notifications
    Given I score points
    Then I should see a notification with a pop-in scale effect
    And the notification should have a slide transition

  Scenario: High Score System Details
    Given I have a high score
    Then it should be persisted in local storage
    And the score entry should be validated
    And the scores should be automatically sorted
    And the date should be tracked for each score
    And the score updates should happen in real-time
    And each score should show:
      | Field    | Format          |
      | Initials | 3 characters    |
      | Score    | Numeric value   |
      | Date     | Date achieved   |

  Scenario: Special Case Hand Evaluation
    Given I am evaluating poker hands
    Then Ace-high straights should be recognized
    And multiple simultaneous matches should be handled
    And cascading matches after gravity should be evaluated

  Scenario: Level Progression Complete
    Given I am playing the game
    Then each level should add 0.2x to the point multiplier
    And the following hands should be restricted by level:
      | Level | Restricted Hand    |
      | 2     | Pairs             |
      | 3     | Two Pairs         |
      | 4     | Three of a Kind   |
      | 5     | Straight          |
      | 6     | Flush             |
      | 7     | Full House        |
      | 8     | Four of a Kind    |
      | 9+    | All except Royal/Straight Flush |

  Scenario: Detailed Display Specifications
    Given I am playing the game
    Then the score display should be 10% of viewport height
    And the next card preview should be 10% of viewport height
    And the Quick Drop button should be 10% of viewport height
    And the game board should have 4px padding inside its border
    And each cell should show a subtle golden glow on hover

  Scenario: Detailed Card Layout
    Given a card is on the board
    Then it should be positioned using transform: translate(-50%, -50%)
    And card values should be displayed as:
      | Value | Display |
      | 1     | A       |
      | 2-10  | As is   |
      | 11    | J       |
      | 12    | Q       |
      | 13    | K       |
    And suit symbols should be displayed as:
      | Suit    | Symbol |
      | Hearts  | ♥      |
      | Diamonds| ♦      |
      | Clubs   | ♣      |
      | Spades  | ♠      |

  Scenario: Technical Game Engine Details
    Given I am playing the game
    Then the game should use RequestAnimationFrame for the game loop
    And the game should have a collision detection system
    And the game should simulate gravity for falling cards
    And the game should pause for animations and matches

  Scenario: Touch Event Optimization
    Given I am playing the game
    Then touch events should use passive event listeners
    And default touch behaviors should be prevented
    And touch-action should be set to none
    And the game should use efficient grid-based rendering
    And DOM updates should be minimized
    And RequestAnimationFrame should be used for synchronization

  Scenario: Strategy Elements
    Given I am playing the game
    Then I should be able to plan ahead for potential poker hands
    And I should be able to track cards that have appeared
    And I should be able to create opportunities for multiple hand combinations
    And I should be able to manage board space efficiently
    And I should be able to consider both horizontal and vertical hand possibilities

  Scenario: High Scores Panel Styling
    Given I am on the start screen
    Then the high scores panel should have a translucent background
    And it should have a golden border with shadow effects
    And it should show the top 5 scores
    And each score entry should show:
      | Field    | Format                |
      | Initials | 3 uppercase letters   |
      | Score    | Numeric value         |
      | Date     | Formatted date string |

  Scenario: Game Panel Effects
    Given I am playing the game
    Then all game panels should have translucent backgrounds
    And they should have blur effects using backdrop-filter
    And they should have golden borders with shadow effects
    And they should be positioned with proper z-indexing

  Scenario: Detailed Animation Timing
    Given a poker hand is formed
    Then the match animation should last exactly 4 seconds
    And the gravity animation should have a 500ms settling time
    And multiple animations should be able to run simultaneously
    And animations should be properly synchronized using RequestAnimationFrame
    When multiple hands are matched
    Then all animations should play without visual glitches
    And the game should maintain proper timing for all effects