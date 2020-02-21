# RoboSport

A minimal clone of [the 1991 game](https://en.wikipedia.org/wiki/RoboSport). ([Here is a video](https://www.youtube.com/watch?v=gM2dTNLRUfU) of the original game).

Play it online at https://RoboSport.floybix.repl.co/

## Introduction

Each player controls a team of robots in a deathmatch. Robots can move around the arena, fire guns, and throw bombs. Play continues until all but one team has been eliminated.

The game is played in turns; each turn has 10 action steps which are programmed ahead of time. To begin, all players program their robots' actions, and when everyone is fully programmed, sit back and watch the action unfold. If more than one team survived then they continue to program the actions for the next turn, and so on.

Here's a video of a game including programming and running:
[![RoboSport demo game](http://img.youtube.com/vi/0iRxI6ENNnA/0.jpg)](https://youtu.be/0iRxI6ENNnA)

## Gameplay

The available actions are:
* __move__: Robots can move to adjacent squares, using up 1 action step per square. Robots don't block each other: they can move through the same space as other robots (of any team).
* __scan__: Scan in a direct line of sight to the north/south/east/west. Shoot any enemy robot in the scan line in that action step. If more than one enemy robot is there, only the closest will be shot. Your own team will be ignored, so don't worry about friendly fire.
* __bomb__: Throw a bomb. Each robot has a total of 2 bombs to use in the entire game. A bomb can be thrown to any square up to 5 squares away. On the _following_ action step, it will explode, causing damage to any robot that was directly hit _or in any directly adjacent square_. In other words, it takes 2 action steps: one to throw the bomb and the next for it to explode.

You have to program all 10 action steps. If you do not want to move any further, just sit and scan for the rest of the turn.

Health and damage:
* Each robot starts with 4 health.
* In planning mode, health is shown by how filled the circular icons are.
* Being shot takes 1 damage (reduces health by 1).
* Being in a bomb impact zone takes 3 damage (reduces health by 3). Note that this means a robot will not immediately die when it is hit by a bomb, unless it was already damaged.
* When a robot reaches 0 health it dies and is removed from the game.

### Time

When you're programming, you're moving around in time (between step 0 and step 10). So if you choose 10 actions for one robot, then switch to another robot that has not been programmed yet, you will jump back in time to step 0. It will look like your previously programmed actions have disappeared, but they just haven't "happened yet". As you program the second robot, the actions of the first robot will become visible. Use the arrow keys, or the timeline at the top of the screen, to step forward and backward in time to see how it works.

### Remote play

To play with others on other computers, one person chooses to be the host, and the others choose to be clients. The host connects to the PeerServer and gets their unique peer ID. They send this (by email or whatever) to the clients, who use it to join the game. When the host sees all the players connected (2 to 4 players will work), they trigger the game to begin.

For remote games, a chat is available below the main screen.

## License

Copyright © 2020 Felix Andrews

Distributed under the GNU GPL v3.

See attributes under the assets directory relating to the sounds and sprites.
