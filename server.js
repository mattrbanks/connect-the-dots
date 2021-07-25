"use strict";

//variables
let playerTurn = 1; //can be 1 or 2 because game is 2 player
let validMovesCount = 0; //counts how many valid moves are made in a game
let validCoordinatesCollection = []; //keep track of visited nodes
let existingLinesCollection = []; //keep track of existing lines for comparison
let generatedIntCoordinates = [];
let currValidStartNodeClicked = null; //if a user clicks a possible node to build a line with. this is subject to change if they pick a different node
let proposedEndNode = null; //user can build off of this point
let mostRecentEndNodeOne = null; //this is one end of the current continuous line and is set when a valid start node is clicked. this resets if the player clicks the same node twice
let mostRecentEndNodeTwo = null; //this is the other end of the current continuos line that is set after a valid move is completed
let gameIsOverAndNeedsReset = false;
let playerOneScore = 0;
let playerTwoScore = 0;

if (typeof Storage !== "undefined") {
  const p1ScoreBox = document.getElementById("player1-score");
  const p2ScoreBox = document.getElementById("player2-score");
  if (
    sessionStorage.getItem("playerOneScore") === null &&
    sessionStorage.getItem("playerTwoScore") === null
  ) {
    sessionStorage.setItem("playerOneScore", playerOneScore);
    sessionStorage.setItem("playerTwoScore", playerTwoScore);
    p1ScoreBox.innerHTML = sessionStorage.getItem("playerOneScore");
    p2ScoreBox.innerHTML = sessionStorage.getItem("playerTwoScore");
  } else {
    p1ScoreBox.innerHTML = sessionStorage.getItem("playerOneScore");
    p2ScoreBox.innerHTML = sessionStorage.getItem("playerTwoScore");
  }
} else {
  document.getElementById("player1-score").innerHTML =
    "Sorry, your browser does not support Web Storage...";
}

function sendScores(p1ScoreUpdate, p2ScoreUpdate) {
  const p1ScoreBox = document.getElementById("player1-score");
  const p2ScoreBox = document.getElementById("player2-score");

  p1ScoreBox.innerHTML = p1ScoreUpdate;
  p2ScoreBox.innerHTML = p2ScoreUpdate;
}

function clearScores() {
  sessionStorage.clear();
  const p1ScoreBox = document.getElementById("player1-score");
  const p2ScoreBox = document.getElementById("player2-score");

  sessionStorage.setItem("playerOneScore", playerOneScore); //set to 0
  sessionStorage.setItem("playerTwoScore", playerTwoScore); //set to 0

  p1ScoreBox.innerHTML = sessionStorage.getItem("playerOneScore");
  p2ScoreBox.innerHTML = sessionStorage.getItem("playerTwoScore");
}

function resetGame() {
  window.location.reload();
}

function messageResponseFactory(message) {
  let response = null;
  let clientMessage = message.msg; //get the msg from the client
  let nodePointClicked = message.body; //get click point information from the client

  //these functions are hoisted
  if (clientMessage === "INITIALIZE") {
    return initialize();
  } else if (clientMessage === "NODE_CLICKED") {
    if (gameIsOverAndNeedsReset === true) {
      response = {
        msg: "INVALID_START_NODE", //complete a line before testing this
        body: {
          heading: "GAME OVER",
          message: "Player" + playerTurn + "wins!",
          newLine: null,
        },
      };
      return response;
    }

    return nodeClickResponseFactory(nodePointClicked); //return this payload to the caller and the caller will assign it to a variable and ship it off to the client
  } else {
    console.error("something is wrong with the message format");
  }
}

function initialize() {
  let initGameReset = {
    msg: "INITIALIZE",
    body: {
      heading: "Player" + playerTurn,
      message: "Your move player 1. Select a node to start.",
      newLine: null,
    },
  };

  const p1ScoreBox = document.getElementById("player1-score");
  const p2ScoreBox = document.getElementById("player2-score");

  p1ScoreBox.innerHTML = sessionStorage.getItem("playerOneScore");
  p2ScoreBox.innerHTML = sessionStorage.getItem("playerTwoScore");

  return initGameReset;
}

