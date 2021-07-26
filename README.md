<p align="center"><img src="/Images/sid-sackson.jpg" alt="An image of a finished game of connect the dots."></p>

<h1 align="center">
  Connect The Dots Game
</h1>

This is a 2 player connect the dots game called Hold That Line. It was created by Sid Sackson and was originally played with pen and paper.

## Technologies Used

- **HTML5**

- **CSS3**

- **JavaScript**

- **Elm**

## How The Game Works

##### Definitions

- **Octilinear line - a horizontal, vertical, or 45° diagonal line**

##### Rules

- **The game is played on a 4x4 grid of 16 nodes.**

- **Players take turns drawing octilinear lines connecting nodes.**

- **Each line must begin at the start or end of the existing path, so that all lines form a continuous path.**

- **The first line may begin on any node.**

- **A line may connect any number of nodes.**

- **Lines may not intersect.**

- **No node can be visited twice.**

- **The game ends when no valid lines can be drawn.**

- **The player who draws the last line is the loser.**

##### Example Game

<img src="/Images/example-game.svg" alt="An image of a finished game of connect the dots.">

## Attribution

The game was designed by Sid Sackson.

All Elm client code was written by KMBS Solutions Engineering Center.

I wrote the game server code and added some client side features.

The function isIntersecting in server.js was found here: [stackoverflow.com/questions/42892862/how-do-i-find-the-point-at-which-two-line-segments-are-intersecting-in-javascrip?rq=1](https://stackoverflow.com/questions/42892862/how-do-i-find-the-point-at-which-two-line-segments-are-intersecting-in-javascrip?rq=1)

## Visit the website:

[hold-that-line-dot-game.netlify.app](https://hold-that-line-dot-game.netlify.app/)

## Run/setup:

Fork, clone, or download the repo.
Open index.html in your browser.
