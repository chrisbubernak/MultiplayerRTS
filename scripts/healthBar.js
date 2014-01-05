//class(ish) definition...

function HealthBar(x, y, percent) {
  this.x = x;
  this.y = y;
  this.w = 32;
  this.h = 32;
  
  if (percent > .7){
    this.color = 'green';
  }
  else if (percent > .4){
    this.color = 'yellow';
  }
  else {
    this.color = 'red';
  }
 
  ctx.fillStyle = this.color;
  ctx.fillRect(x, y, x+percent*w, y+h)

}







