
const MULTI_HOTSEAT = 1
const MULTI_REMOTE = 2
let multiplayer = null
let nick = "Anon"
let peer = null
let is_host = true
let peer_conn = null

const nx = 20
const ny = 20
const pad = { l: 100, r: 20, t: 70, b: 50 }
const n_actions = 10
const n_agents = 2
const starting_bombs = 2
const starting_health = 4
const bomb_damage = 3
const bomb_range = 5
const bomb_radius = 1
const ground_color = "forestgreen"
const wall_color = "darkslategrey"
const team_color = {
  A: "cornflowerblue",
  B: "mediumorchid"
}
const MODE_CONFIG = -1
const MODE_WAIT_PLAN = 1
const MODE_PLAN = 2
const MODE_WAIT_GO = 3
const MODE_GO = 4
const MODE_END = 5

const ACT_MOVE = 0
const ACT_SCAN = 1
const ACT_BOMB = 2
const ACT_PREBOMB = 3
const ACT_DIE = 9
const act_symbols = ["👣", "🔊", "💣", "🔜"]
// actions are like {action: ACT_MOVE, target: [3,10]}

let mode = MODE_CONFIG
let turn = "A"
let the_map
let players = {}
let next_players = {}
let scale, board_width, board_height
let sounds = {}

function preload() {
  soundFormats('mp3', 'ogg')
  sounds.hit = loadSound("assets/476740_shot.mp3")
  sounds.bomb = loadSound("assets/110113_bomb.mp3")
  sounds.scan = loadSound("assets/137781_scan.mp3")
  sounds.launch = loadSound("assets/162361_launch.mp3")
  sounds.death = loadSound("assets/144469_death.mp3")
  sounds.hit.setVolume(1.5)
  sounds.bomb.setVolume(0.7)
}

