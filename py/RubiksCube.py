import numpy as np
import pandas as pd
from collections import deque

class RubiksCube:
    """
    SOURCES:
        https://kociemba.org/cube.htm - Logic
        https://kociemba.org/math/CubeDefs.htm - Move definitions
    """
    """
    ORIENTATION
        Corners:    0: correctly oriented
                    1: twisted clockwise
                    2: twisted anticlockwise

        Edges:      0: correctly oriented
                    1: flipped

        Each cube has a reference sticker:
            U/D face sticker for cubies in the top/bottom row
            F/B face sticker for cubies in the middle row (edge pieces)
        The value shows which state the cubie is in. Corners have 3 possible states,
        while edge pieces have 2 possible states.

    MOVES
        Moves are always clockwise. A counterclockwise move is denoted with a ' (ex: R')
        and is is achieved by doing 3 clockwise moves sequentially. A 180 degree move is 
        denoted with a 2 (ex: R2) and is achieved by doing 2 clockwise moves sequentially. 

    """

    CORNERS = [
        "URF", "UFL", "ULB", "UBR",  # 0  1  2  3
        "DFR", "DLF", "DBL", "DRB",  # 4  5  6  7
    ]

    EDGES = [
        "UR", "UF", "UL", "UB",  # 0  1  2  3
        "DR", "DF", "DL", "DB",  # 4  5  6  7
        "FR", "FL", "BL", "BR",  # 8  9  10 11
    ]

    MOVES = {
        "R": { # Right face
            "corner_position": [ 4, 1, 2, 0, 7, 5, 6, 3 ], # 0>3 3>7 7>4 4>0
            "corner_orientation": [ 2, 0, 0, 1, 1, 0, 0, 2 ],
            "edge_position": [ 8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0 ], # 8>0 0>11 11>4 4>8
            "edge_orientation": [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] 
        }, 
        "L": { # Left face
            "corner_position": [0, 2, 6, 3, 4, 1, 5, 7],
            "corner_orientation": [0, 1, 2, 0, 0, 2, 1, 0],
            "edge_position": [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
            "edge_orientation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }, 
        "U": { # Top face
             "corner_position": [3, 0, 1, 2, 4, 5, 6, 7],
            "corner_orientation": [0, 0, 0, 0, 0, 0, 0, 0],
            "edge_position": [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
            "edge_orientation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }, 
        "D": { # Bottom face
            "corner_position": [0, 1, 2, 3, 5, 6, 7, 4],
            "corner_orientation": [0, 0, 0, 0, 0, 0, 0, 0],
            "edge_position": [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
            "edge_orientation": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }, 
        "F": { # Front face
           "corner_position": [1, 5, 2, 3, 0, 4, 6, 7],
            "corner_orientation": [1, 2, 0, 0, 2, 1, 0, 0],
            "edge_position": [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
            "edge_orientation": [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0]
        }, 
        "B": { # Back face
            "corner_position": [0, 1, 3, 7, 4, 5, 2, 6],
            "corner_orientation": [0, 0, 1, 2, 0, 0, 2, 1],
            "edge_position": [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
            "edge_orientation": [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]
        }, 
    }


    def __init__(self):
        """Sets current state to that of a solved cube"""
        self.reset()

    def reset(self):
        """Resets the cube to its initial (solved) state"""
        self.corner_position = np.arange(8, dtype=np.int8)
        self.corner_orientation = np.zeros(8, dtype=np.int8)
        self.edge_position = np.arange(12, dtype=np.int8)
        self.edge_orientation = np.zeros(12, dtype=np.int8)
        self.path = []

    def is_solved(self):
        """Compares current state to initial (solved) state"""
        return (
            np.array_equal( self.corner_position, np.arange(8) ) and
            np.array_equal( self.corner_orientation, np.zeros(8) ) and
            np.array_equal( self.edge_position, np.arange(12) ) and
            np.array_equal( self.edge_orientation, np.zeros(12) )
        )


    def __repr__(self):
        """Returns string representation of current cube state"""
        return (
            f"RubiksCube(\n"
            f"  corners: {self.corner_position}\n"
            f"  corner orientation: {self.corner_orientation}\n"
            f"  edges: {self.edge_position}\n"
            f"  edge orientation: {self.edge_orientation}\n"
            f")"
        )


    def copy(self):
        """Returns a new RubiksCube with the state of the current cube"""
        cube = RubiksCube()

        cube.corner_position = self.corner_position.copy()
        cube.corner_orientation = self.corner_orientation.copy()

        cube.edge_position = self.edge_position.copy()
        cube.edge_orientation = self.edge_orientation.copy()

        cube.path = self.path.copy()

        return cube


    def move(self, move):
        """
        Rotate face specified in 'move' in 90 degree clockwise turns

        Valid faces are "U", "D", "F", "B", "R", and "L"
        A face value followed by a "'" (ex: U') indicates a counterclockwise turn
        A face value followed by a "2" (ex: U2) indicates a 180 degree turn
        
        Counterclockwise turns are achieved with 3 sequential clockwise face moves
        180 degree turns are achieved with 2 sequential clockwise face moves
        """

        if move.endswith("2"):
            # 180 degree turn - apply clockwise move 2 times
            turns = 2
        elif move.endswith("'"):
            # counterclockwise turn - apply clockwise move 3 times
            turns = 3
        else:
            # single turn
            turns = 1

        # Update path
        self.path.append(move)
        
        # apply clockwise turn(s)
        face = move[0]
        for i in range(turns):
            cp = self.MOVES[face]["corner_position"]
            co = self.MOVES[face]["corner_orientation"]
            ep = self.MOVES[face]["edge_position"]
            eo = self.MOVES[face]["edge_orientation"]

            # update positions
            self.corner_position = self.corner_position[cp]
            self.edge_position = self.edge_position[ep]

            # update orientation - apply new position -> add orientation change -> trim
            self.corner_orientation = (self.corner_orientation[cp] + co) % 3
            self.edge_orientation = (self.edge_orientation[ep] + eo) % 2

    def stateKey(self):
        """
        Returns a unique key representing the current state of the cube
        """
        return (
            tuple(self.corner_position.tolist()),
            tuple(self.corner_orientation.tolist()),
            tuple(self.edge_position.tolist()),
            tuple(self.edge_orientation.tolist())
        )

# end of RubiksCube class



def randomScrambleSet(moves=1, count=1):
    """
    Returns 'count' sets of random moves of length 'moves'
    """
    # Base moves (90 deg clockwise turns)
    move_set = list(RubiksCube.MOVES.keys())
    # 180 deg and 90 deg counterclockwise turns
    move_set += [f"{m}'" for m in move_set] + [f"{m}2" for m in move_set]

    # Good for now; filter out redundant (same axis) moves later
    # return [np.random.choice(move_set, moves).tolist() for _ in range(count)]

    scrambles = []
    for _ in range(count):
        prevMove = None
        scramble = []

        for _ in range(moves):
            available_moves = move_set.copy()
            if prevMove is not None:    
                prevFace = prevMove[0]
                
                # Filter out moves on the same axis as the previous move
                if prevMove[0] in ["F", "B"]: # Front / Back
                    available_moves = [
                        m for m in available_moves
                        if m[0] not in ["F", "B"]
                    ]
                elif prevMove[0] in ["R", "L"]: # Right / Left
                    available_moves = [
                        m for m in available_moves
                        if m[0] not in ["R", "L"]
                    ]
                elif prevMove[0] in ["U", "D"]: # Top / Bottom
                    available_moves = [
                        m for m in available_moves
                        if m[0] not in ["U", "D"]
                    ]

            currMove = str(np.random.choice(available_moves))
            scramble.append(currMove)
            prevMove = currMove
        scrambles.append(scramble)
    return scrambles

def cubeBFS(depth=0):
    """
    Find every cube state for each depth up to 'depth'
        Note: Memory ineffecient; Not viable past depth 7 without optimization
    """

    # Base moves (90 deg clockwise turns)
    move_set = list(RubiksCube.MOVES.keys())
    # 180 deg and 90 deg counterclockwise turns
    move_set += [f"{m}'" for m in move_set] + [f"{m}2" for m in move_set]

    # Keep track of the number of found states at each depth
        # Each entry should be <= 18^depth
    depthCount = np.zeros(depth, dtype=np.int32)
    # Track prev depth, for debugging
    last_depth = 0

    # Solved rubiks cube state (only state in depth 0)
    solved = RubiksCube()
    queue = deque([(solved, 0)])
    # Track visited states at each depth. 
    # If identical state is later found at higher depth, can be ignored
    visited = { solved.stateKey() : 0 } 

    while queue:
        cube, curr_depth = queue.popleft()

        # print(f"Current depth: {curr_depth}")

        if(curr_depth >= depth):
            continue

        depthCount[curr_depth] += 1
        if curr_depth != last_depth:
            print(f"Current depth: {curr_depth} of {depth}")
            last_depth = curr_depth

        for move in move_set:
            # Duplicate current cube state
            curr_cube = cube.copy()
            # Apply current move
            curr_cube.move(move)

            key = curr_cube.stateKey()

            if key not in visited:
                visited[key] = curr_depth + 1
                queue.append((curr_cube, curr_depth + 1))

    # Convert "visited" dictionary to arrays
    keys = list(visited.keys())
    corner_position = np.array( [key[0] for key in keys], dtype=np.int8)
    corner_orientation = np.array([key[1] for key in keys],dtype=np.int8)
    edge_position = np.array([key[2] for key in keys],dtype=np.int8)
    edge_orientation = np.array([key[3] for key in keys],dtype=np.int8)
    depths = np.array(list(visited.values()), dtype=np.int8)

    # Save output to .npz file
    np.savez_compressed(
        "outputs/cubeBFS.npz",
        corner_position = corner_position,
        corner_orientation = corner_orientation,
        edge_position = edge_position,
        edge_orientation = edge_orientation,
        depth = depths
    )

    print(depthCount)
    return visited
