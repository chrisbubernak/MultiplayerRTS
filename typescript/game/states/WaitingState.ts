﻿/// <reference path="../units/unit.ts" />
/// <reference path="../State.ts" />
/// <reference path="WalkingState.ts" />
/// <reference path="AttackingState.ts" />
/// <reference path="PursuingState.ts" />
/// <reference path="../Pathing.ts" />
/// <reference path="../commands/EngageCommand.ts" />

class WaitingState extends State {
  static instance: WaitingState;

  public static Instance(): WaitingState {
    if (typeof WaitingState.instance === "undefined") {
      WaitingState.instance = new WaitingState();
    }
    return WaitingState.instance;
  }

  public ToString(): string {
    return "WaitingState";
  }

  /* tslint:disable:no-empty */
  public Enter(unit: Unit): void {

  }

  public Execute(unit: Unit): void {
    // see if there is an enemy in target aquire range
    var enemy: Unit = WaitingState.Instance().enemyInTargetAqureRange(unit);

    // if we recieve have a walk command, transition to walking
    if (unit.command && unit.command.ToString() === "walk") {
      unit.ChangeState(WalkingState.Instance());
    } else if (unit.command && (unit.command.ToString() === "attack" || unit.command.ToString() === "engage")) {
      // if we have an attack command, transition to pursuing
      unit.ChangeState(PursuingState.Instance());
    } else if (enemy !== null) {
      // artificially issue an engage command to the unit
      unit.command = new EngageCommand(enemy);
      unit.newCommand = true;
    }
  }

  public Exit(unit: Unit): void {
    unit.newCommand = false;
  }
}

