import os
import xml.etree.ElementTree as ET

# Configuration
ANN_DIR = 'dataset/annotations'
LABELS_DIR = 'dataset/labels'

class_mapping = {'total': 0}

if not os.path.exists(LABELS_DIR):
    os.makedirs(LABELS_DIR)

converted = 0
errors = 0

for xml_file in os.listdir(ANN_DIR):
    if not xml_file.endswith('.xml'):
        continue
        
    xml_path = os.path.join(ANN_DIR, xml_file)
    tree = ET.parse(xml_path)
    root = tree.getroot()
    
    try:
        size = root.find('size')
        img_w = float(size.find('width').text)
        img_h = float(size.find('height').text)
        
        txt_filename = xml_file.replace('.xml', '.txt')
        txt_path = os.path.join(LABELS_DIR, txt_filename)
        
        with open(txt_path, 'w') as out_file:
            for obj in root.iter('object'):
                difficult = obj.find('difficult')
                if difficult is not None and difficult.text == '1':
                    continue
                    
                cls_name = obj.find('name').text
                if cls_name not in class_mapping:
                    continue
                
                cls_id = class_mapping[cls_name]
                
                xmlbox = obj.find('bndbox')
                xmin = float(xmlbox.find('xmin').text)
                ymin = float(xmlbox.find('ymin').text)
                xmax = float(xmlbox.find('xmax').text)
                ymax = float(xmlbox.find('ymax').text)
                
                # YOLO format: x_center, y_center, width, height (normalized)
                x_center = ((xmin + xmax) / 2.0) / img_w
                y_center = ((ymin + ymax) / 2.0) / img_h
                w = (xmax - xmin) / img_w
                h = (ymax - ymin) / img_h
                
                # Write to file
                out_file.write(f"{cls_id} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}\n")
        converted += 1
    except Exception as e:
        print(f"Error converting {xml_file}: {e}")
        errors += 1

print(f"Done! Converted {converted} XML files into YOLO format.")
if errors > 0:
    print(f"Failed on {errors} files.")

# Create the YOLO data.yaml
yaml_content = f"\"\"\"\npath: ../dataset\ntrain: images\nval: images\n\nnames:\n  0: total\n\"\"\"\n"
with open('dataset/data.yaml', 'w') as yf:
    yf.write(yaml_content.strip().replace('\"\"\"', ''))
