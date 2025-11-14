import time
import logging
from enum import Enum
import heapq

class SchedulingAlgorithm(Enum):
    """Enum for different scheduling algorithms."""
    SJF = "Shortest Job First"
    PRIORITY = "Priority Scheduling"
    ROUND_ROBIN = "Round Robin"

class Lane:
    """Class representing a traffic lane."""
    
    def __init__(self, name, lane_id):
        """
        Initialize a lane.
        
        Args:
            name: Name/direction of the lane (e.g., "North")
            lane_id: Unique ID for the lane (0-3)
        """
        self.name = name
        self.id = lane_id
        self.vehicle_count = 0
        self.emergency_count = 0
        self.processed_time = 0  # Time this lane has been serviced
        self.waiting_time = 0  # Time this lane has been waiting
        self.is_green = False
        self.has_vehicle_in_intersection = False  # Track if a vehicle from this lane is in the intersection
    
    def update_vehicles(self, regular_count, emergency_count):
        """Update the vehicle counts for this lane."""
        self.vehicle_count = regular_count
        self.emergency_count = emergency_count
    
    def get_total_vehicles(self):
        """Get the total number of vehicles in the lane."""
        return self.vehicle_count + self.emergency_count
    
    def to_dict(self):
        """Convert lane information to dictionary for JSON serialization."""
        return {
            "name": self.name,
            "id": self.id,
            "vehicle_count": self.vehicle_count,
            "emergency_count": self.emergency_count,
            "processed_time": self.processed_time,
            "waiting_time": self.waiting_time,
            "is_green": self.is_green,
            "has_vehicle_in_intersection": self.has_vehicle_in_intersection
        }

