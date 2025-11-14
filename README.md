# Traffic Lane Simulator with YOLOv8 Vehicle Detection

A comprehensive traffic signal scheduling simulator that integrates YOLOv8 AI models for real-time vehicle detection and intelligent traffic management.

## 🚦 Features

- **Real-time Vehicle Detection**: Uses YOLOv8 models to detect both regular and emergency vehicles from uploaded images
- **Intelligent Traffic Scheduling**: Implements multiple OS scheduling algorithms:
  - **Priority Scheduling**: Automatically activates when emergency vehicles are detected
  - **Shortest Job First (SJF)**: Used when there are significant differences in vehicle counts between lanes
  - **Round Robin**: Default algorithm for normal traffic conditions
- **Interactive Simulation**: Real-time visualization of traffic flow with animated vehicles
- **Multi-lane Support**: Handles North, East, South, and West traffic lanes
- **Emergency Vehicle Priority**: Automatically gives priority to lanes with emergency vehicles

## 🏗️ Architecture

### Backend (Flask)
- **Vehicle Detection**: YOLOv8 integration for real-time vehicle counting
- **Traffic Scheduler**: Implements multiple scheduling algorithms
- **REST API**: Handles image uploads and simulation control

### Frontend (HTML/CSS/JavaScript)
- **Interactive UI**: Bootstrap-based responsive design
- **Real-time Simulation**: SVG-based traffic intersection visualization
- **Image Upload**: Support for multiple image formats

### AI Models
- **Emergency Vehicle Detection**: Custom-trained YOLOv8 model for emergency vehicles
- **General Vehicle Detection**: YOLOv8n for regular vehicles (cars, trucks, buses, motorcycles)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd finalfinal
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   cd TrafficLaneSimulator/finalproject/TrafficLaneSimulator/TrafficFlowOptimizer
   python app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 📁 Project Structure

```
finalfinal/
├── TrafficLaneSimulator/          # Main simulator application
│   └── finalproject/
│       └── TrafficLaneSimulator/
│           └── TrafficFlowOptimizer/
│               ├── app.py                 # Flask backend
│               ├── vehicle_detector.py    # YOLOv8 integration
│               ├── scheduler.py           # Traffic scheduling algorithms
│               ├── static/                # Frontend assets
│               └── templates/             # HTML templates
├── tempo/                          # YOLOv8 models and training data
│   └── tempo/
│       ├── emergency_vehicle_model/      # Custom emergency vehicle model
│       ├── Emergency-Vehicles-Det-6/     # Dataset and model files
│       └── yolov8n.pt                    # General vehicle detection model
└── README.md                       # This file
```

## 🎯 Usage

### 1. **Upload Images**
   - Upload images for each lane (North, East, South, West)
   - The system will automatically detect vehicles using YOLOv8

### 2. **Automatic Algorithm Selection**
   - **Priority**: Activates when emergency vehicles are detected
   - **SJF**: Activates when there's a significant gap in vehicle counts between lanes
   - **Round Robin**: Default for normal traffic conditions

### 3. **Simulation Control**
   - **Step**: Advance simulation one step at a time
   - **Auto**: Continuous simulation mode
   - **Reset**: Start over with new vehicle counts

## 🔧 Configuration

### Model Paths
The system automatically detects the correct paths for YOLOv8 models:
- Emergency vehicle model: `tempo/tempo/emergency_vehicle_model/train2/weights/best.pt`
- General vehicle model: `tempo/tempo/yolov8n.pt`

### Supported Image Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

## 🧠 AI Models

### Emergency Vehicle Detection
- **Classes**: ambulance_off, ambulance_on, firetruck_off, firetruck_on
- **Model**: Custom-trained YOLOv8 on emergency vehicle dataset
- **Accuracy**: Optimized for emergency vehicle recognition

### General Vehicle Detection
- **Classes**: car, truck, bus, motorcycle
- **Model**: YOLOv8n (nano) pre-trained model
- **Performance**: Fast inference suitable for real-time applications

## 📊 Performance

- **Real-time Detection**: Processes images in milliseconds
- **Multi-lane Processing**: Handles up to 4 lanes simultaneously
- **Scalable Architecture**: Easy to extend for additional lanes or algorithms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ultralytics**: For the YOLOv8 framework
- **Roboflow**: For the emergency vehicle dataset
- **Bootstrap**: For the responsive UI framework

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/yourrepo/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

---

**Made with ❤️ for intelligent traffic management**
