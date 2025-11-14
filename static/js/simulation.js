/**
 * simulation.js
 * Handles the traffic simulation visualization and logic
 */

class TrafficSimulation {
    constructor() {
        this.lanes = [
            { id: 0, name: 'North', vehicles: [], direction: 'down', entry: { x: 270, y: 0 }, exit: { x: 270, y: 400 }, hasVehicleInIntersection: false },
            { id: 1, name: 'East', vehicles: [], direction: 'left', entry: { x: 600, y: 170 }, exit: { x: 0, y: 170 }, hasVehicleInIntersection: false },
            { id: 2, name: 'South', vehicles: [], direction: 'up', entry: { x: 330, y: 400 }, exit: { x: 330, y: 0 }, hasVehicleInIntersection: false },
            { id: 3, name: 'West', vehicles: [], direction: 'right', entry: { x: 0, y: 230 }, exit: { x: 600, y: 230 }, hasVehicleInIntersection: false }
        ];
        
        this.currentGreenLane = -1;
        this.animationFrameId = null;
        this.isAutoMode = false;
        this.autoInterval = null;
        this.svg = null;
        this.vehicleGroup = null;
        this.containerWidth = 600;
        this.containerHeight = 400;
        this.intersectionClear = true;  // Flag to track if intersection is clear
        this.safetyBuffer = 10;  // Larger safety buffer to prevent any possibility of collisions
        
        // Initialize
        this.initializeSimulation();
    }
    
