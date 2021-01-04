import './index.css'
import Ship from './lib/Ship'

(() => {
  // Game settings
  const FPS = 60
  const TURN_SPEED = 360 // turn speed in degrees per second
  const LASER_MAX = 100 // Max number of lasers on the screen at once
  const LASER_SPEED = 500 // Speed of lasers in pixels per second
  const LASER_DIST = 0.4 // Max distance for laser to travel, 1 is screen size
  const FRICTION = 0.7 // fiction coefficient of space? (0 = no friction, 1 = lot of friction)
  const SHIP_ACC = 5
  const ASTEROID_NUM = 20 // starting number of asteroids
  const ASTEROID_JAG = 0.5 // jaggednes of the asteroids (0 = none; 1 = lots)
  const ASTEROID_SPEED = 50 // asteroid movement speed (pixels per second)
  const ASTEROID_SIZE = 100 // starting size of asteroid in pixels
  const ASTEROID_VERTICES = 10 // avg number of vertices for asteroids
  const SHIP_EXPLODE_DURATION = 0.5 // duration of ship explotion
  const LASER_EXPLODE_DURATION = 0.1 // duration of laser explotion
  const SHIP_INVISIBILITY_DURATION = 3 // duration of ship invicibility
  const SHIP_BLINK_DURATION = 0.1
  // Flags
  const SHOW_BOUNDING = true // show or hide collision bounding
  const SHOW_CENTRE_DOT = false // show or hide ships centre dot

  const canvas = document.getElementById('main')
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')

  let ship = new Ship(canvas.width / 2, canvas.height / 2)
  let asteroids = []
  createAsteroidBelt()

  // Set event handlers
  document.addEventListener('keydown', keyDown)
  document.addEventListener('keyup', keyUp)

  setInterval(update, 1000 / FPS)


  function keyUp ({ keyCode }) {
    switch (keyCode) {
      case 37: // left
        ship.rotation = 0
        break
      case 38: // up
        ship.moving = false
        break
      case 39: // right
        ship.rotation = 0
        break
      case 32: // space bar
        ship.canShoot = true
        break
    }
  }

  function keyDown ({ keyCode }) {
    switch (keyCode) {
      case 37: // left
        ship.rotation = TURN_SPEED / 180 * Math.PI / FPS
        break
      case 38: // up
        ship.moving = true
        break
      case 39: // right
        ship.rotation = - TURN_SPEED / 180 * Math.PI / FPS
        break
      case 32: // space bar
        shoot()
        break
    }
  }

  function shoot() {
    // Create the laser
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
      ship.lasers.push({ // From the nose of the ship
        x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
        y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
        xv: LASER_SPEED * Math.cos(ship.angle) / FPS,
        yv: - LASER_SPEED * Math.sin(ship.angle) / FPS,
        dist: 0,
        explodeTime: 0
      })
    }

    // Prevent shooting
    ship.canShoot = false
  }

  function createAsteroidBelt() {
    asteroids = []
    let x, y
    for (let i = 0; i < ASTEROID_NUM; i++) {
      do {
        [x, y] = [Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height)]
      } while(distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius)
      asteroids.push(createAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)))
    }
  }

  function destroyAsteroid(index) {
    const { x, y, radius } = asteroids[index]

    // TODO: Make this prettier
    // split the asteroid in two if needed
    if (radius === Math.ceil(ASTEROID_SIZE / 2) || radius === Math.ceil(ASTEROID_SIZE / 4)) {
      asteroids.push(createAsteroid(x, y, Math.ceil(radius / 2)))
      asteroids.push(createAsteroid(x, y, Math.ceil(radius / 2)))
    }

    asteroids.splice(index, 1)
  }

  function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }

  function createAsteroid(x, y, radius) {
    const asteroid = {
      x,
      y,
      xv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
      yv: Math.random() * ASTEROID_SPEED / FPS * (Math.random() < 0.5 ? 1 : -1),
      radius,
      angle: Math.random() * Math.PI * 2,
      v: Math.floor(Math.random() * (ASTEROID_VERTICES + 1) + ASTEROID_VERTICES / 2),
      offset: []
    }

    // Create the vertex offsets array
    for (let i = 0; i < ASTEROID_VERTICES; i++) {
      asteroid.offset.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG)
    }

    return asteroid
  }

  function explodeShip() {
    ship.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS)
  }

  function update () {
    const exploding = ship.explodeTime > 0
    const blinkOn = ship.blinkNum % 2 === 0

    // draw space
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Move the ship
    if (ship.moving) {
      ship.movement.x += SHIP_ACC * Math.cos(ship.angle) / FPS
      ship.movement.y -= SHIP_ACC * Math.sin(ship.angle) / FPS

      if (!exploding && blinkOn) {
        // draw the FLAME
        ctx.strokeStyle = 'red'
        ctx.fillStyle = 'yellow'
        ctx.lineWidth = 30 / 10
        ctx.beginPath()
        // nose of the ship
        ctx.moveTo(
          ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) + 0.5 * Math.sin(ship.angle)),
          ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - 0.5 * Math.cos(ship.angle))
        )
        // rear left
        ctx.lineTo(
          ship.x - ship.radius * (6 / 3 * Math.cos(ship.angle)),
          ship.y + ship.radius * (6 / 3 * Math.sin(ship.angle))
        )
        // rear right
        ctx.lineTo(
          ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - 0.5 * Math.sin(ship.angle)),
          ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + 0.5 * Math.cos(ship.angle))
        )
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
    } else {
      ship.movement.x -= FRICTION * ship.movement.x / FPS
      ship.movement.y -= FRICTION * ship.movement.y / FPS
    }

    if (!exploding) {
      if (blinkOn) {
        // draw ship (triangular)
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 30 / 20
        ctx.beginPath()
        // nose of the ship
        ctx.moveTo(
          ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
          ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle)
        )
        // rear left
        ctx.lineTo(
          ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
          ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - Math.cos(ship.angle))
        )
        // rear right
        ctx.lineTo(
          ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
          ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + Math.cos(ship.angle))
        )
        ctx.closePath()
        ctx.stroke()
      }

      if (ship.blinkNum > 0) {
        // reduce the blink time
        ship.blinkTime--

        // Reduce the blinkNum
        if (ship.blinkTime === 0) {
          ship.blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
          ship.blinkNum--
        }
      }

      // Show ship bound
      if (SHOW_BOUNDING) {
        ctx.strokeStyle = 'lime'
        ctx.beginPath()
        ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2, false)
        ctx.stroke()
      }
    } else {
      // draw ship exploding
      ctx.fillStyle = 'red'
      ctx.beginPath()
      ctx.arc(ship.x, ship.y, ship.radius * 1.4, 0, Math.PI * 2, false)
      ctx.fill()

      ctx.fillStyle = 'orange'
      ctx.beginPath()
      ctx.arc(ship.x, ship.y, ship.radius * 1.1, 0, Math.PI * 2, false)
      ctx.fill()

      ctx.fillStyle = 'yellow'
      ctx.beginPath()
      ctx.arc(ship.x, ship.y, ship.radius * 0.8, 0, Math.PI * 2, false)
      ctx.fill()

      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(ship.x, ship.y, ship.radius * 0.5, 0, Math.PI * 2, false)
      ctx.fill()
    }

    // draw asteroids
    ctx.lineWidth = 30 / 20
    for (let i = 0; i < asteroids.length; i++) {
      ctx.strokeStyle = "slategray"
      // get the asteroid props
      const { x, y, radius, angle, v, offset } = asteroids[i]

      // Draw a path
      ctx.beginPath()
      ctx.moveTo(
        x + radius * offset[0] * Math.cos(angle),
        y + radius * offset[0] * Math.sin(angle)
      )

      // Draw a polygon
      for (let j = 1; j < v; j++) {
        ctx.lineTo(
          x + radius * offset[j] * Math.cos(angle + j * Math.PI * 2 / v),
          y + radius * offset[j] * Math.sin(angle + j * Math.PI * 2 / v)
        )
      }
      ctx.closePath()
      ctx.stroke()

      // Show asteroid bound
      if (SHOW_BOUNDING) {
        ctx.strokeStyle = 'lime'
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2, false)
        ctx.stroke()
      }
    }

    // Draw lasers
    for (let i = 0; i < ship.lasers.length; i++) {
      if (ship.lasers[i].explodeTime === 0) {
        ctx.fillStyle = 'salmon'
        ctx.beginPath()
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, 30 / 15, 0, Math.PI * 2, false)
        ctx.fill()
      } else {
        // draw the explosion
        ctx.fillStyle = 'red'
        ctx.beginPath()
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.radius * 0.50,  0, Math.PI * 2, false)
        ctx.fill()
        // draw the explosion
        ctx.fillStyle = 'yellow'
        ctx.beginPath()
        ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.radius * 0.25, 0, Math.PI * 2, false)
        ctx.fill()
      }
    }

    // Detect laser colision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      // grab asteroid props
      const { x: ax, y: ay, radius: ar } = asteroids[i]

      // Loop the lasers
      for (let j = ship.lasers.length -1; j >= 0; j--) {
        const { x: lx, y: ly } = ship.lasers[j]

        // Detect hit
        if (!ship.lasers[j].explodeTime && distBetweenPoints(ax, ay, lx, ly) < ar) {
          // // Remove the laser
          // ship.lasers.splice(j, 1)

          // TODO: More stuff to do
          // Remove the asteroid
          destroyAsteroid(i)
          ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DURATION * FPS)
          break
        }
      }
    }

    // Check collisions
    if (!exploding) {
      // Handle collision if ship is "playing"
      if (ship.blinkNum === 0) {
        for (let i = 0; i< asteroids.length; i++) {
          if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.radius + asteroids[i].radius) {
            explodeShip()
            destroyAsteroid(i)
            break
          }
        }
      }

      // rotate ship
      ship.angle += ship.rotation

      // move the ship
      ship.x += ship.movement.x
      ship.y += ship.movement.y
    } else {
      ship.explodeTime--

      if (ship.explodeTime == 0) {
        ship = new Ship(canvas.width / 2, canvas.height / 2)
      }
     }

    // handle edge of screen
    if (ship.x < 0 - ship.radius) {
      ship.x = canvas.width + ship.radius
    } else if (ship.x > canvas.width + ship.radius) {
      ship.x = 0 - ship.radius
    }

    // handle edge of screen
    if (ship.y < 0 - ship.radius) {
      ship.y = canvas.height + ship.radius
    } else if (ship.y > canvas.height + ship.radius) {
      ship.y = 0 - ship.radius
    }

    // Move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
      // Check distance travelled
      if (ship.lasers[i].dist > LASER_DIST * canvas.width || (ship.lasers[i].x < 0 || ship.lasers[i].x > canvas.width || ship.lasers[i].y < 0 || ship.lasers[i].y > canvas.height)) {
        ship.lasers.splice(i, 1)
        continue
      }

      // Laser hit animation
      if (ship.lasers[i].explodeTime > 0) {
        ship.lasers[i].explodeTime--

        // Destroy the laser if the duration is up
        if (ship.lasers[i].explodeTime === 0) {
          ship.lasers.splice(i, 1)
          continue
        }
      } else {
        // Move the laser
        ship.lasers[i].x += ship.lasers[i].xv
        ship.lasers[i].y += ship.lasers[i].yv

        // Calc distance travel
        ship.lasers[i].dist += Math.sqrt(Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2))
      }

      // Handle edge of screen
      // Commented code is just to move the lasers to the other side
      // if (ship.lasers[i].x < 0) {
      //   ship.lasers[i].x = canvas.width
      // } else if (ship.lasers[i].x > canvas.width) {
      //   ship.lasers[i].x = 0
      // }
      //
      // if (ship.lasers[i].y < 0) {
      //   ship.lasers[i].y = canvas.height
      // } else if (ship.lasers[i].y > canvas.height) {
      //   ship.lasers[i].y = 0
      // }
    }

    // Move the asteroids
    for (let i = 0; i < asteroids.length; i++) {
      // Move the asteroid
      asteroids[i].x += asteroids[i].xv
      asteroids[i].y += asteroids[i].yv

      // Handle edge of screen
      if (asteroids[i].x < 0 - asteroids[i].radius) {
        asteroids[i].x = canvas.width + asteroids[i].radius
      } else if (asteroids[i].x > canvas.width + asteroids[i].radius) {
        asteroids[i].x = 0 - asteroids[i].radius
      }

      // Handle edge of screen
      if (asteroids[i].y < 0 - asteroids[i].radius) {
        asteroids[i].y = canvas.height + asteroids[i].radius
      } else if (asteroids[i].y > canvas.height + asteroids[i].radius) {
        asteroids[i].y = 0 - asteroids[i].radius
      }
    }
  }
})()