//process user interactions with the game. the node is clicked and we get a pair of coordinates in the body we catch here
function nodeClickResponseFactory(nodePointClicked) {
  let response = null;
  //we go here if the player has not selected a start node yet
  if (currValidStartNodeClicked === null) {
    //if player 1 is making the first move of the game we go here to process it
    if (validMovesCount === 0) {
      response = {
        msg: "VALID_START_NODE",
        body: {
          heading: "Player" + playerTurn,
          message: "Select a second node to complete the line",
          newLine: null,
        },
      };
      currValidStartNodeClicked = nodePointClicked;
    } else if (
      (nodePointClicked.x === mostRecentEndNodeOne.x &&
        nodePointClicked.y === mostRecentEndNodeOne.y) ||
      (nodePointClicked.x === mostRecentEndNodeTwo.x && //need to set mostRecentEndNodeTwo later after a move completes
        nodePointClicked.y === mostRecentEndNodeTwo.y &&
        validMovesCount > 0)
    ) {
      //if the players are in the middle of a game and then the player must select either of the two end nodes of the existing line to be a valid start node.
      response = {
        msg: "VALID_START_NODE",
        body: {
          heading: "Player" + playerTurn,
          message: "Select a second node to complete the line",
          newLine: null,
        },
      };
      currValidStartNodeClicked = nodePointClicked;
      //from this point on we set mostRecentEndNodes to new valid end points. whatever mostRecentEndNode they pick the matching variable will be updated to their lines end node
    } else {
      //any other start node is invalid
      //cancel node selection for any other type of start nodes on grid
      response = {
        msg: "INVALID_START_NODE", //complete a line before testing this
        body: {
          heading: "Player" + playerTurn,
          message: "Invalid start node!!!",
          newLine: null,
        },
      };
      currValidStartNodeClicked = null;
    }
  } else if (
    //if the player has clicked a start node and then clicks the same node again the node selection resets and they have to start over
    currValidStartNodeClicked !== null &&
    nodePointClicked.x === currValidStartNodeClicked.x &&
    nodePointClicked.y === currValidStartNodeClicked.y //these should not be equal
  ) {
    //cancel node selection
    response = {
      msg: "INVALID_START_NODE",
      body: {
        heading: "Player" + playerTurn,
        message: "Invalid move!!! Start over please.",
        newLine: null,
      },
    };
    currValidStartNodeClicked = null;
    // mostRecentEndNodeOne = null;
  } else if (currValidStartNodeClicked !== null) {
    if (
      checkIfMoveIsValid(currValidStartNodeClicked, nodePointClicked) === true
    ) {
      //if the player has a valid start node and they select a potential end node we go here to validate the move

      if (playerTurn === 1) {
        playerTurn = 2;
      } else if (playerTurn === 2) {
        playerTurn = 1;
      }

      if (validMovesCount === 0) {
        mostRecentEndNodeOne = currValidStartNodeClicked;
        mostRecentEndNodeTwo = nodePointClicked;
      }

      if (validMovesCount !== 0) {
        if (
          currValidStartNodeClicked.x === mostRecentEndNodeOne.x &&
          currValidStartNodeClicked.y === mostRecentEndNodeOne.y
        ) {
          mostRecentEndNodeOne = nodePointClicked;
        } else if (
          currValidStartNodeClicked.x === mostRecentEndNodeTwo.x &&
          currValidStartNodeClicked.y === mostRecentEndNodeTwo.y
        ) {
          mostRecentEndNodeTwo = nodePointClicked;
        }
        //we will handle this depending on what endpoint the player chooses
      }

      lineIntermediateCoordinatesFactory(
        currValidStartNodeClicked,
        nodePointClicked
      );

      validMovesCount++;
      //WE HAVE ONE OBJECT WITH TWO POINTS FOR EACH LINE SO WE NEED TO ACCESS THE POINT COORDINATES USING THE KEY FIRST
      existingLinesCollection = [
        ...existingLinesCollection,
        {
          currValidStartNodeClicked,
          nodePointClicked,
        },
      ];
      if (gameOver(mostRecentEndNodeOne, mostRecentEndNodeTwo) === true) {
        response = {
          msg: "GAME_OVER",
          body: {
            heading: "GAME OVER",
            message: "Player" + playerTurn + "wins!",
            newLine: {
              start: currValidStartNodeClicked,
              end: nodePointClicked,
            },
          },
        };
        gameIsOverAndNeedsReset = true;
        let p1ScoreUpdate = sessionStorage.getItem("playerOneScore");
        let p2ScoreUpdate = sessionStorage.getItem("playerTwoScore");
        if (playerTurn === 1) {
          p1ScoreUpdate++;
          sessionStorage.setItem("playerOneScore", p1ScoreUpdate);
        } else if (playerTurn === 2) {
          p2ScoreUpdate++;
          sessionStorage.setItem("playerTwoScore", p2ScoreUpdate);
        }
        sendScores(p1ScoreUpdate, p2ScoreUpdate);
      } else if (
        gameOver(mostRecentEndNodeOne, mostRecentEndNodeTwo) === false
      ) {
        response = {
          msg: "VALID_END_NODE",
          body: {
            heading: "Player" + playerTurn,
            message: "your turn player" + playerTurn,
            newLine: {
              start: currValidStartNodeClicked,
              end: nodePointClicked,
            },
          },
        };
      }

      currValidStartNodeClicked = null;
    } else if (
      checkIfMoveIsValid(currValidStartNodeClicked, nodePointClicked) === false
    ) {
      response = {
        msg: "INVALID_END_NODE",
        body: {
          heading: "Player" + playerTurn,
          message: "Invalid move!!! Start over please.",
          newLine: null,
        },
      };
      currValidStartNodeClicked = null;
    }
  } else {
    response = {
      msg: "INVALID_START_NODE",
      body: {
        heading: "Player" + playerTurn,
        message: "Invalid move!!! Start over please.",
        newLine: null,
      },
    };
    currValidStartNodeClicked = null;
  }

  return response;
}

