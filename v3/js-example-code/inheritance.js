// Adapted from Effective JavaScript
function Actor(x, y) {
  this.x = x;
  this.y = y;
}

Actor.prototype.moveTo = function(x, y) {
  this.x = x;
  this.y = y;
}

function SpaceShip(x, y) {
  Actor.call(this, x, y);
  this.points = 0;
}

SpaceShip.prototype = Object.create(Actor.prototype); // inherit!
SpaceShip.prototype.type = "spaceship";
SpaceShip.prototype.scorePoint = function() {
  this.points++;
}

var s = new SpaceShip(10, 20);
s.moveTo(30, 40);
s.scorePoint();
s.scorePoint();