class TrafficScheduler:
    """Class to handle traffic signal scheduling using various algorithms."""
    
    def __init__(self):
        """Initialize the traffic scheduler."""
        self.logger = logging.getLogger(__name__)
        self.lanes = []
        self.current_algorithm = SchedulingAlgorithm.ROUND_ROBIN.value
        self.time_quantum = 0.5  # Set time quantum to 1 sec divided by 2 to prevent starvation
        self.last_schedule_time = time.time()
        self.current_green_lane_id = -1  # No lane has green initially
        self.consecutive_cycles = 0  # Track how many consecutive times a lane has been green
        self.lane_crossings_complete = True  # Flag to track if vehicles have fully crossed the intersection
        self.vehicle_quota = 0  # Number of vehicles allowed to pass in current lane before switching
    
    def set_lanes(self, lanes):
        """Set the lanes for the scheduler."""
        self.lanes = lanes
    
    def reset(self):
        """Reset the scheduler."""
        for lane in self.lanes:
            lane.processed_time = 0
            lane.waiting_time = 0
            lane.is_green = False
            lane.has_vehicle_in_intersection = False
        
        # Reset all state variables
        self.current_green_lane_id = -1
        self.consecutive_cycles = 0
        self.lane_crossings_complete = True
        self.vehicle_quota = 0
        
        # Select initial algorithm based on vehicle counts
        self.select_algorithm()
    
    def select_algorithm(self):
        """
        Select the appropriate scheduling algorithm based on current traffic conditions.
        
        - SJF: When there's a significant gap between lanes (at least 10 vehicles difference)
        - Priority: When there are emergency vehicles
        - Round Robin: Default for normal traffic conditions
        """
        # Check for emergency vehicles first
        emergency_vehicles = sum(lane.emergency_count for lane in self.lanes)
        if emergency_vehicles > 0:
            self.current_algorithm = SchedulingAlgorithm.PRIORITY.value
            self.logger.debug(f"Selected algorithm: {self.current_algorithm} (emergency vehicles present)")
            return
            
        # Check for significant differences between lanes
        lane_vehicle_counts = []
        for lane in self.lanes:
            vehicles = lane.get_total_vehicles()
            if vehicles > 0:  # Only consider non-empty lanes
                lane_vehicle_counts.append((lane.id, vehicles))
        
        if len(lane_vehicle_counts) >= 2:  # Need at least 2 lanes with vehicles
            # Get min and max vehicle counts
            min_lane_id, min_vehicles = min(lane_vehicle_counts, key=lambda x: x[1])
            max_lane_id, max_vehicles = max(lane_vehicle_counts, key=lambda x: x[1])
            
            # Use SJF if there's at least a 10-vehicle gap between min and max
            if max_vehicles - min_vehicles >= 5:  
                self.current_algorithm = SchedulingAlgorithm.SJF.value
                self.logger.debug(f"Selected algorithm: {self.current_algorithm} (gap between lanes {min_lane_id}:{min_vehicles} and {max_lane_id}:{max_vehicles})")
                return
        
        # Default to Round Robin
        self.current_algorithm = SchedulingAlgorithm.ROUND_ROBIN.value
        self.logger.debug(f"Selected algorithm: {self.current_algorithm} (default)")
    
    def schedule_next_lane(self):
        """
        Schedule the next lane to get a green light based on the selected algorithm.
        Only changes lanes when vehicles have fully crossed the intersection.
        
        Returns:
            int: The ID of the lane that should get a green light
        """
        # Only switch lanes if vehicles have completed crossing the intersection
        if not self.lane_crossings_complete:
            # Return the current green lane if there are still vehicles crossing
            return self.current_green_lane_id
            
        # Reset the green status for all lanes
        for lane in self.lanes:
            lane.is_green = False
        
        # Store previous green lane for comparison
        prev_green_lane = self.current_green_lane_id
        
        if self.current_algorithm == SchedulingAlgorithm.SJF.value:
            next_lane_id = self._schedule_sjf()
        elif self.current_algorithm == SchedulingAlgorithm.PRIORITY.value:
            next_lane_id = self._schedule_priority()
        else:  # Default to Round Robin
            next_lane_id = self._schedule_round_robin()
        
        # Update the green status for the selected lane
        if next_lane_id >= 0 and next_lane_id < len(self.lanes):
            self.lanes[next_lane_id].is_green = True
            self.current_green_lane_id = next_lane_id
            
            # If the lane changed, reset consecutive cycles counter (unless already done in round robin method)
            if prev_green_lane != next_lane_id and self.current_algorithm != SchedulingAlgorithm.ROUND_ROBIN.value:
                self.consecutive_cycles = 1
        
        return next_lane_id
        
    def set_lane_crossing_status(self, is_complete):
        """
        Set the status of vehicles crossing the intersection.
        
        Args:
            is_complete: Boolean indicating whether all vehicles have completed crossing
        """
        self.lane_crossings_complete = is_complete
    
    def _schedule_sjf(self):
        """
        Implement Shortest Job First scheduling algorithm.
        
        Returns:
            int: The ID of the lane with the fewest vehicles
        """
        # If all lanes are empty, return -1
        if all(lane.get_total_vehicles() == 0 for lane in self.lanes):
            return -1
        
        # Using a vehicle quota system with half the vehicles (similar to Round Robin)
        
        # If current lane still has vehicles and hasn't reached the quota, keep it green
        if (self.current_green_lane_id >= 0 and 
            self.lanes[self.current_green_lane_id].get_total_vehicles() > 0):
            
            # If this is the first cycle for this lane, initialize vehicle quota
            if self.consecutive_cycles == 0:
                # Set quota to 50% of vehicles in lane (min 1, max 2)
                total_vehicles = self.lanes[self.current_green_lane_id].get_total_vehicles()
                self.vehicle_quota = min(2, max(1, total_vehicles // 2))
                self.consecutive_cycles = 1
                self.logger.debug(f"SJF set quota of {self.vehicle_quota} vehicles for lane {self.current_green_lane_id}")
                return self.current_green_lane_id
            
            # If we still have quota left, keep the lane green
            if self.vehicle_quota > 0:
                # Each cycle, one vehicle passes through
                self.vehicle_quota -= 1
                self.consecutive_cycles += 1
                self.logger.debug(f"SJF kept lane {self.current_green_lane_id} green, remaining quota: {self.vehicle_quota}")
                return self.current_green_lane_id
        
        # Reset consecutive cycles counter as we're switching lanes
        self.consecutive_cycles = 0  # Set to 0 so next lane initializes its quota
            
        # Find the lane with the smallest number of vehicles
        lane_vehicle_counts = []
        for lane in self.lanes:
            total_vehicles = lane.get_total_vehicles()
            if total_vehicles > 0:  # Only consider non-empty lanes
                lane_vehicle_counts.append((lane.id, total_vehicles))
        
        # If no lane has vehicles, return -1
        if not lane_vehicle_counts:
            return -1
        
        # Sort lanes by vehicle count and get the one with fewest vehicles
        lane_vehicle_counts.sort(key=lambda x: x[1])  # Sort by vehicle count
        min_lane_id, min_vehicles = lane_vehicle_counts[0]
        
        self.logger.debug(f"SJF selected lane {min_lane_id} with {min_vehicles} vehicles")
        return min_lane_id
    
    def _schedule_priority(self):
        """
        Implement Priority scheduling algorithm, prioritizing lanes with emergency vehicles.
        
        Returns:
            int: The ID of the highest priority lane
        """
        # If all lanes are empty, return -1
        if all(lane.get_total_vehicles() == 0 for lane in self.lanes):
            return -1
            
        # Using a vehicle quota system similar to Round Robin but with higher quota for emergency
        
        # If current lane has vehicles and hasn't reached the quota, keep it green
        if (self.current_green_lane_id >= 0 and 
            self.lanes[self.current_green_lane_id].get_total_vehicles() > 0):
            
            # If this is the first cycle for this lane, initialize vehicle quota
            if self.consecutive_cycles == 0:
                # Set quota to 50% of vehicles for regular lanes, higher for emergency
                total_vehicles = self.lanes[self.current_green_lane_id].get_total_vehicles()
                
                # If this lane has emergency vehicles, give it a higher quota
                if self.lanes[self.current_green_lane_id].emergency_count > 0:
                    self.vehicle_quota = max(2, total_vehicles // 2)
                    self.logger.debug(f"Priority set quota of {self.vehicle_quota} vehicles for lane {self.current_green_lane_id} with emergency vehicles")
                else:
                    self.vehicle_quota = max(1, total_vehicles // 2)
                    self.logger.debug(f"Priority set quota of {self.vehicle_quota} vehicles for lane {self.current_green_lane_id}")
                    
                self.consecutive_cycles = 1
                return self.current_green_lane_id
            
            # If we still have quota left, keep the lane green
            if self.vehicle_quota > 0:
                # Each cycle, one vehicle passes through
                self.vehicle_quota -= 1
                self.consecutive_cycles += 1
                self.logger.debug(f"Priority kept lane {self.current_green_lane_id} green, remaining quota: {self.vehicle_quota}")
                return self.current_green_lane_id
        
        # Reset consecutive cycles counter as we're switching lanes
        self.consecutive_cycles = 0  # Set to 0 so next lane initializes its quota
        
        # First check for lanes with emergency vehicles
        emergency_lanes = []
        for lane in self.lanes:
            if lane.emergency_count > 0 and lane.get_total_vehicles() > 0:
                emergency_lanes.append((lane.emergency_count, lane.id))
        
        if emergency_lanes:
            # Sort by number of emergency vehicles (descending)
            emergency_lanes.sort(reverse=True)
            self.logger.debug(f"Priority selected lane {emergency_lanes[0][1]} with {emergency_lanes[0][0]} emergency vehicles")
            return emergency_lanes[0][1]
        
        # If no emergency vehicles, fall back to SJF
        self.logger.debug("No emergency vehicles, falling back to SJF")
        return self._schedule_sjf()
    
    def _schedule_round_robin(self):
        
        # If all lanes are empty, return -1
        if all(lane.get_total_vehicles() == 0 for lane in self.lanes):
            return -1

        max_vehicles_per_cycle = 5  # Each lane can pass maximum 5 vehicles during its turn

        # If current lane has vehicles and quota left, keep it green
        if (self.current_green_lane_id >= 0 and 
            self.lanes[self.current_green_lane_id].get_total_vehicles() > 0):

            if self.consecutive_cycles < max_vehicles_per_cycle:
                # Allow vehicles to pass
                self.consecutive_cycles += 1
                self.logger.debug(f"Round Robin kept lane {self.current_green_lane_id} green, consecutive cycles: {self.consecutive_cycles}")
                return self.current_green_lane_id

        # After quota exhausted or no vehicles left in current lane, switch to next lane
        self.consecutive_cycles = 0  # Reset for the next lane

        # Find the next lane with available vehicles
        for i in range(1, len(self.lanes) + 1):
            next_lane_id = (self.current_green_lane_id + i) % len(self.lanes)
            if self.lanes[next_lane_id].get_total_vehicles() > 0:
                self.logger.debug(f"Round Robin switched to lane {next_lane_id}")
                return next_lane_id

        return -1  # Fallback (should not happen due to first check)