    /**
     * Initialize the traffic simulation
     */
    initializeSimulation() {
        const container = document.getElementById('intersectionContainer');
        container.innerHTML = ''; // Clear previous content
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${this.containerWidth} ${this.containerHeight}`);
        container.appendChild(this.svg);
        
        // Draw intersection
        this.drawIntersection();
        
        // Create vehicle group
        this.vehicleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(this.vehicleGroup);
        
        // Start animation loop
        this.animate();
    }
    
    /**
     * Draw the road intersection
     */
    drawIntersection() {
        // Create background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', this.containerWidth);
        background.setAttribute('height', this.containerHeight);
        background.setAttribute('fill', '#2c3e50');
        this.svg.appendChild(background);
        
        // Draw roads
        // Horizontal road
        const horizontalRoad = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        horizontalRoad.setAttribute('x', 0);
        horizontalRoad.setAttribute('y', 150);
        horizontalRoad.setAttribute('width', this.containerWidth);
        horizontalRoad.setAttribute('height', 100);
        horizontalRoad.setAttribute('class', 'road');
        this.svg.appendChild(horizontalRoad);
        
        // Vertical road
        const verticalRoad = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        verticalRoad.setAttribute('x', 250);
        verticalRoad.setAttribute('y', 0);
        verticalRoad.setAttribute('width', 100);
        verticalRoad.setAttribute('height', this.containerHeight);
        verticalRoad.setAttribute('class', 'road');
        this.svg.appendChild(verticalRoad);
        
        // Intersection box
        const intersection = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        intersection.setAttribute('x', 250);
        intersection.setAttribute('y', 150);
        intersection.setAttribute('width', 100);
        intersection.setAttribute('height', 100);
        intersection.setAttribute('class', 'intersection-box');
        this.svg.appendChild(intersection);
        
        // Draw road markings
        // Horizontal road markings for left-side driving
        const horizontalMarking = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        horizontalMarking.setAttribute('x1', 0);
        horizontalMarking.setAttribute('y1', 200);
        horizontalMarking.setAttribute('x2', this.containerWidth);
        horizontalMarking.setAttribute('y2', 200);
        horizontalMarking.setAttribute('class', 'road-marking');
        this.svg.appendChild(horizontalMarking);
        
        // Vertical road markings for left-side driving
        const verticalMarking = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        verticalMarking.setAttribute('x1', 300);
        verticalMarking.setAttribute('y1', 0);
        verticalMarking.setAttribute('x2', 300);
        verticalMarking.setAttribute('y2', this.containerHeight);
        verticalMarking.setAttribute('class', 'road-marking');
        this.svg.appendChild(verticalMarking);
        
        // Additional lane dividers for left-side driving
        // North/South divider
        const nsLaneDivider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        nsLaneDivider.setAttribute('x1', 280);
        nsLaneDivider.setAttribute('y1', 0);
        nsLaneDivider.setAttribute('x2', 280);
        nsLaneDivider.setAttribute('y2', 150);
        nsLaneDivider.setAttribute('stroke', '#ffffff');
        nsLaneDivider.setAttribute('stroke-width', '2');
        nsLaneDivider.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(nsLaneDivider);
        
        const nsLaneDivider2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        nsLaneDivider2.setAttribute('x1', 280);
        nsLaneDivider2.setAttribute('y1', 250);
        nsLaneDivider2.setAttribute('x2', 280);
        nsLaneDivider2.setAttribute('y2', this.containerHeight);
        nsLaneDivider2.setAttribute('stroke', '#ffffff');
        nsLaneDivider2.setAttribute('stroke-width', '2');
        nsLaneDivider2.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(nsLaneDivider2);
        
        // East/West divider
        const ewLaneDivider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ewLaneDivider.setAttribute('x1', 0);
        ewLaneDivider.setAttribute('y1', 180);
        ewLaneDivider.setAttribute('x2', 250);
        ewLaneDivider.setAttribute('y2', 180);
        ewLaneDivider.setAttribute('stroke', '#ffffff');
        ewLaneDivider.setAttribute('stroke-width', '2');
        ewLaneDivider.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(ewLaneDivider);
        
        const ewLaneDivider2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ewLaneDivider2.setAttribute('x1', 350);
        ewLaneDivider2.setAttribute('y1', 180);
        ewLaneDivider2.setAttribute('x2', this.containerWidth);
        ewLaneDivider2.setAttribute('y2', 180);
        ewLaneDivider2.setAttribute('stroke', '#ffffff');
        ewLaneDivider2.setAttribute('stroke-width', '2');
        ewLaneDivider2.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(ewLaneDivider2);
        
        // Draw traffic lights
        this.drawTrafficLights();
    }
    
    /**
     * Draw traffic lights on the intersection
     */
    drawTrafficLights() {
        // North traffic light
        this.drawTrafficLight(230, 130, 'north-light');
        
        // East traffic light
        this.drawTrafficLight(370, 130, 'east-light');
        
        // South traffic light
        this.drawTrafficLight(370, 270, 'south-light');
        
        // West traffic light
        this.drawTrafficLight(230, 270, 'west-light');
    }
    
    /**
     * Draw a single traffic light
     */
    drawTrafficLight(x, y, id) {
        const trafficLight = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        trafficLight.setAttribute('id', id);
        
        // Traffic light housing
        const housing = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        housing.setAttribute('x', x);
        housing.setAttribute('y', y);
        housing.setAttribute('width', 20);
        housing.setAttribute('height', 40);
        housing.setAttribute('rx', 5);
        housing.setAttribute('ry', 5);
        housing.setAttribute('fill', '#333');
        housing.setAttribute('stroke', '#222');
        housing.setAttribute('stroke-width', 1);
        trafficLight.appendChild(housing);
        
        // Red light
        const redLight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        redLight.setAttribute('cx', x + 10);
        redLight.setAttribute('cy', y + 10);
        redLight.setAttribute('r', 5);
        redLight.setAttribute('fill', '#ff0000');
        redLight.setAttribute('opacity', '1');
        redLight.setAttribute('class', 'light red');
        trafficLight.appendChild(redLight);
        
        // Yellow light
        const yellowLight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        yellowLight.setAttribute('cx', x + 10);
        yellowLight.setAttribute('cy', y + 20);
        yellowLight.setAttribute('r', 5);
        yellowLight.setAttribute('fill', '#ffff00');
        yellowLight.setAttribute('opacity', '0.3');
        yellowLight.setAttribute('class', 'light yellow');
        trafficLight.appendChild(yellowLight);
        
        // Green light
        const greenLight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        greenLight.setAttribute('cx', x + 10);
        greenLight.setAttribute('cy', y + 30);
        greenLight.setAttribute('r', 5);
        greenLight.setAttribute('fill', '#00ff00');
        greenLight.setAttribute('opacity', '0.3');
        greenLight.setAttribute('class', 'light green');
        trafficLight.appendChild(greenLight);
        
        this.svg.appendChild(trafficLight);
    }
    
    /**
     * Update traffic lights based on the current green lane
     */
    updateTrafficLights() {
        const trafficLightIds = ['north-light', 'east-light', 'south-light', 'west-light'];
        
        trafficLightIds.forEach((id, index) => {
            const trafficLight = document.getElementById(id);
            if (!trafficLight) return;
            
            const redLight = trafficLight.querySelector('.light.red');
            const yellowLight = trafficLight.querySelector('.light.yellow');
            const greenLight = trafficLight.querySelector('.light.green');
            
            if (index === this.currentGreenLane) {
                redLight.setAttribute('opacity', '0.3');
                yellowLight.setAttribute('opacity', '0.3');
                greenLight.setAttribute('opacity', '1');
            } else {
                redLight.setAttribute('opacity', '1');
                yellowLight.setAttribute('opacity', '0.3');
                greenLight.setAttribute('opacity', '0.3');
            }
        });
    }
    
    /**
     * Set the green lane
     */
    setGreenLane(laneId) {
        this.currentGreenLane = laneId;
        this.updateTrafficLights();
        this.updateUILights();
    }
    
    /**
     * Update the UI traffic lights
     */
    updateUILights() {
        for (let i = 0; i < 4; i++) {
            const lightEl = document.getElementById(`light-${i}`);
            if (!lightEl) continue;
            
            const redLight = lightEl.querySelector('.light.red');
            const yellowLight = lightEl.querySelector('.light.yellow');
            const greenLight = lightEl.querySelector('.light.green');
            
            redLight.classList.remove('active');
            yellowLight.classList.remove('active');
            greenLight.classList.remove('active');
            
            if (i === this.currentGreenLane) {
                greenLight.classList.add('active');
            } else {
                redLight.classList.add('active');
            }
        }
    }
    
    /**
     * Add vehicles to a lane
     */
    addVehicles(laneId, regularCount, emergencyCount) {
        const lane = this.lanes.find(l => l.id === laneId);
        if (!lane) return;
        
        // Clear existing vehicles
        lane.vehicles = [];
        
        // Define spacing between vehicles to prevent overlapping
        const vehicleSpacing = 10;  // Increased from 3 to prevent vehicle overlapping
        
        // Add regular vehicles (limit to 50 max)
        const limitedRegularCount = Math.min(regularCount, 50);
        for (let i = 0; i < limitedRegularCount; i++) {
            lane.vehicles.push({
                id: `vehicle-${laneId}-${i}`,
                isEmergency: false,
                // Position vehicles with minimal spacing
                position: -i * vehicleSpacing,
                // Maintain reasonable speed for regular vehicles
                speed: 0.4,
                // Flag to track if this vehicle has entered the intersection
                inIntersection: false
            });
        }
        
        // Add emergency vehicles (limit to 50 max)
        const limitedEmergencyCount = Math.min(emergencyCount, 50);
        for (let i = 0; i < limitedEmergencyCount; i++) {
            lane.vehicles.push({
                id: `emergency-${laneId}-${i}`,
                isEmergency: true,
                // Position emergency vehicles after regular vehicles with proper spacing
                position: -(limitedRegularCount + i) * vehicleSpacing,
                // Emergency vehicles are faster than regular ones
                speed: 0.5,
                // Flag to track if this vehicle has entered the intersection
                inIntersection: false
            });
        }
        
        // Update UI counters
        document.getElementById(`regular-${laneId}`).textContent = limitedRegularCount;
        document.getElementById(`emergency-${laneId}`).textContent = limitedEmergencyCount;
    }
    
    /**
     * Update lane data from backend response
     */
    updateLanesFromData(laneData) {
        laneData.forEach((data, index) => {
            this.addVehicles(index, data.vehicle_count, data.emergency_count);
        });
    }
    
    /**
     * Animation loop
     */
    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.updateVehicles();
    }
    
    /**
     * Update vehicle positions
     */
    updateVehicles() {
        // Clear previous vehicles
        while (this.vehicleGroup.firstChild) {
            this.vehicleGroup.removeChild(this.vehicleGroup.firstChild);
        }
        
        // Define intersection area
        const intersectionStart = 30;  // Position where a vehicle enters the intersection
        const intersectionEnd = 70;    // Position where a vehicle exits the intersection
        
        // Track which lanes have vehicles in the intersection
        let lanesWithVehiclesInIntersection = new Set();
        
        // First pass: Reset the hasVehicleInIntersection flag for all lanes
        this.lanes.forEach(lane => {
            lane.hasVehicleInIntersection = false;
        });
        
        // Next, check all lanes for vehicles in the intersection
        // Track if any vehicle is in the intersection box
        let vehicleInIntersectionBox = false;
        
        this.lanes.forEach(lane => {
            lane.vehicles.forEach(vehicle => {
                if (vehicle.position >= intersectionStart && vehicle.position <= intersectionEnd) {
                    vehicle.inIntersection = true;
                    lane.hasVehicleInIntersection = true;
                    lanesWithVehiclesInIntersection.add(lane.id);
                    vehicleInIntersectionBox = true;
                } else {
                    vehicle.inIntersection = false;
                }
            });
        });
        
        // Store whether the intersection is currently empty or occupied
        this.intersectionClear = !vehicleInIntersectionBox;
        
        // Draw vehicles
        this.lanes.forEach(lane => {
            // Sort vehicles by position (furthest along the road first)
            const sortedVehicles = [...lane.vehicles].sort((a, b) => b.position - a.position);
            
            // Track if this is the green lane
            const isGreenLane = this.currentGreenLane === lane.id;
            
            // Track the distance between vehicles to prevent them from overlapping
            let prevVehiclePosition = Infinity;
            const minVehicleSpacing = 8; // Increased minimum spacing between vehicles
            
            sortedVehicles.forEach((vehicle, index) => {
                // Determine if this specific vehicle should move
                let shouldMove = false;
                
                // Case 1: Vehicle is past the intersection - always move
                if (vehicle.position > intersectionEnd) {
                    shouldMove = true;
                }
                // Case 2: Vehicle is in the intersection - always continue to move to clear the intersection
                else if (vehicle.position >= intersectionStart && vehicle.position <= intersectionEnd) {
                    shouldMove = true; // Once in intersection, always continue
                }
                // Case 3: Vehicle is before the intersection
                else if (vehicle.position < intersectionStart) {
                    // First, check how close the vehicle is to the intersection
                    const aboutToEnterIntersection = vehicle.position + vehicle.speed >= intersectionStart;
                    
                    // If vehicle is about to enter the intersection
                    if (aboutToEnterIntersection) {
                        // Only allow entry if:
                        // 1. This is the green lane
                        // 2. The intersection is completely clear
                        shouldMove = isGreenLane && this.intersectionClear;
                    } 
                    // If it's the green lane and not about to enter intersection, move freely
                    else if (isGreenLane) {
                        shouldMove = true;
                    }
                    // For vehicles far from intersection (regardless of light), allow movement
                    else {
                        const farFromIntersection = vehicle.position + vehicle.speed * 3 < intersectionStart;
                        if (farFromIntersection) {
                            shouldMove = true;
                        }
                    }
                }
                
                // Check if this vehicle would get too close to the vehicle in front
                if (shouldMove && index > 0 && sortedVehicles[index - 1]) {
                    const vehicleAhead = sortedVehicles[index - 1];
                    if (vehicleAhead.position - (vehicle.position + vehicle.speed) < minVehicleSpacing) {
                        // Too close to vehicle ahead, don't move or move slower
                        shouldMove = false;
                    }
                }

                // Move the vehicle if conditions are met
                if (shouldMove) {
                    vehicle.position += vehicle.speed;
                    
                    // Remove vehicle if it exits the screen
                    if (vehicle.position > 100) {
                        const idx = lane.vehicles.indexOf(vehicle);
                        if (idx > -1) {
                            lane.vehicles.splice(idx, 1);
                            
                            // Update UI counter
                            const countElement = document.getElementById(
                                vehicle.isEmergency ? `emergency-${lane.id}` : `regular-${lane.id}`
                            );
                            if (countElement) {
                                const currentCount = parseInt(countElement.textContent);
                                countElement.textContent = Math.max(0, currentCount - 1);
                            }
                        }
                        return;
                    }
                }
                
                // Draw vehicle
                this.drawVehicle(lane, vehicle);
            });
        });
    }
    
    /**
     * Draw a vehicle on the road
     */
    drawVehicle(lane, vehicle) {
        // Create a group for the vehicle
        const vehicleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Calculate position based on lane direction and vehicle position (0-100%)
        let x, y, width, height, rotate;
        
        const normalizedPos = vehicle.position / 100;
        
        switch (lane.direction) {
            case 'down':
                width = 24;
                height = 40;
                x = lane.entry.x - width / 2;
                y = lane.entry.y + normalizedPos * (lane.exit.y - lane.entry.y);
                rotate = 180;
                break;
            case 'left':
                width = 40;
                height = 24;
                x = lane.entry.x - normalizedPos * (lane.entry.x - lane.exit.x);
                y = lane.entry.y - height / 2;
                rotate = 90;
                break;
            case 'up':
                width = 24;
                height = 40;
                x = lane.entry.x - width / 2;
                y = lane.entry.y - normalizedPos * (lane.entry.y - lane.exit.y);
                rotate = 0;
                break;
            case 'right':
                width = 40;
                height = 24;
                x = lane.entry.x + normalizedPos * (lane.exit.x - lane.entry.x);
                y = lane.entry.y - height / 2;
                rotate = 270;
                break;
        }
        
        // Draw the vehicle based on its type
        if (vehicle.isEmergency) {
            // Ambulance shape
            this.drawAmbulance(vehicleGroup, x, y, width, height);
            
            // Add flashing effect for emergency vehicles
            // Create a semi-transparent flashing overlay for ambulance
            const flashOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            flashOverlay.setAttribute('x', x);
            flashOverlay.setAttribute('y', y);
            flashOverlay.setAttribute('width', width);
            flashOverlay.setAttribute('height', height);
            flashOverlay.setAttribute('fill', 'none');
            flashOverlay.setAttribute('stroke', '#ff0000');
            flashOverlay.setAttribute('stroke-width', '2');
            flashOverlay.setAttribute('opacity', '0.7');
            
            // Add animation to the overlay
            const animateEl = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateEl.setAttribute('attributeName', 'stroke');
            animateEl.setAttribute('values', '#ff0000;#0000ff;#ff0000');
            animateEl.setAttribute('dur', '0.8s');
            animateEl.setAttribute('repeatCount', 'indefinite');
            flashOverlay.appendChild(animateEl);
            
            vehicleGroup.appendChild(flashOverlay);
        } else {
            // Regular car shape
            this.drawCar(vehicleGroup, x, y, width, height);
        }
        
        // Apply rotation
        vehicleGroup.setAttribute('transform', `rotate(${rotate} ${x + width/2} ${y + height/2})`);
        
        // Add to the vehicle group
        this.vehicleGroup.appendChild(vehicleGroup);
    }
    
    drawCar(group, x, y, width, height) {
        // Create an SVG image element for the car
        const carImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        carImage.setAttribute('x', x);
        carImage.setAttribute('y', y);
        carImage.setAttribute('width', width);
        carImage.setAttribute('height', height);
        carImage.setAttribute('href', '/static/images/car.jpg');
        carImage.setAttribute('preserveAspectRatio', 'none');
        group.appendChild(carImage);
    }
    
    drawAmbulance(group, x, y, width, height) {
        // Create an SVG image element for the ambulance
        const ambulanceImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        ambulanceImage.setAttribute('x', x);
        ambulanceImage.setAttribute('y', y);
        ambulanceImage.setAttribute('width', width);
        ambulanceImage.setAttribute('height', height);
        ambulanceImage.setAttribute('href', '/static/images/ambulance.jpg');
        ambulanceImage.setAttribute('preserveAspectRatio', 'none');
        group.appendChild(ambulanceImage);
    }
    
    /**
     * Toggle auto simulation mode
     */
    toggleAutoMode(isAuto) {
        this.isAutoMode = isAuto;
        
        if (isAuto) {
            // Set the auto interval to 500ms (0.5 seconds) which is 1 second divided by 2
            // This matches the time_quantum in the scheduler.py file
            this.autoInterval = setInterval(() => {
                // When in auto mode, we need to ensure no collisions occur:
                
                // Option 1: Only step if the intersection is empty
                if (this.intersectionClear) {
                    this.step();
                    return;
                }
                
                // Option 2: If intersection is occupied, check which lane has vehicles in it
                // If it's the current green lane, continue to let vehicles cross
                let laneWithVehicleInIntersection = -1;
                
                this.lanes.forEach(lane => {
                    if (lane.hasVehicleInIntersection) {
                        laneWithVehicleInIntersection = lane.id;
                    }
                });
                
                if (laneWithVehicleInIntersection === this.currentGreenLane) {
                    // Green lane has a vehicle in intersection, let it complete crossing
                    this.step();
                }
                // Otherwise, don't step yet - wait for intersection to clear
                
            }, 500); // 0.5 seconds for time quanta (1 sec divided by 2)
        } else {
            clearInterval(this.autoInterval);
        }
    }
    
    /**
     * Reset the simulation
     */
    reset() {
        // Clear all vehicles
        this.lanes.forEach(lane => {
            lane.vehicles = [];
            lane.hasVehicleInIntersection = false;
        });
        
        // Reset UI
        for (let i = 0; i < 4; i++) {
            document.getElementById(`regular-${i}`).textContent = "0";
            document.getElementById(`emergency-${i}`).textContent = "0";
        }
        
        // Reset intersection status
        this.intersectionClear = true;
        
        // Reset green lane
        this.setGreenLane(-1);
        
        // Stop auto mode
        this.toggleAutoMode(false);
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        cancelAnimationFrame(this.animationFrameId);
        this.toggleAutoMode(false);
    }
    
    /**
     * Step the simulation
     */
    step() {
        // This function should trigger the backend call for the next simulation step
        // The implementation is in ui_controller.js
    }
}
