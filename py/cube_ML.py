from RubiksCube import *
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

cube = RubiksCube()

def cubeLinearRegression():
    data = np.load("outputs/cubeBFS.npz")

    corner_position = data["corner_position"]
    corner_orientation = data["corner_orientation"]
    edge_position = data["edge_position"]
    edge_orientation = data["edge_orientation"]
    depth = data["depth"]

    X = np.concatenate([
        corner_position,
        corner_orientation,
        edge_position,
        edge_orientation
    ], axis=1)
    y = depth

    print(X.shape)
    print(y.shape)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    linear_model = LinearRegression()
    linear_model.fit(X_train, y_train)

    y_pred = linear_model.predict(X_test)

    print("Linear Regression")
    print("MAE:", mean_absolute_error(y_test, y_pred))
    print("RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))
    print("R²:", r2_score(y_test, y_pred))
cubeLinearRegression()