/// <reference path="BaseGameEntity.ts" />

class State {
  constructor() {

  }
  public ToString(): string {
    return "State";
  }
  public Enter(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }
  public Execute(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }
  public Exit(entity: BaseGameEntity) {
    alert(this + " State Enter Function Not Implemented!");
  }
}