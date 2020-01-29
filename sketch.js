const nx = 20
const ny = 20
const pad = { l: 100, r: 20, t: 70, b: 50 }
const n_actions = 10
const n_agents = 2
const bomb_range = 5
const bomb_radius = 1
const ground_color = "forestgreen"
const wall_color = "darkslategrey"
const team_color = {
  A: "cornflowerblue",
  B: "mediumorchid"
}
const MODE_WAIT_PLAN = 1
const MODE_PLAN = 2
const MODE_WAIT_GO = 3
const MODE_GO = 4
const MODE_END = 5

const ACT_MOVE = "👣"
const ACT_SCAN = "🔊"
const ACT_BOMB = "💣"
// actions are like {action: ACT_MOVE, target: [3,10]}

let mode = MODE_WAIT_PLAN
let turn = "A"
let the_map
let players = {}
let scale, board_width, board_height

function setup() {
  createCanvas(600, 600);
  frameRate(5)
  let free_height = height - pad.t - pad.b
  let free_width = width - pad.l - pad.r
  if (free_width < free_height) {
    board_width = free_width
    scale = board_width / nx
    board_height = ny * scale
  } else {
    board_height = free_height
    scale = board_height / ny
    board_width = nx * scale
  }
  colorMode(HSB, 100)
  restart()
}

function pxX(xi) {
  return pad.l + (xi + 0.5) * scale
}

function pxY(yi) {
  return pad.t + (yi + 0.5) * scale
}

function newAgent(loc) {
  let actions = []
  for (let i = 0; i < n_actions; i++) actions[i] = null
  return {
    at: loc,
    actions: actions
  }
}

function restart() {
  the_map = generateMap()
  turn = "A"
  players.A = {
    agents: [newAgent([0, 0]),
    newAgent([0, 1])]
  }
  players.B = {
    agents: [newAgent([nx - 1, ny - 1]),
    newAgent([nx - 1, ny - 2])]
  }
}

function emptyGrid() {
  let m = []
  for (let ix = 0; ix < nx; ix++) {
    m[ix] = []
    for (let iy = 0; iy < ny; iy++) {
      m[ix][iy] = false
    }
  }
  return (m)
}

function addToWall(m, ix, iy) {
  m[ix][iy] = "wall"
  if (random() < 0.2) { return (m) }
  let choices = []
  if (ix + 1 < nx - 1) choices.push([ix + 1, iy])
  if (iy + 1 < ny) choices.push([ix, iy + 1])
  if (ix - 1 >= 1) choices.push([ix - 1, iy])
  if (iy - 1 >= 0) choices.push([ix, iy - 1])
  let i, j
  [i, j] = random(choices)
  return (addToWall(m, i, j))
}

function generateMap() {
  let m = emptyGrid()
  for (let i = 0; i < nx * 0.9; i++) {
    let x = floor(random(1, nx - 1))
    let y = floor(random(1, ny - 1))
    m = addToWall(m, x, y)
  }
  return (m)
}

function xy_to_grid(x, y) {
  let ix = floor((x - pad.l) / scale)
  let iy = floor((y - pad.t) / scale)
  if ((ix >= 0) && (iy >= 0) && (ix < nx) && (iy < ny)) {
    return [ix, iy]
  }
}

function clip_to_board() {
  let ctx = drawingContext
  ctx.beginPath()
  ctx.moveTo(pxX(-0.5), pxY(-0.5))
  ctx.lineTo(pxX(nx - 0.5), pxY(-0.5))
  ctx.lineTo(pxX(nx - 0.5), pxY(ny - 0.5))
  ctx.lineTo(pxX(-0.5), pxY(ny - 0.5))
  ctx.clip()
}

function drawAgent(at) {
  let xi, yi
  [xi, yi] = at
  ellipse(pxX(xi), pxY(yi), scale - 3, scale - 3)
}

