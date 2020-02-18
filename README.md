# RoboSport

A minimal clone of [the 1991 game](https://en.wikipedia.org/wiki/RoboSport). ([Here is a video](https://www.youtube.com/watch?v=gM2dTNLRUfU) of the original game).

Play it online at https://RoboSport.floybix.repl.co/


Each player controls a team of robots in a deathmatch. Robots can move around the arena, fire guns, and throw bombs. Play continues until all but one team has been eliminated.

The game is played in turns; each turn has 10 action steps which are programmed ahead of time. To begin, all players program their robots' actions, and when everyone is fully programmed, they sit back and watch the action unfold. If more than one team survived then they continue to program the actions for the next turn, and so on.

The available actions are:
* __move__: Robots can move to adjacent squares, using up 1 action step per square. Oh, and they can move through the same space as other robots (of any team).
* __scan__: Scan in a direct line of sight to the north/south/east/west. Shoot any enemy robot in the scan line in that action step. If more than one enemy robot is seen, only the closest will be shot. Your own team will be ignored, so don't worry about friendly fire.
* __bomb__: Throw a bomb. Each robot has a total of 2 bombs to use in the entire game. A bomb can be thrown to any square up to 5 squares away. On the *following* action step, it will explode, causing damage to any robot that was directly hit _or in any directly adjacent square_. In other words, it takes 2 action steps: one to throw the bomb and the next for it to explode.

You have to program all 10 action steps. If you do not want to move any further, just sit and scan for the rest of the turn.

Health and damage:
* Each robot starts with 4 health.
* In planning mode, health is shown by how filled the circular icons are.
* Being shot takes 1 damage (reduces health by 1).
* Being in a bomb impact zone takes 3 damage (reduces health by 3). Note that this means a robot will not immediately die when it is hit by a bomb, unless it was already damaged.
* When a robot reaches 0 health it dies and is removed from the game.


hotseat

remote multiplayer

setup

chat

planning screen

action modes

timeline of actions for the selected robot at the top of the screen.

play screen

timeline
