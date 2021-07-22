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

//start the game --> dynamic naming will be passed here and replace player 1
function initialize() {
  let initGameReset = {
    msg: "INITIALIZE",
    body: {
      heading: "Player" + playerTurn,
      message: "Your move player 1",
      newLine: null,
    },
  };
  console.log(" SERVER INITIALIZE GAME");
  console.log(initGameReset);

  console.log(currValidStartNodeClicked);

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
      //   mostRecentEndNodeOne = nodePointClicked;
    } else if (
      (nodePointClicked.x === mostRecentEndNodeOne.x &&
        nodePointClicked.y === mostRecentEndNodeOne.y) ||
      (nodePointClicked.x === mostRecentEndNodeTwo.x && //need to set mostRecentEndNodeTwo later after a move completes
        nodePointClicked.y === mostRecentEndNodeTwo.y &&
        validMovesCount > 0)
    ) {
      //if the players are in the middle of a game and then the player must select either of the two end nodes of the existing line to be a valid start node.
      console.log("We made it there!!!");
      console.log(mostRecentEndNodeOne);
      console.log(mostRecentEndNodeTwo);
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
        message: "Invalid move!!! Start over please.1",
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
        console.log(
          "need to only update the side that the player built off of and leave the other end node set as is until it is used in a move"
        );
      }

      lineIntermediateCoordinatesFactory(
        currValidStartNodeClicked,
        nodePointClicked
      );

      validMovesCount++;
      console.log(validMovesCount);

      console.log(currValidStartNodeClicked);
      console.log(nodePointClicked);
      console.log(mostRecentEndNodeOne);
      console.log(mostRecentEndNodeTwo);
      //WE HAVE ONE OBJECT WITH TWO POINTS FOR EACH LINE SO WE NEED TO ACCESS THE POINT COORDINATES USING THE KEY FIRST LIKE THE BELOW CONSOLE LOGS
      existingLinesCollection = [
        ...existingLinesCollection,
        {
          currValidStartNodeClicked,
          nodePointClicked,
        },
      ];
      //THE LOGS BELOW ARE IMPORTANT FOR EVALUATING LINE INTERSECTIONS
      console.log(existingLinesCollection[0].currValidStartNodeClicked);
      console.log(existingLinesCollection[0].nodePointClicked);
      //THE LOGS ABOVE ARE IMPORTANT FOR EVALUATING LINE INTERSECTIONS
      console.log(currValidStartNodeClicked);

      console.log("Finished lineIntermediateCoordinatesFactory");

      console.log(currValidStartNodeClicked);
      console.log(nodePointClicked);
      console.log(validCoordinatesCollection);
      console.log(existingLinesCollection);
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
      } else if (
        gameOver(mostRecentEndNodeOne, mostRecentEndNodeTwo) === false
      ) {
        //else if
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

      console.log("HERE!!!");

      currValidStartNodeClicked = null;
      console.log(currValidStartNodeClicked);
    } else if (
      checkIfMoveIsValid(currValidStartNodeClicked, nodePointClicked) === false
    ) {
      response = {
        msg: "INVALID_END_NODE",
        body: {
          heading: "Player" + playerTurn,
          message: "Invalid move!!! Start over please.3",
          newLine: null,
        },
      };
      currValidStartNodeClicked = null;
    }
  } else {
    console.log(mostRecentEndNodeOne.x);
    console.log(mostRecentEndNodeTwo.x);
    response = {
      msg: "INVALID_START_NODE",
      body: {
        heading: "Player" + playerTurn,
        message: "Invalid move!!! Start over please.2",
        newLine: null,
      },
    };
    currValidStartNodeClicked = null;
  }

  return response;
}

function checkIfMoveIsValid(currValidStartNodeClicked, nodePointClicked) {
  console.log("we are in checkIfMoveIsValid with the angle check");
  //see if point is already in use
  //see if the line is horizontal, vertical, or 45deg
  //see if the proposed line intersects an existing line in its path. store all lines so far
  proposedEndNode = nodePointClicked; //on the second click we get new coordinates for the proposed end node. so currValidStartNodeClicked has the start node coordinates available from the first click

  console.log(currValidStartNodeClicked);
  console.log(proposedEndNode);

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
    console.log("we are evaluating the angle here and it is true");
    console.log(Math.abs(angleDeg));
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
    console.log("we are evaluating the angle here and it is false");
    console.log(Math.abs(angleDeg));
    return false;
  }
}

