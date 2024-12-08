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