function setup() {
  createCanvas(600, 600);
  frameRate(30)
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
  switchMode(MODE_CONFIG)
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
    health: starting_health,
    bombs: starting_bombs,
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

function drawPreBombAction(at) {
  let xi, yi
  [xi, yi] = at
  push()
  clip_to_board()
  line(pxX(xi) - scale, pxY(yi) - scale,
    pxX(xi) + scale, pxY(yi) + scale)
  line(pxX(xi) - scale, pxY(yi) + scale,
    pxX(xi) + scale, pxY(yi) - scale)
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

function switchMode(new_mode) {
  mode = new_mode
  if (mode == MODE_CONFIG) {
    init_config()
  } else if (mode == MODE_PLAN) {
    init_plan()
  } else if (mode == MODE_GO) {
    init_go()
  }
}

function draw() {
  if (mode == MODE_CONFIG) {
    draw_config()
  } else if (mode == MODE_WAIT_PLAN) {
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
  if (mode == MODE_CONFIG) {
    mouseClicked_config()
  } else if (mode == MODE_WAIT_PLAN) {
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
  } else if (mode == MODE_GO) {
    keyPressed_go()
  }
}

// NETWORK COMMS

let chat_box
let chat_log

function addToChatLog(content) {
  chat_log.html(content + chat_log.html())
}

function initChat() {
  chat_box = createInput()
  chat_box.id("chat-box")
  chat_log = createDiv()
  chat_log.id("chat-log")
  document.getElementById("chat-box").addEventListener('change',
    (event) => {
      let txt = chat_box.value()
      if (txt.trim().length > 0) {
        txt = nick + ": " + txt
        let msg = {
          type: "chat",
          text: txt
        }
        addToChatLog('<p class="mychat">' + msg.text + '</p>')
        peer_conn.send(msg)
        chat_box.value("")
      }
    })
}

function recvMsg(msg) {
  if (msg.type == "init") {
    the_map = msg.the_map
    turn = msg.turn
    switchMode(msg.mode)
    removeElements()
    initChat()
  }
  if (msg.type == "chat") {
    addToChatLog('<p>' + msg.text + '</p>')
  }
  if (msg.type == "turndone") {
    next_players[msg.player_key] = msg.player
    checkAllDone()
  }
}

function checkAllDone() {
  let alldone = true
  for (const k of Object.keys(players)) {
    if (!next_players[k]) alldone = false
  }
  if (alldone) {
    if (is_host) {
      // broadcast all players moves to all clients
      for (const k of Object.keys(players)) {
        let msg = {
          type: "turndone",
          player_key: k,
          player: next_players[k]
        }
        peer_conn.send(msg)
      }
    }
    players = next_players
    next_players = {}
    console.log(players)
    switchMode(MODE_GO)
  }
}

function connClosed() {
  addToChatLog('<p class="syschat">' + "Connection closed." + '</p>')
}

// CONFIG

let config_buttons =
  [{
    label: "hotseat",
    multi: MULTI_HOTSEAT,
    host: true,
    desc: "take turns using one screen"
  },
  {
    label: "remote (host)",
    multi: MULTI_REMOTE,
    host: true,
    desc: "connect to another computer (start a game)"
  },
  {
    label: "remote (client)",
    multi: MULTI_REMOTE,
    host: false,
    desc: "connect to another computer (join a game)"
  }]

function init_config() {
  // set up buttons
  let nb = config_buttons.length
  for (let i = 0; i < config_buttons.length; i++) {
    b = config_buttons[i]
    b.width = 140
    b.height = 30
    b.y = height / 2 + i * 2 * b.height
    b.x = 60
  }
}

function draw_config() {
  background(wall_color);
  textAlign(CENTER, CENTER)
  fill("white")
  textSize(40)
  text("RoboSport", width / 2, height * 0.15)
  textSize(16)
  text("a minimal clone", width / 2, height * 0.15 + 50)
  textAlign(CENTER, CENTER)
  textSize(16)
  if (!multiplayer) {
    for (const b of config_buttons) {
      fill(color(0, 0, 75))
      rect(b.x, b.y, b.width, b.height)
      fill("black")
      textAlign(CENTER, CENTER)
      text(b.label, b.x + b.width / 2, b.y + b.height / 2)
      fill("white")
      textAlign(LEFT, CENTER)
      text(b.desc, b.x + b.width + 30, b.y + b.height / 2)
    }
  }
}

function setup_remote_multi() {
  let table = createDiv()
  table.class("setup-remote")
  table.position(100, height * 0.4)
  table.child(createDiv("Player name:"))
  let nick_input = createInput('')
  table.child(nick_input)
  table.child(createDiv())
  let connbutt = createButton("Connect to PeerServer")
  connbutt.id("peerserver-conn")
  table.child(createDiv())
  table.child(connbutt)
  connbutt.mousePressed(function () {
    connbutt.hide()
    peer = new Peer()
    peer.on('open', function (id) {
      my_peer_id = id
      if (is_host) {
        table.child(createDiv("Host peer id: "))
        let id_div = createDiv(id)
        id_div.id("peerid")
        table.child(id_div)
        let waitingdiv = createDiv("Waiting for client(s) to connect...")
        waitingdiv.class("waiting")
        table.child(waitingdiv)
        let clientsdiv = createDiv()
        clientsdiv.id("peer-clients")
        table.child(clientsdiv)
        let good_to_go = false
        peer.on('connection', function (conn) {
          peer_conn = conn
          conn.on('open', function () {
            clientsdiv.child(createDiv(conn.label))
            conn.on('data', recvMsg)
            conn.on('close', connClosed)
            if (good_to_go) { return }
            good_to_go = true
            let gobutt = createButton("Begin game")
            table.child(createDiv())
            table.child(gobutt)
            gobutt.mousePressed(function () {
              nick = nick_input.value()
              nick_input.hide()
              turn = "A"
              switchMode(MODE_WAIT_PLAN)
              let msg = {
                type: "init",
                turn: "B",
                mode: mode,
                the_map: the_map
              }
              peer_conn.send(msg)
              removeElements()
              initChat()
            })
          })
        })
      } else {
        // client - connect to a given host id
        let host_id_input = createInput('')
        let joinbutt = createButton("Join game")
        table.child(createDiv("Host peer id:"))
        table.child(host_id_input)
        table.child(createDiv())
        table.child(joinbutt)
        joinbutt.mousePressed(function () {
          joinbutt.hide()
          remote_peer_id = host_id_input.value()
          nick = nick_input.value()
          conn = peer.connect(remote_peer_id, { label: nick })
          peer_conn = conn
          conn.on('open', function () {
            // we're good to go
            conn.on('data', recvMsg)
            conn.on('close', connClosed)
            nick = nick_input.value()
            nick_input.hide()
            table.child(createDiv())
            let waitingdiv = createDiv("<p>Hosted 🎉</p><p>Waiting for game to start...</p>")
            waitingdiv.class("waiting")
            table.child(waitingdiv)
          })
        })
      }
    })
  })
}

function mouseClicked_config() {
  if (!multiplayer) {
    for (const b of config_buttons) {
      if ((b.x < mouseX) && (mouseX < b.x + b.width) &&
        (b.y < mouseY) && (mouseY < b.y + b.height)) {
        multiplayer = b.multi
        is_host = b.host
        if (multiplayer == MULTI_HOTSEAT) {
          switchMode(MODE_WAIT_PLAN)
        } else {
          setup_remote_multi()
        }
      }
    }
  }
}

// WAIT_PLAN

function draw_wait_plan() {
  drawMap()
  // draw players
  stroke("black")
  for (const team of Object.keys(players)) {
    fill(team_color[team])
    for (const agent of players[team].agents) {
      if (agent.dead) continue
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
  switchMode(MODE_PLAN)
}

// PLAN

const PMODE_MOVE = 1
const PMODE_SCAN = 2
const PMODE_BOMB = 3

let plan_buttons = [{
  mode: PMODE_MOVE,
  label: act_symbols[ACT_MOVE] + " move (m)"
},
{
  mode: PMODE_SCAN,
  label: act_symbols[ACT_SCAN] + " scan (s)"
},
{
  mode: PMODE_BOMB,
  label: act_symbols[ACT_BOMB] + " bomb"
}]

let plan_step
let plan_agent
let plan_mode
let plan_graph

function init_plan() {
  plan_step = 0
  plan_agent = 0
  plan_mode = PMODE_MOVE
  generate_plan_graph()
  // set up buttons
  for (let i = 0; i < plan_buttons.length; i++) {
    b = plan_buttons[i]
    b.width = pad.l - 16
    b.height = 30
    b.y = pad.t + 50 + i * b.height * 2
    b.x = 8
  }
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
    if (agent.dead) continue
    drawAgent(agent.at)
  }
  // draw cone of possible locations
  push()
  clip_to_board()
  noFill()
  stroke(team_color[opp])
  strokeWeight(3)
  for (const agent of opponent.agents) {
    if (agent.dead) continue
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
    if (agent.dead) continue
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
      if (act.action == ACT_PREBOMB) {
        drawPreBombAction(act.target)
      }
    }
  }
  strokeWeight(3)
  for (let ai = 0; ai < n_agents; ai++) {
    let agent = players[turn].agents[ai]
    if (agent.dead) continue
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
    let agent = players[turn].agents[ai]
    if (agent.dead) continue
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
    // bomb actions take up 2 action steps
    let can_bomb = (plan_step < n_actions - 1)
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
      if (!can_bomb) {
        text("Need 2 free actions for a 💣", mouseX, mouseY)
      } else if (dist(targ[0], targ[1], xi, yi) <= bomb_range) {
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
    let agent = players[turn].agents[ai]
    if (agent.dead) continue
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
        text(act_symbols[act.action], x + 0.5 * time_dx, pad.t / 2)
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

function n_bombs_left() {
  let agent = players[turn].agents[plan_agent]
  let n = agent.bombs
  for (let i = 0; i < plan_step; i++) {
    if (agent.actions[i].action == ACT_BOMB) n--
  }
  return n
}

function draw_plan_controls() {
  textAlign(CENTER, CENTER)
  textSize(12)
  for (const b of plan_buttons) {
    if (b.mode == plan_mode) {
      fill("yellow")
    } else {
      fill(color(0, 0, 75))
    }
    rect(b.x, b.y, b.width, b.height)
    fill("black")
    label = b.label
    if (b.mode == PMODE_BOMB) {
      label = label + ":" + n_bombs_left()
    }
    text(label, b.x + b.width / 2, b.y + b.height / 2)
  }
  // note
  fill("white")
  noStroke()
  textAlign(LEFT, BASELINE)
  textSize(12)
  text("Switch agent:\n Tab / click on it", 5, height - pad.b - 50)
  // title
  let agent = players[turn].agents[plan_agent]
  textSize(16)
  text("Player " + turn + "\n→ agent " + (plan_agent + 1) + "\n (health " + agent.health + ")", 5, 20)
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
  } else if (mouseY > height - pad.b) {
    // bottom panel
    let all_done = true
    for (let ai = 0; ai < n_agents; ai++) {
      let idone = players[turn].agents[ai].actions[n_actions - 1]
      all_done = all_done && idone
    }
    if (all_done) {
      turn_done_clicked()
    }
  } else {
    // board
    let targ = xy_to_grid(mouseX, mouseY)
    // if clicked on an agent, switch to it
    let curr_locs = current_plan_locs()
    let on_agent = false
    for (let ai = 0; ai < n_agents; ai++) {
      if (targ.toString() == curr_locs[ai].toString()) {
        on_agent = true
        switchPlanAgent(ai)
      }
    }
    if (targ && !on_agent && (plan_step < n_actions)) {
      plan_action(targ)
    }
  }
}

function switchPlanAgent(ai) {
  plan_agent = ai
  actions = players[turn].agents[ai].actions
  while ((plan_step > 0) && !actions[plan_step - 1]) {
    plan_step -= 1
  }
}

function turn_done_clicked() {
  if (multiplayer == MULTI_HOTSEAT) {
    if (turn == "A") {
      turn = "B"
      switchMode(MODE_WAIT_PLAN)
    } else {
      turn = "A"
      switchMode(MODE_WAIT_GO)
    }
  } else {
    // REMOTE
    switchMode(MODE_WAIT_GO)
    if (is_host) {
      next_players[turn] = players[turn]
      checkAllDone()
    } else {
      let msg = {
        type: "turndone",
        player_key: turn,
        player: players[turn]
      }
      peer_conn.send(msg)
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
  // bomb actions need 2 action steps
  let can_bomb = (plan_step < n_actions - 1)
  if ((plan_mode == PMODE_BOMB) && can_bomb) {
    let xi = curr_loc[0]
    let yi = curr_loc[1]
    if (dist(targ[0], targ[1], xi, yi) <= bomb_range) {
      if (the_map[targ[0]][targ[1]] != "wall") {
        if (n_bombs_left() > 0) {
          let act1 = { action: ACT_PREBOMB, target: targ }
          let act2 = { action: ACT_BOMB, target: targ }
          agent.actions[plan_step] = act1
          agent.actions[plan_step + 1] = act2
          for (let i = plan_step + 2; i < n_actions; i++) {
            agent.actions[i] = null
          }
          plan_step = min(n_actions, plan_step + 2)
        }
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
  if (key == "m") {
    plan_mode = PMODE_MOVE
  }
  if (key == "s") {
    plan_mode = PMODE_SCAN
  }
  if (key == "b") {
    plan_mode = PMODE_BOMB
  }
  if (key == "Tab") {
    switchPlanAgent((plan_agent + 1) % n_agents)
  }
}

// WAIT_GO

function draw_wait_go() {
  drawMap()
  // draw players
  stroke("black")
  for (const team of Object.keys(players)) {
    fill(team_color[team])
    for (const agent of players[team].agents) {
      if (agent.dead) continue
      drawAgent(agent.at)
    }
  }
  // draw overlay message
  let txt = ""
  if (multiplayer == MULTI_HOTSEAT) {
    txt = "All teams ready.\n(click)"
  } else {
    txt = "Waiting for other teams..."
  }
  background(color(0, 0, 0, 50))
  textAlign(CENTER, CENTER)
  fill("white")
  textSize(30)
  text(txt, width / 2, height / 2)
}

function mouseClicked_wait_go() {
  if (multiplayer == MULTI_HOTSEAT) {
    switchMode(MODE_GO)
  }
}

// GO

let go_step
let go_paused
let go_up_to = n_actions + 0.9
let go_acts_per_sec = 1.8

function init_go() {
  go_step = 0.0
  go_paused = true
  resolve_actions(players)
  console.log("post-resolve")
  console.log(players)
}

function resolve_actions(players) {
  // go through actions and tag each with hit/health/dead
  for (let t = 0; t < n_actions; t++) {
    // first, everyone moves.
    for (const team of Object.keys(players)) {
      for (let ai = 0; ai < n_agents; ai++) {
        let agent = players[team].agents[ai]
        // agent object stands in for the first state (action)
        let prev = (t > 0) ? agent.actions[t - 1] : agent
        let act = agent.actions[t]
        act.at = prev.at
        if ((act.action == ACT_MOVE) && !prev.dead) {
          act.at = act.target
        }
      }
    }
    // then, attacks happen
    for (const team of Object.keys(players)) {
      for (let ai = 0; ai < n_agents; ai++) {
        let agent = players[team].agents[ai]
        // agent object stands in for the first state (action)
        let prev = (t > 0) ? agent.actions[t - 1] : agent
        let act = agent.actions[t]
        // current health might have been set by another agent
        if (typeof act.health == 'undefined') {
          act.health = prev.health
        }
        act.dead = act.dead || prev.dead
        act.bombs = prev.bombs
        if ((act.action == ACT_BOMB) && !prev.dead) {
          act.bombs = prev.bombs - 1
          // find who got hit
          let tx = act.target[0]
          let ty = act.target[1]
          for (const hit_team of Object.keys(players)) {
            for (let hi = 0; hi < n_agents; hi++) {
              let hit_agent = players[hit_team].agents[hi]
              let hact = hit_agent.actions[t]
              let hprev = (t > 0) ? hit_agent.actions[t - 1] : hit_agent
              hact.dead = hact.dead || hprev.dead
              if (hact.dead) continue
              let x = hact.at[0]
              let y = hact.at[1]
              if (dist(x, y, tx, ty) <= bomb_radius + 0.5) {
                hact.hit = true
                if (typeof hact.health == 'undefined') {
                  hact.health = hprev.health
                }
                hact.health -= bomb_damage
                if (hact.health <= 0) {
                  if (hit_team != team) {
                    act.haha = true
                  }
                  hact.health = 0
                  hact.dead = true
                  // might create a new action past n_actions
                  hit_agent.actions[t + 1] = { action: ACT_DIE, at: hact.at, dead: true, health: 0 }
                }
              }
            }
          }
        }
        if ((act.action == ACT_SCAN) && !prev.dead) {
          // find who got hit
          let x = act.at[0]
          let y = act.at[1]
          let tx = act.target[0]
          let ty = act.target[1]
          let dx = 0
          let dy = 0
          if (x < tx) { dx = 1 } else if (x > tx) { dx = -1 }
          if (y < ty) { dy = 1 } else if (y > ty) { dy = -1 }
          let hit_at = null
          while (!((x == tx) && (y == ty))) {
            x += dx
            y += dy
            for (const hit_team of Object.keys(players)) {
              if (hit_team == team) continue
              for (let hi = 0; hi < n_agents; hi++) {
                let hit_agent = players[hit_team].agents[hi]
                let hact = hit_agent.actions[t]
                let hprev = (t > 0) ? hit_agent.actions[t - 1] : hit_agent
                hact.dead = hact.dead || hprev.dead
                if (hact.dead) continue
                if (hact.at.toString() == [x, y].toString()) {
                  hact.hit = true
                  if (typeof hact.health == 'undefined') {
                    hact.health = hprev.health
                  }
                  hact.health -= 1
                  if (hact.health <= 0) {
                    act.haha = true
                    hact.health = 0
                    hact.dead = true
                    // might create a new action past n_actions
                    hit_agent.actions[t + 1] = { action: ACT_DIE, at: hact.at, dead: true, health: 0 }
                  }
                  hit_at = [x, y]
                }
                if (hit_at) break
              }
              if (hit_at) break
            }
            if (hit_at) break
          }
          act.scan_hit_at = hit_at
        }
      }
    }
  }
}

function drawHit(at, z) {
  noStroke()
  let col = lerpColor(color("white"), color("black"), z)
  fill(col)
  let fullsize = scale
  let size = lerp(fullsize * 1.0, fullsize * 0.0, z)
  ellipse(pxX(at[0]), pxY(at[1]), size, size)
  textSize(size)
  text("💥", pxX(at[0]), pxY(at[1]))
}

function drawBombBlast(at, z) {
  noStroke()
  let col = lerpColor(color("yellow"), color("red"), z)
  fill(col)
  let fullsize = (1 + bomb_radius * 2) * scale
  let size = lerp(fullsize * 0.7, fullsize * 1.2, z)
  ellipse(pxX(at[0]), pxY(at[1]), size, size)
}

function drawBombLaunch(at, z) {
  fill("black")
  noStroke()
  let fac = (2 * z - 1)
  fac = 1 - 0.7 * fac * fac
  textSize(scale * fac)
  textAlign(CENTER, CENTER)
  text("💣", pxX(at[0]), pxY(at[1]))
}

function drawDeath(at, z) {
  fill("black")
  noStroke()
  textSize(scale * (1 + z))
  text("💀", pxX(at[0]), pxY(at[1]))
}

function drawHaHa(at, z) {
  let c = color("white")
  c.setAlpha((1-z*z)*100)
  fill(c)
  stroke("black")
  noStroke()
  textSize(scale * 0.5)
  textAlign(CENTER, CENTER)
  text("Ha", pxX(at[0]), pxY(at[1] - z))
  text("Ha", pxX(at[0] + 0.5), pxY(at[1] + 0.5 - z))
}

function draw_go() {
  drawMap()
  let t = floor(go_step)
  let tn = min(floor(go_step) + 1, n_actions)
  let z = go_step - t
  // first, draw agents
  let where = { prebomb: [], bomb: [], hit: [], scan: [], die: [], haha: [] }
  for (const team of Object.keys(players)) {
    for (let ai = 0; ai < n_agents; ai++) {
      let agent = players[team].agents[ai]
      let act = agent
      if (t > 0) act = agent.actions[t - 1]
      let nact = agent.actions[tn - 1]
      if (!nact) nact = act
      if (act.haha == true) {
        where.haha.push(act.at)
      }
      if (act.action == ACT_DIE) {
        where.die.push(act.at)
      }
      if (act.dead) continue
      let x = lerp(act.at[0], nact.at[0], z)
      let y = lerp(act.at[1], nact.at[1], z)
      fill(team_color[team])
      drawAgent([x, y])
      if (act.action == ACT_SCAN) {
        let scan_to = act.scan_hit_at || act.target
        push()
        stroke(color(0, 100, 100, 25))
        strokeWeight(scale / 2)
        drawScan([x, y], scan_to)
        pop()
        where.scan.push(act.at)
        if (act.scan_hit_at) {
          where.hit.push(scan_to)
        }
      }
      if (act.action == ACT_BOMB) {
        where.bomb.push(act.target)
      }
      if (act.action == ACT_PREBOMB) {
        let bx = act.target[0]
        let by = act.target[1]
        where.prebomb.push([lerp(x, bx, z), lerp(y, by, z)])
      }
    }
  }
  // then, draw actions
  for (const loc of where.hit) {
    drawHit(loc, z)
  }
  for (const loc of where.bomb) {
    drawBombBlast(loc, z)
  }
  for (const loc of where.prebomb) {
    drawBombLaunch(loc, z)
  }
  for (const loc of where.haha) {
    drawHaHa(loc, z)
  }
  for (const loc of where.die) {
    drawDeath(loc, z)
  }
  if (!go_paused) {
    let go_dt = go_acts_per_sec / frameRate()
    // if reached a new action step
    if (floor(go_step) != floor(go_step - go_dt)) {
      if (where.scan.length > 0) sounds.scan.play()
      if (where.hit.length > 0) sounds.hit.play()
      if (where.bomb.length > 0) sounds.bomb.play()
      if (where.prebomb.length > 0) sounds.launch.play()
      if (where.die.length > 0) sounds.death.play()
    }
    if (go_step == go_up_to) {
      go_paused = true
      sounds.scan.stop()
    }
    go_step = min(go_step + go_dt, go_up_to)
  }
  drawGoTimeline()
  let y = height - pad.b / 2
  textAlign(CENTER, CENTER)
  textSize(16)
  fill("yellow")
  noStroke()
  let msg = ""
  if (go_step >= go_up_to) {
    msg = "finished watching? ✅ click here for next turn."
  } else {
    msg = "space = play/pause. arrow keys = step."
  }
  text(msg, width / 2, y)
}

function drawGoTimeline() {
  stroke("white")
  strokeWeight(2)
  line(pad.l, pad.t / 2, width - pad.r, pad.t / 2)
  stroke("black")
  fill("white")
  textSize(16)
  strokeWeight(1)
  text(floor(go_step), map(go_step, 0, go_up_to, pad.l, width - pad.r), pad.t / 4)
  textSize(24)
  text("Turn " + 1, pad.l / 2, pad.t / 2)
}

function mouseClicked_go() {
  if (mouseY > height - pad.b) {
    if (go_step >= go_up_to) {
      go_done()
    } else {
      go_paused = !go_paused
    }
  }
}

function go_done() {
  for (const team of Object.keys(players)) {
    for (let ai = 0; ai < n_agents; ai++) {
      let agent = players[team].agents[ai]
      let a = agent.actions[n_actions - 1]
      agent.at = a.at
      agent.dead = a.dead
      agent.health = a.health
      agent.bombs = a.bombs
      agent.actions = []
    }
  }
  switchMode(MODE_WAIT_PLAN)
}

function keyPressed_go() {
  if (key == "ArrowLeft") {
    go_paused = true
    go_step = max(0, ceil(go_step) - 1)
  }
  if (key == "ArrowRight") {
    if (go_step == n_actions) return
    go_step = min(floor(go_step) + 1, n_actions)
  }
  if (key == " ") {
    go_paused = !go_paused
    if (go_paused) sounds.scan.stop()
  }
  if (key == "=") {
    go_acts_per_sec *= 1.2
  }
  if (key == "-") {
    go_acts_per_sec /= 1.2
  }
  return false
}
