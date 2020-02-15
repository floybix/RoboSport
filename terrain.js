var tilesheet
const tilesize = 32 // px
// tile index offsets to look up terrain type in sheet
var tile_origin = { wall: [15, 0], rough: [26, 14] }
//let tile_origin = { wall: [21, 32], rough: [27, 0] }
var filled_tiles = [[1, 3], [0, 5], [1, 5], [2, 5]]
// look up by terrain transitions along edges:
// W,N,E,S in order encoded as binary
// 
// (for each grass tile, X represents wall)
// X _ _
// X _ _ is 0b0001 (1)
// X _ _
//
// X X X
// _ _ _ is 0b0010 (2)
// _ _ _
//
// X X X
// X _ _ is 0b0011 (3)
// X _ _
//
// the value looked up is *an array of* coords [x,y] into the tilemap.
// for tiles to overlay wall onto grass.
// usually only one, but if multiple coords, all tiles are drawn.
var tile_edges =
  [[], [[2, 3]], [[1, 4]], [[1, 0]],
  [[0, 3]], [[0, 3], [2, 3]], [[2, 0]], [[2, 0], [2, 3]],
  [[1, 2]], [[1, 1]], [[1, 2], [1, 4]], [[1, 0], [1, 2]],
  [[2, 1]], [[2, 1], [2, 3]], [[2, 0], [1, 2]], [[2, 0], [1, 1]]]
// similarly, for corners in order NW,NE,SE,SW
//
// X _ _
// _ _ _ is 0b0001 (1)
// _ _ _
//
// _ _ X
// _ _ _ is 0b0010 (2)
// _ _ _
//
// X _ X
// _ _ _ is 0b0011 (3)
// _ _ _
var tile_corners =
  [[], [[2, 4]], [[0, 4]], [[2, 4], [0, 4]],
  [[0, 2]], [[0, 2], [2, 4]], [[0, 2], [0, 4]], [[0, 2], [2, 4], [0, 4]],
  [[2, 2]], [[2, 2], [2, 4]], [[2, 2], [0, 4]], [[2, 2], [2, 4], [0, 4]],
  [[2, 2], [0, 2]], [[2, 2], [2, 4], [0, 2]], [[2, 2], [0, 4], [0, 2]], [[2, 2], [2, 4], [0, 4], [0, 2]]]

// preload:
//tilesheet = loadImage("assets/bricks-v5.png")

function isTerrain(the_map, ix, iy, type) {
  let it = the_map[ix][iy]
  return it && (it.terrain == type)
}

// takes a 2d array m of objects
// object property "terrain" defines the map terrain.
// this function adds object property "tiles"
// which is an array of tiles (coordinates into the tilemap).
function calculateTiles(m) {
  let addvec = function ([x1, y1], [x2, y2]) {
    return [x1 + x2, y1 + y2]
  }
  let wall_origin = tile_origin["wall"]
  for (let ix = 0; ix < nx; ix++) {
    m[ix][0].tiles = [addvec(random(filled_tiles), wall_origin)]
    m[ix][ny - 1].tiles = [addvec(random(filled_tiles), wall_origin)]
  }
  for (let iy = 0; iy < ny; iy++) {
    m[0][iy].tiles = [addvec(random(filled_tiles), wall_origin)]
    m[nx - 1][iy].tiles = [addvec(random(filled_tiles), wall_origin)]
  }
  for (const type of ["rough", "wall"]) {
    let origin = tile_origin[type]
    for (let ix = 1; ix < nx - 1; ix++) {
      for (let iy = 1; iy < ny - 1; iy++) {
        let it = m[ix][iy]
        it = it || {}
        it.tiles = it.tiles || []
        if (it.terrain == type) {
          it.tiles.push(addvec(random(filled_tiles), origin))
          m[ix][iy] = it
          continue
        }
        let We = isTerrain(m, ix - 1, iy, type)
        let No = isTerrain(m, ix, iy - 1, type)
        let Ea = isTerrain(m, ix + 1, iy, type)
        let So = isTerrain(m, ix, iy + 1, type)
        let edge_seq = [We, No, Ea, So]
        let edge_index = 0
        for (let i = 0; i < 4; i++) {
          edge_index += edge_seq[i] * pow(2, i)
        }
        let Nw = isTerrain(m, ix - 1, iy - 1, type)
        let Ne = isTerrain(m, ix + 1, iy - 1, type)
        let Se = isTerrain(m, ix + 1, iy + 1, type)
        let Sw = isTerrain(m, ix - 1, iy + 1, type)
        let corn_seq = [Nw, Ne, Se, Sw]
        let corn_index = 0
        for (let i = 0; i < 4; i++) {
          corn_index += corn_seq[i] * pow(2, i)
        }
        let rel_tiles = tile_edges[edge_index].concat(tile_corners[corn_index])
        for (const rel_coord of rel_tiles) {
          it.tiles.push(addvec(rel_coord, origin))
        }
        m[ix][iy] = it
      }
    }
  }
}

function drawTerrain(m, pad, scale) {
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      let it = m[ix][iy]
      if (!it) continue
      for (const [tile_ix, tile_iy] of it.tiles) {
        let sx = tile_ix * tilesize
        let sy = tile_iy * tilesize
        image(tilesheet, pad.l + ix * scale, pad.t + iy * scale,
          scale, scale, sx, sy, tilesize, tilesize)
      }
    }
  }
}