function checkIfMoveIsValid(currValidStartNodeClicked, nodePointClicked) {
  //see if point is already in use
  //see if the line is horizontal, vertical, or 45deg
  //see if the proposed line intersects an existing line in its path. store all lines so far
  proposedEndNode = nodePointClicked; //on the second click we get new coordinates for the proposed end node. so currValidStartNodeClicked has the start node coordinates available from the first click

  //is the line at an acceptable angle?
  let p1 = {
    x: currValidStartNodeClicked.x,
    y: currValidStartNodeClicked.y,
  };

  let p2 = {
    x: proposedEndNode.x,
    y: proposedEndNode.y,
  };

  // angle in degrees
  let angleDeg = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI; //Math.abs to get rid of negative values

  if (
    Math.abs(angleDeg) === 0 ||
    Math.abs(angleDeg) === 180 ||
    Math.abs(angleDeg) === 90 ||
    Math.abs(angleDeg) === 270 ||
    Math.abs(angleDeg) === 45 ||
    Math.abs(angleDeg) === 225 ||
    Math.abs(angleDeg) === 135 ||
    Math.abs(angleDeg) === 315
  ) {
    return checkIfEndPointAlreadyExists(
      currValidStartNodeClicked,
      nodePointClicked
    );
  } else if (
    Math.abs(angleDeg) !== 0 ||
    Math.abs(angleDeg) !== 180 ||
    Math.abs(angleDeg) !== 90 ||
    Math.abs(angleDeg) !== 270 ||
    Math.abs(angleDeg) !== 45 ||
    Math.abs(angleDeg) !== 225 ||
    Math.abs(angleDeg) !== 135 ||
    Math.abs(angleDeg) !== 315
  ) {
    return false;
  }
}

