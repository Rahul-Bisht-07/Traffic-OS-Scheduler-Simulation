import os
import logging
import json
import time
from flask import Flask, render_template, request, jsonify, Response
from vehicle_detector import VehicleDetector
from scheduler import TrafficScheduler, Lane

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key")

# Initialize the vehicle detector
detector = VehicleDetector()

# Initialize the traffic scheduler
scheduler = TrafficScheduler()

# Create lanes
north_lane = Lane("North", 0)
east_lane = Lane("East", 1)
south_lane = Lane("South", 2)
west_lane = Lane("West", 3)

lanes = [north_lane, east_lane, south_lane, west_lane]
scheduler.set_lanes(lanes)

# Placeholder for demo images - in a real implementation, these would be captured from cameras
demo_images = {
    "north": None,
    "east": None,
    "south": None,
    "west": None
}

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/detect', methods=['POST'])
def detect_vehicles():
    """Process uploaded images and detect vehicles in each lane."""
    try:
        files = request.files
        detection_results = {}
        
        for lane_direction in ['north', 'east', 'south', 'west']:
            if lane_direction in files:
                file = files[lane_direction]
                # Read the file as bytes for YOLOv8 detection
                image_bytes = file.read()
                # Run real vehicle detection
                result = detector.detect_vehicles(image_bytes)
                detection_results[lane_direction] = result
                # Update corresponding lane in the scheduler
                lane_index = {"north": 0, "east": 1, "south": 2, "west": 3}[lane_direction]
                lanes[lane_index].update_vehicles(result["regular_count"], result["emergency_count"])
        
        # Determine the scheduling algorithm based on vehicle counts
        scheduler.select_algorithm()
        
        # Get the next lane to be given green light
        next_green_lane = scheduler.schedule_next_lane()
        
        return jsonify({
            "detection_results": detection_results,
            "next_green_lane": next_green_lane,
            "current_algorithm": scheduler.current_algorithm,
            "lane_data": [lane.to_dict() for lane in lanes]
        })
    
    except Exception as e:
        logger.error(f"Error in detect_vehicles: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/manual_input', methods=['POST'])
def manual_input():
    """Process manually entered vehicle counts for each lane."""
    try:
        data = request.json
        logger.debug(f"Received manual input: {data}")
        if data is None:
            return jsonify({"error": "No JSON data received"}), 400
        # Update lanes with manual vehicle counts
        for lane_id, lane_data in enumerate(data.get('lanes', [])):
            regular_count = lane_data.get('regular_count', 0)
            emergency_count = lane_data.get('emergency_count', 0)
            
            # Validate input - don't clamp vehicle counts anymore
            regular_count = max(0, regular_count)
            emergency_count = max(0, emergency_count)
            
            # Update lane
            lanes[lane_id].update_vehicles(regular_count, emergency_count)
            
            logger.debug(f"Updated lane {lane_id} with {regular_count} regular, {emergency_count} emergency vehicles")
        
        # Determine the scheduling algorithm based on vehicle counts
        scheduler.select_algorithm()
        
        # Get the next lane to be given green light
        next_green_lane = scheduler.schedule_next_lane()
        
        return jsonify({
            "success": True,
            "next_green_lane": next_green_lane,
            "current_algorithm": scheduler.current_algorithm,
            "lane_data": [lane.to_dict() for lane in lanes]
        })
    
    except Exception as e:
        logger.error(f"Error in manual_input: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/simulate_step', methods=['POST'])
def simulate_step():
    """Advance the traffic simulation by one step."""
    try:
        # Get current state from frontend
        data = request.json
        if data is None:
            return jsonify({"error": "No JSON data received"}), 400
        
        # Update lane data with vehicle counts
        for i, lane_data in enumerate(data.get('lanes', [])):
            lanes[i].vehicle_count = lane_data.get('vehicle_count', 0)
            lanes[i].emergency_count = lane_data.get('emergency_count', 0)
        
        # Update intersection crossing status
        # This tells the scheduler if vehicles have finished crossing the intersection
        intersection_clear = data.get('intersection_clear', True)
        
        # Get list of lanes with vehicles in the intersection
        vehicles_in_intersection = data.get('vehicles_in_intersection', [])
        
        # Update the scheduler with intersection status
        scheduler.set_lane_crossing_status(intersection_clear)
        
        # If the intersection is not clear, we need to ensure vehicles complete crossing
        if not intersection_clear and vehicles_in_intersection:
            # Check if the current green lane has a vehicle in the intersection
            current_green_lane = scheduler.current_green_lane_id
            if current_green_lane in vehicles_in_intersection:
                # Don't change the green lane - let vehicle complete crossing
                next_green_lane = current_green_lane
                app.logger.debug(f"Keeping lane {current_green_lane} green to clear intersection")
                return jsonify({
                    "next_green_lane": next_green_lane,
                    "current_algorithm": scheduler.current_algorithm,
                    "lane_data": [lane.to_dict() for lane in lanes]
                })
        
        # Update the algorithm based on current vehicle counts
        scheduler.select_algorithm()
        
        # Get the next lane to be given green light
        next_green_lane = scheduler.schedule_next_lane()
        
        # Simulate vehicle movement (handled by frontend)
        return jsonify({
            "next_green_lane": next_green_lane,
            "current_algorithm": scheduler.current_algorithm,
            "lane_data": [lane.to_dict() for lane in lanes]
        })
    
    except Exception as e:
        logger.error(f"Error in simulate_step: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/reset', methods=['POST'])
def reset_simulation():
    """Reset the traffic simulation."""
    try:
        for lane in lanes:
            lane.vehicle_count = 0
            lane.emergency_count = 0
            lane.processed_time = 0
        
        scheduler.reset()
        
        return jsonify({
            "success": True,
            "lane_data": [lane.to_dict() for lane in lanes]
        })
    
    except Exception as e:
        logger.error(f"Error in reset_simulation: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
