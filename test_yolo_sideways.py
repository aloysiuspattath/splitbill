import os
import json
from ultralytics import YOLO

model = YOLO('runs/detect/train-3/weights/best.pt')
res = model('C:\\Users\\aloys\\.gemini\\antigravity\\brain\\8090a751-d2ea-47d0-8bdd-b820262383dd\\.user_uploaded\\media_1790258191004.jpg', verbose=False)[0]

if len(res.boxes) > 0:
    box = res.boxes[0].xyxy[0].tolist() # x1, y1, x2, y2
    print(f"YOLO Box: {box}")
    print(f"Width: {box[2] - box[0]}, Height: {box[3] - box[1]}")
else:
    print("No YOLO box detected.")
