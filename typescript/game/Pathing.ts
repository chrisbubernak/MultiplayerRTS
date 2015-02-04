/// <reference path="Utilities.ts" />
/// <reference path="PriorityQueue.ts" />
/// <reference path="Game.ts" />
/// <reference path="logger.ts" />

class Pathing {
  // runs a star to a specific grid location
  public static aStarToLoc(start: number, goal: number , unit: Unit): number[] {
    if (start === null || start === undefined || 
      goal === null || goal === undefined ||
      unit === null || unit === undefined) {
      Logger.LogError("Problem with Pathing.aStarToLoc()");
      Logger.LogError("start: " + start);
      Logger.LogError("goal: " + goal);
      Logger.LogError("unit: " + unit);
      return;
    }

    var closedSet: number[] = new Array();
    var openSet: PriorityQueue = new PriorityQueue();

    var final: number;

    // use this to choose a fallback goal state if we can't reach the goal
    var distanceToGoal: PriorityQueue = new PriorityQueue();
    var cameFrom: any = new Object();
    var gScore: any = new Object();
    var fScore: any = new Object();

    gScore[start] = 0;
    fScore[start] = gScore[start] + this.heuristic(start, goal);
    openSet.enqueue(start, fScore[start]);
    var cur: number;
    var nodesExplored: number = 0;
    var nodeThreshold: number = Game.getNumOfCols() * 2;
    while (!openSet.isEmpty() && nodesExplored < nodeThreshold) {
      nodesExplored++;
      cur = openSet.dequeue();

      // are we done?
      if (cur === goal) {
        return this.getPath(cameFrom, goal, start);
      }

      closedSet.push(cur);
      var neighbors: number[] = Utilities.neighbors(cur);

      // check all of the neighbor moves for collisions
      for (var i: number = neighbors.length - 1; i >= 0; i--) {
        var offGridRight: boolean =
          Math.floor(neighbors[i] / Game.getNumOfCols()) !==
          Math.floor((neighbors[i] + unit.gridWidth - 1) / Game.getNumOfCols());
        var offGridBottom: boolean = neighbors[i] + (unit.gridHeight - 1) * Game.getNumOfCols() > Game.getNumOfCols() * Game.getNumOfRows();
        if (offGridRight || offGridBottom || (!Game.getTerrainLoc(neighbors[i]).walkable)) {
          if (neighbors[i] === goal) {
            // if the goal was unreachable path to the thing we think is closest to it
            final = distanceToGoal.dequeue();
            return this.getPath(cameFrom, final, start);
          }
          neighbors.splice(i, 1);
          continue;
        }

        // for each move make sure this unit could move there without colliding with any thing
        var locs: number[] = Utilities.getOccupiedSquares(neighbors[i], unit.gridWidth, unit.gridHeight);
        for (var l: number = 0; l < locs.length; l++) {
          var gridLoc: number = Game.getGridLoc(locs[l]);
          var terrainLoc: TerrainTile = Game.getTerrainLoc(locs[l]);

          if ((gridLoc !== unit.id && gridLoc !== null) || !terrainLoc.walkable) {
            if (neighbors[i] === goal) {
              // if the goal was unreachable path to the thing we think is closest to it
              // pq could be null though at this point if our current location is good enough
              // in that case our path is 0 length
              final = distanceToGoal.dequeue();
              return this.getPath(cameFrom, final || start, start);
            }
            neighbors.splice(i, 1);
            break;
          }
        }
      }

      for (var j: number = 0; j < neighbors.length; j++) {
        var tempGScore: number = gScore[cur] + Utilities.distance(cur, neighbors[j]);
        var heuristic: number = this.heuristic(neighbors[j], goal);
        var tempFScore: number = tempGScore + heuristic;
        distanceToGoal.enqueue(neighbors[j], heuristic);
        if ((closedSet.indexOf(neighbors[j]) !== -1) && (tempFScore >= fScore[neighbors[j]])) {
          continue;
        }
        if ((openSet.indexOf(neighbors[j]) === -1) || tempFScore < fScore[neighbors[j]]) {
          cameFrom[neighbors[j]] = cur;

          gScore[neighbors[j]] = tempGScore;
          fScore[neighbors[j]] = tempFScore;
          if (openSet.indexOf(neighbors[j]) === -1) {
            openSet.enqueue(neighbors[j], fScore[neighbors[j]]);
          } else {
            // if the neighbor was already in the openset we need to update it in the priority queue
            openSet.update(neighbors[j], fScore[neighbors[j]]);
          }
        }
      }
    }
    // if the goal was unreachable path to the thing we think is closest to it
    return Pathing.getPath(cameFrom, distanceToGoal.dequeue(), start);
  }

  // this should return the path as an array going from first move to last
  private static getPath(cameFrom: number[], cur: number, start: number): number[] {
    if (cameFrom === null || cameFrom === undefined || 
      cur === null || cur === undefined ||
      start === null || start === undefined) {
      Logger.LogError("Error in Pathing.GetPath()");
      Logger.LogError("cameFrom: " + cameFrom);
      Logger.LogError("cur: " + cur);
      Logger.LogError("start: " + start);
      return;
    }

    var returnArray: number[] = Array();
    while (cur !== start) {
      returnArray.splice(0, 0, cur);
      cur = cameFrom[cur];
    }
    return returnArray;
  }

  private static heuristic(a: number, b: number): number{
    return Utilities.distance(a, b);
  }
}
