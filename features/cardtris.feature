Feature: Cardtris Game
  As a player
  I want to play a card-based version of Tetris
  So that I can create poker hands and score points

  Background:
    Given the game is loaded on an iPad in portrait mode
    And the game board is 7 cards wide and 20 cards tall
    And I have a standard 52-card deck shuffled

  Scenario: Start Screen Display
    Given I am on the start screen
    Then I should see the top 5 high scores at the top
    And each high score should show initials, score, and date
    And I should see a "Start Game" button at the bottom
    When I tap the "Start Game" button
    Then the game should begin

  Scenario: Game Display Layout
    Given I am playing the game
    Then the game board should fill the majority of the screen height
    And the next card preview should be visible at the top
    And the current score should be visible at the top
    And the game board should not exceed 500px in width
    And the layout should work in portrait orientation only

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

  Scenario: Forming Poker Hands
    Given there are cards placed on the board
    When 5 cards form a valid poker hand horizontally
    Then those cards should be removed
    And the cards should be returned to the deck
    And I should receive points based on the poker hand value
    
    Given there are cards placed on the board
    When 5 cards form a valid poker hand vertically
    Then those cards should be removed
    And the cards should be returned to the deck
    And I should receive points based on the poker hand value

  Scenario Outline: Scoring System
    Given I form a <hand_type> poker hand
    Then I should receive <points> points

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
    And I should be prompted to enter my initials
    When I enter my initials
    Then my score should be saved if it's in the top 5
    And I should return to the start screen

  Scenario: New High Score
    Given I have achieved a top 5 score
    When I enter my initials
    Then I should see "New High Score!"
    And my score should appear in the high scores list
    And I should return to the start screen after 3 seconds

  Scenario: Multiple Hand Evaluation
    Given multiple poker hands are formed simultaneously
    Then all valid hands should be evaluated
    And points should be awarded for each hand
    And all matched cards should be removed
    And removed cards should return to the deck 