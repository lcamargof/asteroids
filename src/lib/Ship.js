const SHIP_SIZE = 30

class Ship {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.radius = SHIP_SIZE / 2
    this.angle = 90 / 180 * Math.PI // convert to radians
    this.rotation = 0
    this.moving = false
    this.blinkNum = Math.ceil(3 / 0.1)
    this.blinkTime = Math.ceil(0.1 * 60)
    this.lasers = []
    this.movement = {
      x: 0,
      y: 0
    }
    this.explodeTime = 0
    this.canShoot = true
  }
}

export default Ship