function drawScan(source, target) {
  let sxi, syi, txi, tyi;
  [sxi, syi] = source;
  [txi, tyi] = target;
  line(pxX(sxi), pxY(syi), pxX(txi), pxY(tyi))
}

function drawBombAction(at) {
  let xi, yi
  [xi, yi] = at
  push()
  clip_to_board()
  ellipse(pxX(xi), pxY(yi),
    scale + 2 * bomb_radius * scale,
    scale + 2 * bomb_radius * scale)
  pop()
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
          pad.t + iy * scale, scale, scale)
      }
    }
  }
  // draw grid
  stroke(color(0, 0, 0, 25))
  for (let ix = 0; ix <= nx; ix++) {
    line(pad.l + ix * scale, pad.t,
      pad.l + ix * scale, pad.t + board_height)
  }
  for (let iy = 0; iy <= ny; iy++) {
    line(pad.l, pad.t + iy * scale,
      pad.l + board_width, pad.t + iy * scale)
  }
}

// GENERICS

function draw() {
  if (mode == MODE_WAIT_PLAN) {
    draw_wait_plan()
  } else if (mode == MODE_PLAN) {
    draw_plan()
  } else if (mode == MODE_WAIT_GO) {
    draw_wait_go()
  } else if (mode == MODE_GO) {
    draw_go()
  } else if (mode == MODE_END) {
    draw_end()
  }
}

