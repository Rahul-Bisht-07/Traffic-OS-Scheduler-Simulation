import os
import logging
import numpy as np
import cv2
from ultralytics import YOLO

class VehicleDetector:
    """
    Class for real vehicle detection using YOLOv8 models.
    Detects both regular and emergency vehicles.
    """
    def __init__(self):
        """Initialize the vehicle detector and load YOLOv8 models."""
        self.logger = logging.getLogger(__name__)
        self.logger.info("Vehicle detector initialized (YOLOv8)")
        # Paths relative to this file's location
        base_dir = os.path.dirname(os.path.abspath(__file__))
        # Emergency vehicle model
        self.model_emergency = YOLO('C:/Users/ASUS/Desktop/finalfinal/tempo/tempo/emergency_vehicle_model/train2/weights/best.pt')
        # General vehicle model
        self.model_general = YOLO('C:/Users/ASUS/Desktop/finalfinal/tempo/tempo/yolov8n.pt')
        # Emergency vehicle class names (from data.yaml)
        self.emergency_classes = [
            'ambulance_off', 'ambulance_on', 'firetruck_off', 'firetruck_on'
        ]
        # General vehicle classes
        self.general_vehicle_classes = ['car', 'truck', 'bus', 'motorcycle']

    def detect_vehicles(self, image):
        """
        Detect vehicles in the given image using YOLOv8 models.
        Args:
            image: Image data as bytes or numpy array (BGR)
        Returns:
            dict: Contains counts of regular and emergency vehicles
        """
        try:
            # Accept image as bytes (from Flask file upload) or as numpy array
            if isinstance(image, bytes):
                npimg = np.frombuffer(image, np.uint8)
                img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
            elif isinstance(image, np.ndarray):
                img = image
            else:
                raise ValueError("Input image must be bytes or numpy array")

            # Run detection for emergency vehicles
            results_emergency = self.model_emergency(img)[0]
            # Run detection for general vehicles
            results_general = self.model_general(img)[0]

            # Count regular vehicles (car, truck, bus, motorcycle)
            general_vehicle_count = 0
            for box in results_general.boxes:
                class_id = int(box.cls)
                class_name = self.model_general.names[class_id]
                if class_name in self.general_vehicle_classes:
                    general_vehicle_count += 1

            # Count emergency vehicles (all detections in emergency model)
            emergency_vehicle_count = len(results_emergency.boxes)

            # Prepare detection details (optional, for frontend)
            detections = []
            for box in results_general.boxes:
                class_id = int(box.cls)
                class_name = self.model_general.names[class_id]
                if class_name in self.general_vehicle_classes:
                    detections.append({
                        'type': 'regular',
                        'class': class_name,
                        'conf': float(box.conf),
                        'xyxy': box.xyxy.tolist()
                    })
            for box in results_emergency.boxes:
                class_id = int(box.cls)
                class_name = self.model_emergency.names[class_id]
                detections.append({
                    'type': 'emergency',
                    'class': class_name,
                    'conf': float(box.conf),
                    'xyxy': box.xyxy.tolist()
                })

            self.logger.info(f"Detected: {general_vehicle_count} regular, {emergency_vehicle_count} emergency vehicles")

            return {
                "regular_count": general_vehicle_count-emergency_vehicle_count,
                "emergency_count": emergency_vehicle_count,
                "detections": detections
            }
        except Exception as e:
            self.logger.error(f"Error in detect_vehicles: {str(e)}")
            return {
                "regular_count": 0,
                "emergency_count": 0,
                "detections": [],
                "error": str(e)
            }
