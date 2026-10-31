import base64
import io
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

CLASS_NAMES = [
    "Candy_A",
    "Skittles",
    "Snickers",
    "Twix",
    "Candy_E",
    "Candy_F",
    "Candy_G",
    "Candy_H",
    "Candy_I",
    "Candy_J",
]
CLASS_NAMES.append("No Candy")
NO_CANDY_INDEX = len(CLASS_NAMES) - 1

THRESHOLDS = {
    0: 0.35,  
    1: 0.30,   
    2: 0.50,  
    3: 0.40,  
    4: 0.40,  
    5: 0.40,  
    6: 0.40,  
    7: 0.40,  
    8: 0.40, 
    9: 0.40,  
}

model = models.resnet18()
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, 10)

try:
    model.load_state_dict(torch.load('candy_resnet18.pth', map_location=device))
    print('Loaded custom trained weights successfully.')
except FileNotFoundError:
    print("Warning: 'candy_resnet18.pth' not found. Using uninitialized weights for testing structure.")

model = model.to(device)
model.eval()

inference_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
            
        raw_image_str = data['image']
        if ',' in raw_image_str:
            image_data = raw_image_str.split(',')[1]
        else:
            image_data = raw_image_str
            
        image_bytes = base64.b64decode(image_data)
        pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
 
        input_tensor = inference_transforms(pil_img).unsqueeze(0).to(device)
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence, pred = torch.max(probabilities, 1)
            
        confidence_pct = confidence.item()
        final_pred_idx = pred.item()
        class_threshold = THRESHOLDS.get(final_pred_idx, 0.40)
        if confidence_pct < class_threshold:
            final_pred_idx = NO_CANDY_INDEX
            
        pred_label = CLASS_NAMES[final_pred_idx]
        
        return jsonify({
            'candy': pred_label,
            'confidence': confidence_pct,
            'is_candy': final_pred_idx != NO_CANDY_INDEX
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8082, debug=True)
