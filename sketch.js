const nx = 20
const ny = 20
const pad = 40
const n_actions = 5
const n_agents = 2
const ground_color = "forestgreen"
const wall_color = "darkslategrey"
const team_a_color = "cornflowerblue"
const team_b_color = "mediumorchid"
const MODE_PLAN = 0
const MODE_WAIT = 1
const MODE_GO = 2
const MODE_END = 3

let mode = MODE_WAIT
let turn = "A"
let acts_left = 0
let the_map
let players = {}
let scale

function setup() {
  createCanvas(500, 500);
  scale = (width - pad*2) / nx
  colorMode(HSB, 100)
  restart()
}

function newAgent(loc) {
  return {at: loc,
          actions: []}
}

function restart() {
  the_map = generateMap()
  turn = "A"
  acts_left = n_actions
  players.A = {agents: [newAgent([0, 0]),
                        newAgent([0, 1])]}
  players.B = {agents: [newAgent([nx-1, ny-1]),
                        newAgent([nx-1, ny-2])]}
}

function emptyGrid() {
  let m = []
  for (let ix = 0; ix < nx; ix++) {
    m[ix] = []
    for (let iy = 0; iy < ny; iy++) {
      m[ix][iy] = false
    }
  }
  return(m)
}

function addToWall(m, ix, iy) {
  m[ix][iy] = "wall"
  if (random() < 0.2) { return(m) }
  let choices = []
  if (ix+1 < nx-1) choices.push([ix+1, iy])
  if (iy+1 < ny) choices.push([ix, iy+1])
  if (ix-1 >= 1) choices.push([ix-1, iy])
  if (iy-1 >= 0) choices.push([ix, iy-1])
  let i,j
  [i,j] = random(choices)
  return(addToWall(m, i, j))
}

function generateMap() {
  let m = emptyGrid()
  for (let i = 0; i < nx*0.9; i++) {
    let x = floor(random(1, nx-1))
    let y = floor(random(1, ny-1))
    m = addToWall(m, x, y)
  }
  return(m)
}

function xy_to_grid(x, y) {
  let ix = floor((x - pad) / scale)
  let iy = floor((y - pad) / scale)
  if ((ix > 0) && (iy > 0) && (ix < nx) && (iy < ny)) {
    return [ix, iy]
  }
}

function drawAgent(agent) {
  let xi,yi
  [xi, yi] = agent.at
  ellipse(pad + (xi+0.5) * scale, 
          pad + (yi+0.5) * scale,
          scale-2, scale-2);
}

function drawMap() {
  background(wall_color);
  stroke("black")
  strokeWeight(1)
  noStroke()
  fill(ground_color)
  rect(pad, pad, width-2*pad, height-2*pad)
  // draw walls
  let scale = (width - pad*2) / nx
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (the_map[ix][iy] == "wall") {
        fill(wall_color)
        rect(pad + ix * scale,
             pad + iy * scale, scale, scale)
      }
    }
  }
  // draw grid
  stroke(color(0,0,0,25))
  for (let ix = 0; ix <= nx; ix++) {
    line(pad + ix * scale, pad,
         pad + ix * scale, height-pad)
  }
  for (let iy = 0; iy <= ny; iy++) {
    line(pad, pad + iy * scale,
         width-pad, pad + iy * scale)
  }
}

function drawAgents() {
  
}

// GENERICS

function draw() {
  if (mode == MODE_PLAN) {
    draw_plan()
  } else if (mode == MODE_WAIT) {
    draw_wait()
  } else if (mode == MODE_GO) {
    draw_go()
  } else if (mode == MODE_END) {
    draw_end()
  }
}

function mouseClicked() {
  if (mode == MODE_PLAN) {
    mouseClicked_plan()
  } else if (mode == MODE_WAIT) {
    mouseClicked_wait()
  } else if (mode == MODE_GO) {
    mouseClicked_go()
  } else if (mode == MODE_END) {
    mouseClicked_end()
  }
}

function keyPressed() {
  if (mode == MODE_PLAN) {
    keyPressed_plan()
  } else if (mode == MODE_WAIT) {
    keyPressed_wait()
  } else if (mode == MODE_GO) {
    keyPressed_go()
  } else if (mode == MODE_END) {
    keyPressed_end()
  }
}

// WAIT

function draw_wait() {
  drawMap()
  // draw players
  stroke("black")
  fill(team_a_color)
  for (const agent of players.A.agents) {
    drawAgent(agent)
  }
  fill(team_b_color)
  for (const agent of players.B.agents) {
    drawAgent(agent)
  }
  // draw overlay message
  background(color(0,0,0,50))
  textAlign(CENTER,CENTER)
  fill("white")
  textSize(50)
  text("Player " + turn, width/2, height/2)
  textSize(30)
  text("Plan your moves", width/2, height/2 + 100)
  text("(click)", width/2, height/2 + 150)
}

function mouseClicked_wait() {
  mode = MODE_PLAN
}
function keyPressed_wait() {
  mode = MODE_PLAN
}

// PLAN

let sel_agent = 0

function draw_plan() {
  drawMap()
  // draw players
  stroke("black")
  let opponent
  if (team = "A") {
    fill(team_b_color)
    opponent = players.B
  } else {
    fill(team_a_color)
    opponent = players.A
  }
  for (const agent of opponent.agents) {
    drawAgent(agent)
  }
  // highlight selected agent
  stroke("yellow")
  strokeWeight(2)
  noFill()
  drawAgent(players[turn].agents[sel_agent])
  // status display
  noStroke()
  textAlign(LEFT, BASELINE)
  textSize(20)
  fill("white")
  text("Player " + turn + ": " + acts_left + " actions left",
       10, pad - 10)
}

function mouseClicked_plan() {
  let ix,iy
  [ix, iy] = xy_to_grid(mouseX, mouseY)
  if (ix) {

  }
}

function keyPressed_plan() {

}