function lineIntermediateCoordinatesFactory(
  currValidStartNodeClicked,
  nodePointClicked
) {
  if (
    Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) <= 1 &&
    Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) <= 1
  ) {
    if (validMovesCount === 0) {
      //This contains all of the used points
      validCoordinatesCollection = [
        ...validCoordinatesCollection,
        ...generatedIntCoordinates,
        currValidStartNodeClicked,
        nodePointClicked,
      ];
    } else if (validMovesCount !== 0) {
      //This contains all of the used points
      validCoordinatesCollection = [
        ...validCoordinatesCollection,
        ...generatedIntCoordinates,
        nodePointClicked,
      ];
    }
  }

  if (
    (Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) > 1 &&
      Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) <= 1) ||
    (Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) <= 1 &&
      Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) > 1) ||
    (Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) > 1 &&
      Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) > 1)
  ) {
    let startingPointX = currValidStartNodeClicked.x;
    let startingPointY = currValidStartNodeClicked.y;
    let endingPointX = nodePointClicked.x;
    let endingPointY = nodePointClicked.y;
    let deltaY = Math.abs(endingPointY - startingPointY);
    let deltaX = Math.abs(endingPointX - startingPointX);
    let deltaDiagonal = Math.abs(endingPointX - startingPointX); //could be x or y because they would yield the same result

    function getSlope(x1, y1, x2, y2) {
      return (y2 - y1) / (x2 - x1);
    }

    let proposedLineSlope = getSlope(
      startingPointX,
      startingPointY,
      endingPointX,
      endingPointY
    );

    if (proposedLineSlope === 0) {
      //horizontal line takes delta x
      //HORIZONTAL LINE
      let x = startingPointX < endingPointX ? startingPointX : endingPointX;
      for (let i = 0; i < deltaX - 1; i++) {
        x++;
        let usedIntPointToAdd = new Object();
        usedIntPointToAdd.x = x;
        usedIntPointToAdd.y = endingPointY; //same as startingPointY
        generatedIntCoordinates = [
          ...generatedIntCoordinates,
          usedIntPointToAdd,
        ];
      }
    } else if (
      proposedLineSlope === Infinity ||
      proposedLineSlope === -Infinity
    ) {
      //VERTICAL LINE
      let y = startingPointY < endingPointY ? startingPointY : endingPointY;
      for (let i = 0; i < deltaY - 1; i++) {
        y++;
        let usedIntPointToAdd = new Object();
        usedIntPointToAdd.x = endingPointX; //same as startingPointX
        usedIntPointToAdd.y = y;
        generatedIntCoordinates = [
          ...generatedIntCoordinates,
          usedIntPointToAdd,
        ];
      }
    } else if (proposedLineSlope === -1) {
      let x = startingPointX < endingPointX ? startingPointX : endingPointX;
      let y = startingPointY > endingPointY ? startingPointY : endingPointY;
      for (let i = 0; i < deltaDiagonal - 1; i++) {
        x++;
        y--;
        let usedIntPointToAdd = new Object();
        usedIntPointToAdd.x = x; //same as startingPointX
        usedIntPointToAdd.y = y;
        generatedIntCoordinates = [
          ...generatedIntCoordinates,
          usedIntPointToAdd,
        ];
      }
    } else if (proposedLineSlope === 1) {
      let x = startingPointX < endingPointX ? startingPointX : endingPointX;
      let y = startingPointY < endingPointY ? startingPointY : endingPointY;
      for (let i = 0; i < deltaDiagonal - 1; i++) {
        x++;
        y++;
        let usedIntPointToAdd = new Object();
        usedIntPointToAdd.x = x; //same as startingPointX
        usedIntPointToAdd.y = y;
        generatedIntCoordinates = [
          ...generatedIntCoordinates,
          usedIntPointToAdd,
        ];
      }
    }
  }

  if (validMovesCount === 0) {
    //This contains all of the used points
    validCoordinatesCollection = [
      ...validCoordinatesCollection,
      ...generatedIntCoordinates,
      currValidStartNodeClicked,
      nodePointClicked,
    ];
  } else if (validMovesCount !== 0) {
    //This contains all of the used points
    validCoordinatesCollection = [
      ...validCoordinatesCollection,
      ...generatedIntCoordinates,
      nodePointClicked,
    ];
  }

  validCoordinatesCollection = [...new Set(validCoordinatesCollection)]; //get rid of duplicates if there are any
}

function checkIfEndPointAlreadyExists(
  currValidStartNodeClicked,
  nodePointClicked
) {
  //if this is the first line in the game and existing validCoordinatesCollection and existingLinesCollection are empty then we can approve the endpoint that should have passed as not the same as the valid start node first click
  //if the angle is legal this will trigger true if it is the first move of the game because intersection and existing points or lines is not an issue at this point
  if (
    validCoordinatesCollection.length === 0 &&
    existingLinesCollection.length === 0
  ) {
    return true;
  } else if (
    validCoordinatesCollection.length !== 0 &&
    existingLinesCollection.length !== 0
  ) {
    //does the proposed endpoint already exist in the current line?
    for (let i = 0; i < validCoordinatesCollection.length; i++) {
      if (
        nodePointClicked.x === validCoordinatesCollection[i].x && //currently the inner line endpoints are not in this array so they are valid right now
        nodePointClicked.y === validCoordinatesCollection[i].y
      ) {
        return false;
      } else {
        continue;
      }
    }
  }

  return checkIfProposedLineWillIntersect(
    currValidStartNodeClicked,
    nodePointClicked
  );
}

