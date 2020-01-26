const nx = 20
const ny = 20
const pad = {l: 70, r: 70, t: 70, b: 70}
const n_actions = 5
const n_agents = 2
const ground_color = "forestgreen"
const wall_color = "darkslategrey"
const team_color = {A: "cornflowerblue",
                    B: "mediumorchid"}
const MODE_PLAN = 1
const MODE_WAIT = 2
const MODE_GO = 3
const MODE_END = 4

let mode = MODE_WAIT
let turn = "A"
let acts_left = 0
let the_map
let players = {}
let scale, board_width, board_height

function setup() {
  createCanvas(600, 600);
  frameRate(5)
  board_height = height - pad.t - pad.b
  board_width = width - pad.l - pad.r
  scale = board_width / nx
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
  let ix = floor((x - pad.l) / scale)
  let iy = floor((y - pad.l) / scale)
  if ((ix >= 0) && (iy >= 0) && (ix < nx) && (iy < ny)) {
    return [ix, iy]
  }
}

function drawAgent(at) {
  let xi,yi
  [xi, yi] = at
  ellipse(pad.l + (xi+0.5) * scale, 
          pad.l + (yi+0.5) * scale,
          scale-2, scale-2);
}

function drawMap() {
  background(wall_color);
  stroke("black")
  strokeWeight(1)
  noStroke()
  fill(ground_color)
  rect(pad.l, pad.t, board_width, board_height)
  // draw walls
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      if (the_map[ix][iy] == "wall") {
        fill(wall_color)
        rect(pad.l + ix * scale,
             pad.l + iy * scale, scale, scale)
      }
    }
  }
  // draw grid
  stroke(color(0,0,0,25))
  for (let ix = 0; ix <= nx; ix++) {
    line(pad.l + ix * scale, pad.t,
         pad.l + ix * scale, height-pad.b)
  }
  for (let iy = 0; iy <= ny; iy++) {
    line(pad.l, pad.t + iy * scale,
         width-pad.r, pad.t + iy * scale)
  }
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
  for (const team of ["A","B"]) {
    fill(team_color[team])
    for (const agent of players[team].agents) {
      drawAgent(agent.at)
    }
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
  setup_plan_mode()
}
function keyPressed_wait() {
  mode = MODE_PLAN
  setup_plan_mode()
}

// PLAN

const PMODE_MOVE = 1
const PMODE_SCAN = 2
const PMODE_GRENADE = 3

let sel_agent = 0
let plan_mode = PMODE_MOVE
let plan_graph = null

function setup_plan_mode() {
  let nodes = []
  for (let ix = 0; ix < nx; ix++) {
    nodes[ix] = []
    for (let iy = 0; iy < ny; iy++) {
      let w = 1
      if (the_map[ix][iy] == "wall") {
        w = 0
      }
      nodes[ix].push(w)
    }
  }
  // TODO block other agents
  // let agent = players[turn].agents
  plan_graph = new Graph(nodes)
}

function shortest_path(graph, from, to) {
  let from_node = graph.grid[from[0]][from[1]]
  let to_node = graph.grid[to[0]][to[1]]
  path = astar.search(graph, from_node, to_node, {
    closest: true
  });
  return path
}

function draw_plan() {
  drawMap()
  // draw players
  stroke("black")
  let opp = (turn == "A") ? "B" : "A"
  let opponent = players[opp]
  fill(team_color[opp])
  for (const agent of opponent.agents) {
    drawAgent(agent.at)
  }
  fill(team_color[turn])
  for (const agent of players[turn].agents) {
    drawAgent(agent.at)
  }
  // highlight selected agent
  let agent = players[turn].agents[sel_agent]
  stroke("yellow")
  strokeWeight(2)
  noFill()
  drawAgent(agent.at)

  // preview movement path
  let targ = xy_to_grid(mouseX, mouseY)
  if (targ) {
    let path = shortest_path(plan_graph, agent.at, targ)
    fill(color("yellow"))
    noStroke()
    for (const node of path) {
      drawAgent([node.x, node.y])
    }
  }
  // status display
  noStroke()
  textAlign(LEFT, BASELINE)
  textSize(20)
  fill("white")
  text("Player " + turn + ": " + acts_left + " actions left",
       10, pad.l - 10)
}

function draw_timeline() {

}

function mouseClicked_plan() {
  let targ = xy_to_grid(mouseX, mouseY)
  if (targ) {
    let path = shortest_path(plan_graph, agent.at, targ)

  }
}

function keyPressed_plan() {

}
