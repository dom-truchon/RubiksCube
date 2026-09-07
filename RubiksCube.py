import numpy as np

class RubiksCube:
    """
    SOURCES:
        https://kociemba.org/cube.htm - Logic
        https://kociemba.org/math/CubeDefs.htm - Move definitions
    """

    def __init__(self):
        # Solved cube
        self.corner_position = np.arange(8, dtype=np.int8) # arr length 8, val 0-7
        self.corner_orientation = np.zeros(8, dtype=np.int8) # arr length 8, val 0s
        self.edge_position = np.arange(12, dtype=np.int8) # arr length 12, val 0-11
        self.edge_orientation = np.zeros(12, dtype=np.int8) # arr length 12, val 0s

    