function lineIntermediateCoordinatesFactory(
  currValidStartNodeClicked,
  nodePointClicked
) {
  console.log(
    currValidStartNodeClicked,
    nodePointClicked,
    validCoordinatesCollection
  );
  if (
    Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) <= 1 &&
    Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) <= 1
  ) {
    console.log(
      "Math.abs(nodePointClicked.x - currValidStartNodeClicked.x) <= 1 && Math.abs(nodePointClicked.y - currValidStartNodeClicked.y) <= 1"
    );
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

    console.log(proposedLineSlope, deltaX, deltaY); //3/3=1

    if (proposedLineSlope === 0) {
      //horizontal line takes delta x
      // let intPointsNeeded = deltaX - 1;
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
    console.log(
      generatedIntCoordinates,
      currValidStartNodeClicked,
      nodePointClicked
    );
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

  validCoordinatesCollection = [...new Set(validCoordinatesCollection)]; //get rid of duplicates
  console.log(generatedIntCoordinates);
  console.log(validCoordinatesCollection);
  //THIS IS THE PROBLEM ABOVE!!!!!!!!!!!!!!!!!!!!!!
}

function checkIfEndPointAlreadyExists(
  currValidStartNodeClicked,
  nodePointClicked
) {
  console.log("WE ARI INSIDE checkIfEndPointAlreadyExists function");
  console.log(currValidStartNodeClicked);
  console.log(nodePointClicked);
  //console.trace("WHEN IS checkIfEndPointAlreadyExists called???");
  //if this is the first line in the game and existing validCoordinatesCollection and existingLinesCollection are empty then we can approve the endpoint that should have passed as not the same as the valid start node first click
  //if the angle is legal this will trigger true if it is the first move of the game because intersection and existing points or lines is not an issue at this point
  if (
    validCoordinatesCollection.length === 0 &&
    existingLinesCollection.length === 0
  ) {
    console.log(
      "THIS IS THE FIRST LINE OF THE GAME SO NO NEED TO COMPARE POINTS"
    );
    return true;
  } else if (
    validCoordinatesCollection.length !== 0 &&
    existingLinesCollection.length !== 0
  ) {
    //does the proposed endpoint already exist in the current line?
    for (let i = 0; i < validCoordinatesCollection.length; i++) {
      console.log("INSIDE THE POINT LOOP NOW");
      if (
        nodePointClicked.x === validCoordinatesCollection[i].x && //currently the inner line endpoints are not in this array so they are valid right now
        nodePointClicked.y === validCoordinatesCollection[i].y
      ) {
        console.log("POINT HAS BEEN USED");
        return false;
      } else {
        console.log("POINT HAS NOT BEEN USED");
        continue;
      }
    }
  }

  console.log("we are calling function 2");
  return checkIfProposedLineWillIntersect(
    currValidStartNodeClicked,
    nodePointClicked
  );
}

function checkIfProposedLineWillIntersect(
  currValidStartNodeClicked,
  nodePointClicked
) {
  console.log(validCoordinatesCollection);
  console.log(existingLinesCollection);
  console.log(currValidStartNodeClicked);
  console.log(nodePointClicked);
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
        console.log(
          "THERE IS A BIG PROBLEM WITH INTERSECTION HERE!!!!!!!!!!!!!!!!!!!!!!!"
        );
        if (
          isThereAnIntersectionConflict[0] === startingPointX &&
          isThereAnIntersectionConflict[1] === startingPointY
        ) {
          continue;
        } else {
          console.log(isThereAnIntersectionConflict);
          console.log("PLUGGED IN COORDINATES BELOW");
          console.log(
            startingPointX,
            startingPointY,
            endingPointX,
            endingPointY,
            existingStartingPointX,
            existingStartingPointY,
            existingEndingPointX,
            existingEndingPointY
          );
          return false;
        }
      }
    }
  }
  console.log("we are calling function 3");
  return true;
}

