import numpy as np

class RubiksCube:
    """
    SOURCES:
        https://kociemba.org/cube.htm - Logic
        https://kociemba.org/math/CubeDefs.htm - Move definitions
    """

    def __init__(self):
        """Sets current state to that of a solved cube"""
        self.corner_position = np.arange(8, dtype=np.int8) # arr length 8, val 0-7
        self.corner_orientation = np.zeros(8, dtype=np.int8) # arr length 8, val 0s
        self.edge_position = np.arange(12, dtype=np.int8) # arr length 12, val 0-11
        self.edge_orientation = np.zeros(12, dtype=np.int8) # arr length 12, val 0s

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

        return cube