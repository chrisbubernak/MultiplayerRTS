/// <reference path="Utilities.ts" />
/// <reference path="PriorityQueue.ts" />
/// <reference path="Game.ts" />

class Pathing {
  public static aStar(start, goal, unit) {
    var closedSet = new Array();
    var openSet = new PriorityQueue();
    var distanceToGoal = new PriorityQueue(); //use this to choose a fallback goal state if we can't reach the goal
    var cameFrom = new Object();
    var gScore = new Object();
    var fScore = new Object();

    gScore[start] = 0;
    fScore[start] = gScore[start] + this.heuristic(start, goal);
    openSet.enqueue(start, fScore[start]);
    var cur;
    var nodesExplored = 0;
    var nodeThreshold = Game.getBoxesPerRow() * 2;
    while (!openSet.isEmpty() && nodesExplored < nodeThreshold) {
      nodesExplored++;
      cur = openSet.dequeue();

      //are we done?
      if (cur == goal) {
        return this.getPath(cameFrom, goal, start);
      }

      closedSet.push(cur);
      var neighbors = utilities.neighbors(cur);

      //check all of the neighbor moves for collisions
      for (var i = neighbors.length - 1; i >= 0; i--) {
        var coords = utilities.boxToCoords(neighbors[i]);
        if (((coords.x + unit.w) > Game.getCanvasWidth()) || ((coords.y + unit.h) > Game.getCanvasHeight()) || (!Game.getTerrainLoc(neighbors[i]).walkable)) {
          //drawer.drawPathing(neighbors[i], "blue", 0);
          if (neighbors[i] == goal) {
            //if the goal was unreachable path to the thing we think is closest to it
            var final = distanceToGoal.dequeue();
            return this.getPath(cameFrom, final, start);
          }
          neighbors.splice(i, 1);
          continue;
        }

        //for each move make sure this unit could move there without colliding with any thing
        var locs = locs = utilities.getOccupiedSquares(neighbors[i], unit.w, unit.h);
        for (var l in locs) {
          var gridLoc = Game.getGridLoc(locs[l]);
          var terrainLoc = Game.getTerrainLoc(locs[l]);
          if ((gridLoc != unit.id && gridLoc != null) || !terrainLoc.walkable) {
            //drawer.drawPathing(neighbors[i], "blue", 0);
            if (neighbors[i] == goal) {
              //if the goal was unreachable path to the thing we think is closest to it
              //pq could be null though at this point if our current location is good enough
              //in that case our path is 0 length
              var final = distanceToGoal.dequeue();
              return this.getPath(cameFrom, final || start, start);
            }
            neighbors.splice(i, 1);
            break;
          }
        }
      }

      for (var i = 0; i < neighbors.length; i++) {
        var t_gScore = gScore[cur] + utilities.distance(utilities.boxToCoords(cur), utilities.boxToCoords(neighbors[i])) / Game.getBoxSize();
        var heuristic = this.heuristic(neighbors[i], goal);
        var t_fScore = t_gScore + heuristic;
        distanceToGoal.enqueue(neighbors[i], heuristic);
        if ((closedSet.indexOf(neighbors[i]) != -1) && (t_fScore >= fScore[neighbors[i]])) {
          continue;
        }
        if ((openSet.indexOf(neighbors[i]) == -1) || t_fScore < fScore[neighbors[i]]) {
          cameFrom[neighbors[i]] = cur;

          gScore[neighbors[i]] = t_gScore;
          fScore[neighbors[i]] = t_fScore;
          if (openSet.indexOf(neighbors[i]) == -1) {
            openSet.enqueue(neighbors[i], fScore[neighbors[i]]);
            //drawer.drawPathing(neighbors[i], "red", fScore[neighbors[i]]);
          }
          //if the neighbor was already in the openset we need to update it in the priority queue
          else {
            openSet.update(neighbors[i], fScore[neighbors[i]]);
          }
        }
      }
    }
    //if the goal was unreachable path to the thing we think is closest to it
    return this.getPath(cameFrom, distanceToGoal.dequeue(), start);
  }

  //this should return the path as an array going from first move to last
  private static getPath(cameFrom, cur, start) {
    var returnArray = new Array();
    while (cur != start) {
      returnArray.splice(0, 0, cur);
      cur = cameFrom[cur];
      //drawer.drawPathing(cur, "green", 0);
    }
    return returnArray;
  }

  private static heuristic(a: number, b: number) {
    var c = utilities.boxToCoords(a);
    var d = utilities.boxToCoords(b);
    var dx = Math.abs(c.x - d.x) / Game.getBoxSize();
    var dy = Math.abs(c.y - d.y) / Game.getBoxSize();
    return dx + dy;
  }
}