function checkIfProposedLineWillIntersect(
  currValidStartNodeClicked,
  nodePointClicked
) {
  //will this line intersect with any existing lines?
  //this uses currValidStartNodeClicked and nodePointClicked to access x and y values so nodePointClicked.x nodePointClicked.y
  //we compare the incoming line with every other existing line and see if this new segment intersects any other existing segments
  for (let i = 0; i < existingLinesCollection.length; i++) {
    //for each existing line we run this code to compare it to the incoming line
    let startingPointX = currValidStartNodeClicked.x;
    let startingPointY = currValidStartNodeClicked.y;
    let endingPointX = nodePointClicked.x;
    let endingPointY = nodePointClicked.y;
    let existingStartingPointX =
      existingLinesCollection[i].currValidStartNodeClicked.x;
    let existingStartingPointY =
      existingLinesCollection[i].currValidStartNodeClicked.y;
    let existingEndingPointX = existingLinesCollection[i].nodePointClicked.x;
    let existingEndingPointY = existingLinesCollection[i].nodePointClicked.y;

    //find slope of both lines
    function getSlope(x1, y1, x2, y2) {
      return (y2 - y1) / (x2 - x1);
    }

    let proposedLineSlope = getSlope(
      startingPointX,
      startingPointY,
      endingPointX,
      endingPointY
    );

    let existingLineSlope = getSlope(
      existingStartingPointX,
      existingStartingPointY,
      existingEndingPointX,
      existingEndingPointY
    );
    //if slopes are the same and lines are parallel then we can return true but if the slopes are different we need to evaluate the segments to see if they intersect
    if (proposedLineSlope === existingLineSlope) {
      continue;
    } else {
      function isIntersecting(x1, y1, x2, y2, x3, y3, x4, y4) {
        let a_dx = x2 - x1;
        let a_dy = y2 - y1;
        let b_dx = x4 - x3;
        let b_dy = y4 - y3;
        let s =
          (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
        let t =
          (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
        return s >= 0 && s <= 1 && t >= 0 && t <= 1
          ? [x1 + t * a_dx, y1 + t * a_dy]
          : false;
      }

      let isThereAnIntersectionConflict = isIntersecting(
        startingPointX,
        startingPointY,
        endingPointX,
        endingPointY,
        existingStartingPointX,
        existingStartingPointY,
        existingEndingPointX,
        existingEndingPointY
      );

      if (isThereAnIntersectionConflict === false) {
        continue;
      } else if (isThereAnIntersectionConflict !== false) {
        if (
          isThereAnIntersectionConflict[0] === startingPointX &&
          isThereAnIntersectionConflict[1] === startingPointY
        ) {
          continue;
        } else {
          return false;
        }
      }
    }
  }
  return true;
}

function gameOver(mostRecentEndNodeOne, mostRecentEndNodeTwo) {
  let endNodeOnePasses = true;
  let endNodeTwoPasses = true;
  let areTherePassingNodesFromEndNodeOne = []; //these switch to true if at least one thing passes
  let areTherePassingNodesFromEndNodeTwo = [];
  //change these for scalability when gridSize changes
  let gridSize = 4;
  let gridMax = 3;
  //construct 8 points for each potentially valid start node
  //potential start node two
  let availableNodesOneRoundOne = [];
  let unavailableNodesOneRoundOne = [];
  let availableNodesOneRoundTwo = [];
  let unavailableNodesOneRoundTwo = [];
  let potentialEndNodesOne = [
    {
      x: mostRecentEndNodeOne.x,
      y: mostRecentEndNodeOne.y + 1,
    },
    {
      x: mostRecentEndNodeOne.x,
      y: mostRecentEndNodeOne.y - 1,
    },
    {
      x: mostRecentEndNodeOne.x + 1,
      y: mostRecentEndNodeOne.y,
    },
    {
      x: mostRecentEndNodeOne.x - 1,
      y: mostRecentEndNodeOne.y,
    },
    {
      x: mostRecentEndNodeOne.x - 1,
      y: mostRecentEndNodeOne.y + 1,
    },
    {
      x: mostRecentEndNodeOne.x + 1,
      y: mostRecentEndNodeOne.y - 1,
    },
    {
      x: mostRecentEndNodeOne.x - 1,
      y: mostRecentEndNodeOne.y - 1,
    },
    {
      x: mostRecentEndNodeOne.x + 1,
      y: mostRecentEndNodeOne.y + 1,
    },
  ];

  //potential start node two
  let availableNodesTwoRoundOne = [];
  let unavailableNodesTwoRoundOne = [];
  let availableNodesTwoRoundTwo = [];
  let unavailableNodesTwoRoundTwo = [];
  let potentialEndNodesTwo = [
    {
      x: mostRecentEndNodeTwo.x,
      y: mostRecentEndNodeTwo.y + 1,
    },
    {
      x: mostRecentEndNodeTwo.x,
      y: mostRecentEndNodeTwo.y - 1,
    },
    {
      x: mostRecentEndNodeTwo.x + 1,
      y: mostRecentEndNodeTwo.y,
    },
    {
      x: mostRecentEndNodeTwo.x - 1,
      y: mostRecentEndNodeTwo.y,
    },
    {
      x: mostRecentEndNodeTwo.x - 1,
      y: mostRecentEndNodeTwo.y + 1,
    },
    {
      x: mostRecentEndNodeTwo.x + 1,
      y: mostRecentEndNodeTwo.y - 1,
    },
    {
      x: mostRecentEndNodeTwo.x - 1,
      y: mostRecentEndNodeTwo.y - 1,
    },
    {
      x: mostRecentEndNodeTwo.x + 1,
      y: mostRecentEndNodeTwo.y + 1,
    },
  ];

  //CHECK 1: eliminate any negative values or values that exceed gridMax immediately
  //potential start node one
  for (let i = 0; i < potentialEndNodesOne.length; i++) {
    if (
      potentialEndNodesOne[i].x < 0 ||
      potentialEndNodesOne[i].y < 0 ||
      potentialEndNodesOne[i].x > gridMax ||
      potentialEndNodesOne[i].y > gridMax
    ) {
      continue;
    } else if (
      availableNodesOneRoundOne.includes(potentialEndNodesOne[i]) === false
    ) {
      availableNodesOneRoundOne = [
        ...availableNodesOneRoundOne,
        potentialEndNodesOne[i],
      ];
    }
  }

  //potential start node two
  for (let i = 0; i < potentialEndNodesTwo.length; i++) {
    if (
      potentialEndNodesTwo[i].x < 0 ||
      potentialEndNodesTwo[i].y < 0 ||
      potentialEndNodesTwo[i].x > gridMax ||
      potentialEndNodesTwo[i].y > gridMax
    ) {
      continue;
    } else if (
      availableNodesTwoRoundOne.includes(potentialEndNodesTwo[i]) === false
    ) {
      availableNodesTwoRoundOne = [
        ...availableNodesTwoRoundOne,
        potentialEndNodesTwo[i],
      ];
    }
  }

  //BELOW SHOULD ELIMIMATE USED NODES BUT IT IS NOT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //CHECK 2: we check both valid start nodes individually for used nodes
  //potential start node one
  for (let i = validCoordinatesCollection.length - 1; i >= 0; i--) {
    for (let j = availableNodesOneRoundOne.length - 1; j >= 0; j--) {
      if (
        validCoordinatesCollection[i].x === availableNodesOneRoundOne[j].x &&
        validCoordinatesCollection[i].y === availableNodesOneRoundOne[j].y
      ) {
        availableNodesOneRoundOne.splice(j, 1);
        // i--;
      }
    }
  }

  //potential start node two
  for (let i = validCoordinatesCollection.length - 1; i >= 0; i--) {
    for (let j = availableNodesTwoRoundOne.length - 1; j >= 0; j--) {
      if (
        validCoordinatesCollection[i].x === availableNodesTwoRoundOne[j].x &&
        validCoordinatesCollection[i].y === availableNodesTwoRoundOne[j].y
      ) {
        availableNodesTwoRoundOne.splice(j, 1);
        // i--;
      }
    }
  }

  //CHECK 3: if the potential node is unused then we check if it is an illegal line intersection
  function isIntersecting(x1, y1, x2, y2, x3, y3, x4, y4) {
    let a_dx = x2 - x1;
    let a_dy = y2 - y1;
    let b_dx = x4 - x3;
    let b_dy = y4 - y3;
    let s =
      (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
    let t =
      (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
    return s >= 0 && s <= 1 && t >= 0 && t <= 1
      ? [x1 + t * a_dx, y1 + t * a_dy]
      : false;
  }

  //potential start node one
  for (let i = availableNodesOneRoundOne.length - 1; i >= 0; i--) {
    for (let j = existingLinesCollection.length - 1; j >= 0; j--) {
      let startingPointX = mostRecentEndNodeOne.x;
      let startingPointY = mostRecentEndNodeOne.y;
      console.log(
        availableNodesOneRoundOne,
        availableNodesOneRoundOne[i].x,
        availableNodesOneRoundOne[i].y,
        existingLinesCollection
      );
      let endingPointX = availableNodesOneRoundOne[i].x;
      let endingPointY = availableNodesOneRoundOne[i].y;
      let existingStartingPointX =
        existingLinesCollection[j].currValidStartNodeClicked.x;
      let existingStartingPointY =
        existingLinesCollection[j].currValidStartNodeClicked.y;
      let existingEndingPointX = existingLinesCollection[j].nodePointClicked.x;
      let existingEndingPointY = existingLinesCollection[j].nodePointClicked.y;

      let isThereAnIntersectionConflict = isIntersecting(
        startingPointX,
        startingPointY,
        endingPointX,
        endingPointY,
        existingStartingPointX,
        existingStartingPointY,
        existingEndingPointX,
        existingEndingPointY
      );

      console.log(isThereAnIntersectionConflict);
      if (
        isThereAnIntersectionConflict[0] === startingPointX &&
        isThereAnIntersectionConflict[1] === startingPointY
      ) {
        areTherePassingNodesFromEndNodeOne = [
          ...areTherePassingNodesFromEndNodeOne,
          availableNodesOneRoundOne[i],
        ];
      } else {
        if (
          isThereAnIntersectionConflict !== false &&
          isThereAnIntersectionConflict[0] !== startingPointX &&
          isThereAnIntersectionConflict[1] !== startingPointY
        ) {
          console.log(
            availableNodesOneRoundOne,
            availableNodesOneRoundOne.length
          );
          // availableNodesOneRoundOne.splice(i, 1);
          console.log(availableNodesOneRoundOne[i]);
          // i--;

          if (
            areTherePassingNodesFromEndNodeOne.length === 1 &&
            availableNodesOneRoundOne[0].x ===
              areTherePassingNodesFromEndNodeOne[0].x &&
            availableNodesOneRoundOne[0].y ===
              areTherePassingNodesFromEndNodeOne[0].y
          ) {
            console.log("WE ARE IN!!!!!!!!");
            endNodeOnePasses = false;
            // areTherePassingNodesFromEndNodeOne = [];
            console.log(
              areTherePassingNodesFromEndNodeOne,
              availableNodesOneRoundOne,
              isThereAnIntersectionConflict
            );
          }

          if (availableNodesOneRoundOne.length === 0) {
            console.log(availableNodesOneRoundOne[i]);
            break;
          } else {
            console.log(availableNodesOneRoundOne[i]);
            continue;
          }
        }

        if (
          isThereAnIntersectionConflict === false
          // &&
          // isThereAnIntersectionConflict[0] !== startingPointX &&
          // isThereAnIntersectionConflict[1] !== startingPointY
        ) {
          console.log(
            availableNodesOneRoundOne[i],
            availableNodesOneRoundOne.length,
            areTherePassingNodesFromEndNodeOne
          );
          areTherePassingNodesFromEndNodeOne = [
            ...areTherePassingNodesFromEndNodeOne,
            availableNodesOneRoundOne[i],
          ];
          areTherePassingNodesFromEndNodeOne = [
            ...new Set(areTherePassingNodesFromEndNodeOne),
          ];
        }
      }
    }
  }

  //potential start node two
  for (let i = availableNodesTwoRoundOne.length - 1; i >= 0; i--) {
    for (let j = existingLinesCollection.length - 1; j >= 0; j--) {
      let startingPointX = mostRecentEndNodeTwo.x;
      let startingPointY = mostRecentEndNodeTwo.y;
      console.log(
        availableNodesTwoRoundOne,
        availableNodesTwoRoundOne[i].x,
        availableNodesTwoRoundOne[i].y,
        existingLinesCollection
      );
      let endingPointX = availableNodesTwoRoundOne[i].x;
      let endingPointY = availableNodesTwoRoundOne[i].y;
      let existingStartingPointX =
        existingLinesCollection[j].currValidStartNodeClicked.x;
      let existingStartingPointY =
        existingLinesCollection[j].currValidStartNodeClicked.y;
      let existingEndingPointX = existingLinesCollection[j].nodePointClicked.x;
      let existingEndingPointY = existingLinesCollection[j].nodePointClicked.y;

      let isThereAnIntersectionConflict = isIntersecting(
        startingPointX,
        startingPointY,
        endingPointX,
        endingPointY,
        existingStartingPointX,
        existingStartingPointY,
        existingEndingPointX,
        existingEndingPointY
      );

      console.log(isThereAnIntersectionConflict); //gives point or false
      if (
        isThereAnIntersectionConflict[0] === startingPointX &&
        isThereAnIntersectionConflict[1] === startingPointY
      ) {
        areTherePassingNodesFromEndNodeTwo = [
          ...areTherePassingNodesFromEndNodeTwo,
          availableNodesTwoRoundOne[i],
        ];
      } else {
        if (
          isThereAnIntersectionConflict !== false &&
          isThereAnIntersectionConflict[0] !== startingPointX &&
          isThereAnIntersectionConflict[1] !== startingPointY
        ) {
          console.log(
            availableNodesTwoRoundOne,
            availableNodesTwoRoundOne.length
          );
          // availableNodesTwoRoundOne.splice(i, 1);
          console.log(availableNodesTwoRoundOne[i]);
          // i--;

          if (
            areTherePassingNodesFromEndNodeTwo.length === 1 &&
            availableNodesTwoRoundOne[0].x ===
              areTherePassingNodesFromEndNodeTwo[0].x &&
            availableNodesTwoRoundOne[0].y ===
              areTherePassingNodesFromEndNodeTwo[0].y
          ) {
            console.log("WE ARE IN!!!!!!!!");
            endNodeTwoPasses = false;
            // areTherePassingNodesFromEndNodeTwo = [];
            console.log(
              areTherePassingNodesFromEndNodeTwo,
              availableNodesTwoRoundOne,
              isThereAnIntersectionConflict
            );
          }

          if (availableNodesTwoRoundOne.length === 0) {
            console.log(availableNodesTwoRoundOne[i]);
            break;
          } else {
            console.log(availableNodesTwoRoundOne[i]);
            continue;
          }
        }

        if (
          isThereAnIntersectionConflict === false
          // &&
          // isThereAnIntersectionConflict[0] !== startingPointX &&
          // isThereAnIntersectionConflict[1] !== startingPointY
        ) {
          console.log(
            availableNodesTwoRoundOne[i],
            availableNodesTwoRoundOne.length,
            areTherePassingNodesFromEndNodeTwo
          );
          areTherePassingNodesFromEndNodeTwo = [
            ...areTherePassingNodesFromEndNodeTwo,
            availableNodesTwoRoundOne[i],
          ];
          areTherePassingNodesFromEndNodeTwo = [
            ...new Set(areTherePassingNodesFromEndNodeTwo),
          ];
        }
      }
    }
  }

  if (areTherePassingNodesFromEndNodeOne.length === 0) {
    endNodeOnePasses = false;
  }

  if (areTherePassingNodesFromEndNodeTwo.length === 0) {
    endNodeTwoPasses = false;
  }
  console.log(
    endNodeOnePasses,
    areTherePassingNodesFromEndNodeOne.length,
    areTherePassingNodesFromEndNodeOne,
    availableNodesOneRoundOne,
    endNodeTwoPasses,
    areTherePassingNodesFromEndNodeTwo.length,
    areTherePassingNodesFromEndNodeTwo,
    availableNodesTwoRoundOne
  );

  //if all 16 surrounding nodes fail from both valid start nodes the game is over and return game over value
  availableNodesOneRoundOne = [];
  availableNodesOneRoundTwo = [];
  availableNodesTwoRoundOne = [];
  availableNodesTwoRoundTwo = [];

  if (endNodeOnePasses == false && endNodeTwoPasses == false) {
    return true;
  } else {
    return false;
  }
}

//Exposed functions to use API for client server communication
app.ports.request.subscribe((message) => {
  if (gameIsOverAndNeedsReset === true) {
    let initGameReset = {
      msg: "INITIALIZE",
      body: {
        heading: "Player" + playerTurn,
        message: "Your move player 1",
        newLine: null,
      },
    };

    //send the message to be analyzed by the responseFactory function
    let response = initGameReset; //catch the returned value and send it to client for processing
    gameIsOverAndNeedsReset = false;
    //when the response is determined, send the response to the client
    app.ports.response.send(response);
  } else {
    //parse message to determine a response and then respond
    message = JSON.parse(message);

    //send the message to be analyzed by the responseFactory function
    let response = messageResponseFactory(message); //catch the returned value and send it to client for processing

    //when the response is determined, send the response to the client
    app.ports.response.send(response);
  }
});