function gameOver(mostRecentEndNodeOne, mostRecentEndNodeTwo) {
  console.log("INSIDE GAME OVER FUNCTION");
  console.trace("THIS IS WHEN WE CALL gameOver FUNCTION!!!!!!!");
  let endNodeOnePasses = true;
  let endNodeTwoPasses = true;
  let areTherePassingNodesFromEndNodeOne = false; //these switch to true if at least one thing passes
  let areTherePassingNodesFromEndNodeTwo = false;
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
  console.log(potentialEndNodesOne, potentialEndNodesTwo); //good!!!!!!!

  //CHECK 1: eliminate any negative values or values that exceed gridMax immediately
  //potential start node one
  console.log("INSIDE CHECK ONE GAME OVER");
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
  console.log(validCoordinatesCollection);
  console.log(availableNodesOneRoundOne); //good!!!!!!

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
  console.log(validCoordinatesCollection);
  console.log(availableNodesTwoRoundOne); //good!!!!!!

  //BELOW SHOULD ELIMIMATE USED NODES BUT IT IS NOT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //CHECK 2: we check both valid start nodes individually for used nodes
  //potential start node one
  console.log("INSIDE CHECK TWO GAME OVER");
  for (let i = validCoordinatesCollection.length - 1; i >= 0; i--) {
    for (let j = availableNodesOneRoundOne.length - 1; j >= 0; j--) {
      console.log(validCoordinatesCollection);
      console.log(availableNodesOneRoundOne.length);
      if (
        validCoordinatesCollection[i].x === availableNodesOneRoundOne[j].x &&
        validCoordinatesCollection[i].y === availableNodesOneRoundOne[j].y
      ) {
        console.log("ADDING NODE ONE!!!"); //TRY CHECKING ANGLES HERE FOR DIAGONAL VS VERTICAL i++ BREAKS THESE AS YOU TOGGLE IT ON AND OFF
        console.log(availableNodesOneRoundOne[j]);
        availableNodesOneRoundOne.splice(j, 1);
        // i--;
      }
    }
  }
  console.log(unavailableNodesOneRoundOne);
  console.log(availableNodesOneRoundOne);

  //potential start node two
  for (let i = validCoordinatesCollection.length - 1; i >= 0; i--) {
    for (let j = availableNodesTwoRoundOne.length - 1; j >= 0; j--) {
      console.log(availableNodesTwoRoundOne.length);
      if (
        validCoordinatesCollection[i].x === availableNodesTwoRoundOne[j].x &&
        validCoordinatesCollection[i].y === availableNodesTwoRoundOne[j].y
      ) {
        console.log("ADDING NODE TWO!!!");
        console.log(availableNodesTwoRoundOne[j]);
        availableNodesTwoRoundOne.splice(j, 1);
        // i--;
      }
    }
  }
  console.log(unavailableNodesTwoRoundOne); //now we can subtract length to use for game over
  console.log(availableNodesTwoRoundOne);

  //CHECK 3: if the potential node is unused then we check if it is an illegal line intersection
  console.log("INSIDE CHECK THREE GAME OVER");
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
      console.log(availableNodesOneRoundOne);
      //   console.trace(availableNodesOneRoundOne);
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
      console.log(i);

      if (
        isThereAnIntersectionConflict !== false &&
        isThereAnIntersectionConflict[0] !== startingPointX &&
        isThereAnIntersectionConflict[1] !== startingPointY
      ) {
        // areTherePassingNodesFromEndNodeOne = true;
        console.log(isThereAnIntersectionConflict);
        availableNodesOneRoundOne.splice(i, 1);
        console.log(availableNodesOneRoundOne);
        i--;
        if (availableNodesOneRoundOne.length === 0) {
          break;
        } else {
          continue;
        }
      } else if (
        isThereAnIntersectionConflict === false &&
        isThereAnIntersectionConflict[0] !== startingPointX &&
        isThereAnIntersectionConflict[1] !== startingPointY
      ) {
        //console.log("INTERSECTION CONFLICT HERE");
        console.log(isThereAnIntersectionConflict);
      }
    }
  }

  //potential start node two
  for (let i = availableNodesTwoRoundOne.length - 1; i >= 0; i--) {
    for (let j = existingLinesCollection.length - 1; j >= 0; j--) {
      let startingPointX = mostRecentEndNodeTwo.x;
      let startingPointY = mostRecentEndNodeTwo.y;
      console.log(availableNodesTwoRoundOne);
      console.log(availableNodesTwoRoundOne.length); //if array is empty going in a reference error happens
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
      console.log(i);
      //you can get rid of the second condition here for closer results but it may be needed and it may be a problem upstream
      if (
        isThereAnIntersectionConflict !== false &&
        isThereAnIntersectionConflict[0] !== startingPointX &&
        isThereAnIntersectionConflict[1] !== startingPointY
      ) {
        console.log(isThereAnIntersectionConflict);
        availableNodesTwoRoundOne.splice(i, 1);
        console.log(availableNodesTwoRoundOne);
        i--;
        if (availableNodesTwoRoundOne.length === 0) {
          break;
        } else {
          continue;
        }
      } else if (
        isThereAnIntersectionConflict === false &&
        isThereAnIntersectionConflict[0] !== startingPointX &&
        isThereAnIntersectionConflict[1] !== startingPointY
      ) {
        //console.log("INTERSECTION CONFLICT HERE");
        console.log(isThereAnIntersectionConflict);
      }
    }
  }

  if (availableNodesOneRoundOne.length === 0) {
    endNodeOnePasses = false;
  }

  if (availableNodesTwoRoundOne.length === 0) {
    endNodeTwoPasses = false;
  }
  // if (areTherePassingNodesFromEndNodeTwo === false) {
  //   endNodeTwoPasses = false;
  // }

  //if all 16 surrounding nodes fail from both valid start nodes the game is over and return game over value
  console.log(availableNodesOneRoundOne, availableNodesOneRoundTwo);
  availableNodesOneRoundOne = [];
  availableNodesOneRoundTwo = [];
  console.log(availableNodesTwoRoundOne, availableNodesTwoRoundTwo);
  availableNodesTwoRoundOne = [];
  availableNodesTwoRoundTwo = [];
  console.log(endNodeOnePasses, endNodeTwoPasses);
  console.log(
    areTherePassingNodesFromEndNodeOne,
    areTherePassingNodesFromEndNodeTwo
  );

  if (endNodeOnePasses == false && endNodeTwoPasses == false) {
    return true;
  } else {
    return false;
  }
  return false;
}

//Exposed functions to use API for client server communication
app.ports.request.subscribe((message) => {
  //parse message to determine a response and then respond
  message = JSON.parse(message);
  console.log("CLIENT REQUEST IS BELOW");
  console.log(message);

  //send the message to be analyzed by the responseFactory function
  let response = messageResponseFactory(message); //catch the returned value and send it to client for processing
  console.log("SERVER RESPONSE IS BELOW");
  console.log(response);

  //when the response is determined, send the response to the client
  app.ports.response.send(response);
});
