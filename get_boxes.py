import os
import json
from ultralytics import YOLO

model = YOLO('runs/detect/train-3/weights/best.pt')
img_dir = 'dataset/images'
results_dict = {}

for img_file in os.listdir(img_dir):
    if not img_file.endswith('.jpg'): continue
    path = os.path.join(img_dir, img_file)
    res = model(path, verbose=False)[0]
    
    if len(res.boxes) > 0:
        box = res.boxes[0].xyxy[0].tolist() # x1, y1, x2, y2
        results_dict[img_file] = box
    else:
        results_dict[img_file] = None

with open('yolo_boxes.json', 'w') as f:
    json.dump(results_dict, f)
print("YOLO boxes saved to yolo_boxes.json")