function mouseClicked() {
  if (mode == MODE_WAIT_PLAN) {
    mouseClicked_wait_plan()
  } else if (mode == MODE_PLAN) {
    mouseClicked_plan()
  } else if (mode == MODE_WAIT_GO) {
    mouseClicked_wait_go()
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

// WAIT_PLAN

function draw_wait_plan() {
  drawMap()
  // draw players
  stroke("black")
  for (const team of ["A", "B"]) {
    fill(team_color[team])
    for (const agent of players[team].agents) {
      drawAgent(agent.at)
    }
  }
  // draw overlay message
  background(color(0, 0, 0, 50))
  textAlign(CENTER, CENTER)
  fill("white")
  textSize(50)
  text("Player " + turn, width / 2, height / 2)
  textSize(30)
  text("Plan your moves", width / 2, height / 2 + 100)
  text("(click)", width / 2, height / 2 + 150)
}

function mouseClicked_wait_plan() {
  mode = MODE_PLAN
  init_plan_mode()
}
function keyPressed_wait_plan() {
  mode = MODE_PLAN
  init_plan_mode()
}

// PLAN

const PMODE_MOVE = 1
const PMODE_SCAN = 2
const PMODE_BOMB = 3

let plan_step
let plan_agent
let plan_mode
let plan_graph

function init_plan_mode() {
  plan_step = 0
  plan_agent = 0
  plan_mode = PMODE_MOVE
  generate_plan_graph()
}

function generate_plan_graph() {
  const blocked = 0
  const open = 1
  let nodes = []
  // open spaces and walls
  for (let ix = 0; ix < nx; ix++) {
    nodes[ix] = []
    for (let iy = 0; iy < ny; iy++) {
      let w = open
      if (the_map[ix][iy] == "wall") {
        w = blocked
      }
      nodes[ix].push(w)
    }
  }
  plan_graph = new Graph(nodes)
}

function current_plan_locs() {
  let curr_locs = []
  for (let ai = 0; ai < n_agents; ai++) {
    let agent = players[turn].agents[ai]
    curr_locs[ai] = agent.at
    for (let j = 0; j < plan_step; j++) {
      act = agent.actions[j]
      if (act && act.action == ACT_MOVE) {
        curr_locs[ai] = act.target
      }
    }
  }
  return curr_locs
}

function shortest_path(graph, source, target) {
  let source_node = graph.grid[source[0]][source[1]]
  let target_node = graph.grid[target[0]][target[1]]
  _path = astar.search(graph, source_node, target_node, {
    closest: true
  });
  let path = _path.map(o => [o.x, o.y])
  return path
}

function line_of_sight(source, target) {
  let dx = target[0] - source[0]
  let dy = target[1] - source[1]
  if (abs(dx) > abs(dy)) {
    dx = (dx > 0) ? 1 : -1
    dy = 0
  } else {
    dx = 0
    dy = (dy > 0) ? 1 : -1
  }
  let ix, iy
  [ix, iy] = source
  let end = null
  while (true) {
    ix += dx
    iy += dy
    if ((ix < 0) || (iy < 0) || (ix >= nx) || (iy >= ny)) break
    if (the_map[ix][iy] == "wall") break
    end = [ix, iy]
  }
  return end
}

function draw_plan() {
  drawMap()
  // draw opponent
  stroke("black")
  strokeWeight(1)
  let opp = (turn == "A") ? "B" : "A"
  let opponent = players[opp]
  fill(team_color[opp])
  for (const agent of opponent.agents) {
    drawAgent(agent.at)
  }
  // draw cone of possible locations
  push()
  clip_to_board()
  noFill()
  stroke(team_color[opp])
  strokeWeight(3)
  for (const agent of opponent.agents) {
    let xi, yi
    [xi, yi] = agent.at
    let d = plan_step + 0.5
    beginShape()
    vertex(pxX(xi - d), pxY(yi))
    vertex(pxX(xi), pxY(yi - d))
    vertex(pxX(xi + d), pxY(yi))
    vertex(pxX(xi), pxY(yi + d))
    endShape(CLOSE)
  }
  pop()
  // figure out current locations of agents
  let curr_locs = current_plan_locs()
  // draw action traces up to this planning step
  for (let ai = 0; ai < n_agents; ai++) {
    stroke((ai == plan_agent) ? "yellow" : "black")
    let agent = players[turn].agents[ai]
    let loc = agent.at
    fill(team_color[turn])
    drawAgent(loc)
    for (let j = 0; j < plan_step; j++) {
      let act = agent.actions[j]
      if (!act) break
      if (act.action == ACT_MOVE) {
        loc = act.target
        fill(team_color[turn])
        drawAgent(loc)
      }
      if (act.action == ACT_SCAN) {
        let sight_to = line_of_sight(loc, act.target)
        drawScan(loc, sight_to)
      }
      if (act.action == ACT_BOMB) {
        noFill()
        drawBombAction(act.target)
      }
    }
  }
  strokeWeight(3)
  for (let ai = 0; ai < n_agents; ai++) {
    stroke((ai == plan_agent) ? "yellow" : "black")
    drawAgent(curr_locs[ai])
  }
  // status of selected agent
  let curr_loc = curr_locs[plan_agent]
  let xi = curr_loc[0]
  let yi = curr_loc[1]
  let agent = players[turn].agents[plan_agent]
  let acts_left = n_actions - plan_step
  let targ = xy_to_grid(mouseX, mouseY)
  let on_agent = false
  for (let ai = 0; ai < n_agents; ai++) {
    if (targ && (targ.toString() == curr_locs[ai].toString())) {
      on_agent = true
    }
  }
  // preview action
  let highlight = color("yellow")
  highlight.setAlpha(50)
  if (targ && !on_agent && (acts_left > 0)) {
    if (plan_mode == PMODE_MOVE) {
      let path = shortest_path(plan_graph, curr_loc, targ)
      if (path) {
        fill(highlight)
        noStroke()
        for (let i = 0; i < min(path.length, acts_left); i++) {
          drawAgent(path[i])
        }
      }
    }
    if (plan_mode == PMODE_SCAN) {
      let sight_to = line_of_sight(curr_loc, targ)
      if (sight_to) {
        stroke(color("yellow"))
        strokeWeight(5)
        drawScan(curr_loc, sight_to)
      }
    }
    if (plan_mode == PMODE_BOMB) {
      // draw valid range on board
      push()
      clip_to_board()
      stroke("white")
      noFill()
      ellipse(pxX(xi), pxY(yi),
        2 * scale * (bomb_range + 0.5), 2 * scale * (bomb_range + 0.5))
      pop()
      // draw bomb blast radius
      fill(highlight)
      noStroke()
      // within range
      if (dist(targ[0], targ[1], xi, yi) <= bomb_range) {
        if (the_map[targ[0]][targ[1]] == "wall") {
          text("🚫", mouseX, mouseY)
        } else {
          drawBombAction(targ)
        }
      } else {
        text("OUT OF RANGE", mouseX, mouseY)
      }
    }
  }
  // draw UI
  draw_timeline(agent)
  draw_plan_controls()
  // draw status messages
  let curr_done = false
  let all_done = true
  for (let ai = 0; ai < n_agents; ai++) {
    let idone = players[turn].agents[ai].actions[n_actions - 1]
    if (ai == plan_agent) curr_done = idone
    all_done = all_done && idone
  }
  let y = height - pad.b / 2
  textAlign(CENTER, CENTER)
  textSize(16)
  fill("yellow")
  noStroke()
  let msg = ""
  if (all_done) {
    msg = "all agents fully programmed. ✅ click here to end turn."
  } else if (curr_done) {
    msg = "this agent fully programmed. (others remaining)"
  } else {
    msg = "choose actions."
  }
  text(msg, width / 2, y)
}

function draw_timeline(agent) {
  let time_dx = board_width / (n_actions + 1)
  noStroke()
  textAlign(CENTER, CENTER)
  textSize(25)
  for (let i = 0; i <= n_actions; i++) {
    if (i == plan_step) {
      fill("yellow")
    } else {
      fill(color(0, 0, 75))
    }
    let x = pad.l + i * time_dx
    rect(x, pad.t / 4, time_dx - 2, pad.t / 2)
    if (i > 0) {
      let act = agent.actions[i - 1]
      if (act) {
        text(act.action, x + 0.5 * time_dx, pad.t / 2)
      }
    }
  }
  fill("white")
  strokeWeight(1)
  textSize(10)
  textAlign(CENTER, BASELINE)
  text("← (use arrow keys) →", pad.l + board_width / 2, pad.t / 4 - 2)
  textAlign(LEFT)
  text("start", pad.l, pad.t / 4 - 2)
  text("first action", pad.l + time_dx, pad.t / 4 - 2)
  textAlign(RIGHT)
  text("last action", width - pad.r, pad.t / 4 - 2)
}

let plan_buttons = [{
  mode: PMODE_MOVE,
  label: ACT_MOVE + " move"
},
{
  mode: PMODE_SCAN,
  label: ACT_SCAN + " scan"
},
{
  mode: PMODE_BOMB,
  label: ACT_BOMB + " bomb"
}]

function draw_plan_controls() {
  // set up buttons
  for (let i = 0; i < plan_buttons.length; i++) {
    b = plan_buttons[i]
    b.width = pad.l - 16
    b.height = 30
    b.y = pad.t + i * b.height * 2
    b.x = 8
  }
  textAlign(CENTER, CENTER)
  textSize(16)
  for (const b of plan_buttons) {
    if (b.mode == plan_mode) {
      fill("yellow")
    } else {
      fill(color(0, 0, 75))
    }
    rect(b.x, b.y, b.width, b.height)
    fill("black")
    text(b.label, b.x + b.width / 2, b.y + b.height / 2)
  }
  // title
  noStroke()
  textAlign(LEFT, BASELINE)
  textSize(16)
  fill("white")
  text("Player " + turn + "\n→ agent " + (plan_agent + 1), 5, 20)
}

function mouseClicked_plan() {
  // which part of the UI was clicked
  if (mouseX < pad.l) {
    // left sidebar
    for (const b of plan_buttons) {
      if ((b.x < mouseX) && (mouseX < b.x + b.width) &&
        (b.y < mouseY) && (mouseY < b.y + b.height)) {
        plan_mode = b.mode
      }
    }
  } else if (mouseX > width - pad.r) {
    // right sidebar
  } else if (mouseY < pad.t) {
    // top panel
    let time_dx = board_width / (n_actions + 1)
    let step = floor((mouseX - pad.l) / time_dx)
    if ((0 <= step) && (step <= n_actions)) {
      plan_step = step
      // constrain to programmed steps
      let agent = players[turn].agents[plan_agent]
      while ((plan_step > 0) && !agent.actions[plan_step - 1]) {
        plan_step -= 1
      }
    }
  } else if (mouseY > height - pad.t) {
    // bottom panel
    let all_done = true
    for (let ai = 0; ai < n_agents; ai++) {
      let idone = players[turn].agents[ai].actions[n_actions - 1]
      all_done = all_done && idone
    }
    if (all_done) {
      if (turn == "A") {
        turn = "B"
        mode = MODE_WAIT_PLAN
      } else {
        turn = "A"
        mode = MODE_WAIT_GO
      }
    }
  } else {
    // board
    let targ = xy_to_grid(mouseX, mouseY)
    // if clicked on an agent, switch to it
    let curr_locs = current_plan_locs()
    for (let ai = 0; ai < n_agents; ai++) {
      if (targ.toString() == curr_locs[ai].toString()) {
        plan_agent = ai
        actions = players[turn].agents[ai].actions
        while ((plan_step > 0) && !actions[plan_step - 1]) {
          plan_step -= 1
        }
        return
      }
    }
    if (targ && (plan_step < n_actions)) {
      plan_action(targ)
    }
  }
}

function plan_action(targ) {
  let curr_locs = current_plan_locs()
  let curr_loc = curr_locs[plan_agent]
  let agent = players[turn].agents[plan_agent]
  let acts_left = n_actions - plan_step

  if (plan_mode == PMODE_MOVE) {
    let path = shortest_path(plan_graph, curr_loc, targ)
    if (!path) return
    for (let i = 0; i < acts_left; i++) {
      let act = null
      if (path[i]) {
        act = { action: ACT_MOVE, target: path[i] }
      }
      agent.actions[plan_step + i] = act
    }
    plan_step = min(n_actions, plan_step + path.length)
  }
  if (plan_mode == PMODE_SCAN) {
    let sight_to = line_of_sight(curr_loc, targ)
    if (!sight_to) return
    for (let i = 0; i < acts_left; i++) {
      let act = { action: ACT_SCAN, target: sight_to }
      agent.actions[plan_step + i] = act
    }
    plan_step = min(n_actions, plan_step + 1)
  }
  if (plan_mode == PMODE_BOMB) {
    let xi = curr_loc[0]
    let yi = curr_loc[1]
    if (dist(targ[0], targ[1], xi, yi) <= bomb_range) {
      if (the_map[targ[0]][targ[1]] != "wall") {
        let act = { action: ACT_BOMB, target: targ }
        agent.actions[plan_step] = act
        plan_step = min(n_actions, plan_step + 1)
      }
    }
  }
}

function keyPressed_plan() {
  if (key == "ArrowLeft") {
    plan_step = max(0, plan_step - 1)
  }
  if (key == "ArrowRight") {
    if (plan_step == n_actions) return
    let agent = players[turn].agents[plan_agent]
    if (agent.actions[plan_step]) {
      plan_step += 1
    }
  }
}

// WAIT_GO

function draw_wait_go() {
  drawMap()
  // draw players
  stroke("black")
  for (const team of ["A", "B"]) {
    fill(team_color[team])
    for (const agent of players[team].agents) {
      drawAgent(agent.at)
    }
  }
  // draw overlay message
  background(color(0, 0, 0, 50))
  textAlign(CENTER, CENTER)
  fill("white")
  textSize(30)
  text("All teams ready.", width / 2, height / 2)
  text("(click)", width / 2, height / 2 + 50)
}

function mouseClicked_wait_go() {
  mode = MODE_GO
}
