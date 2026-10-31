import cv2
import torch
import torch.nn as nn
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

CLASS_NAMES = ["Candy_A", "Skittles", "Snickers", "Twix", "Candy_E", 
               "Candy_F", "Candy_G", "Candy_H", "Candy_I", "Candy_J"] 
CLASS_NAMES.append("No Candy")
NO_CANDY_INDEX = len(CLASS_NAMES) - 1
CONFIDENCE_THRESHOLD = 0.40

model = models.resnet18()
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, 10) 


try:
    model.load_state_dict(torch.load('candy_resnet18.pth', map_location=device))
    print("Loaded custom trained weights successfully.")
except FileNotFoundError:
    print("Warning: 'candy_resnet18.pth' not found. Using uninitialized weights for testing structure.")

model = model.to(device)
model.eval()

inference_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

cap = cv2.VideoCapture(0) 

if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

print("Real-time inference started. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(rgb_frame)
    
    input_tensor = inference_transforms(pil_img).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        confidence, pred = torch.max(probabilities, 1)
        
        confidence_pct = confidence.item()
        final_pred_idx = pred.item()
        
        if confidence_pct < CONFIDENCE_THRESHOLD:
            final_pred_idx = NO_CANDY_INDEX

    pred_label = CLASS_NAMES[final_pred_idx]
    display_text = f"Pred: {pred_label} ({confidence_pct*100:.1f}%)"
    
    color = (0, 255, 0) if final_pred_idx != NO_CANDY_INDEX else (0, 0, 255)

    cv2.putText(frame, display_text, (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2, cv2.LINE_AA)
    cv2.imshow('Real-Time Candy Classification', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()



