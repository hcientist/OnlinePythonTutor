function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

var v1 = new Vector(1, 2);
var v2 = Vector(20, 30); // whoops, forgot 'new'
