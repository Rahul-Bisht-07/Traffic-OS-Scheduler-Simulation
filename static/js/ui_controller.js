/**
 * ui_controller.js
 * Handles UI interactions and communication with the backend
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulation
    const simulation = new TrafficSimulation();
    
    // UI Elements
    const uploadForm = document.getElementById('uploadForm');
    const manualInputForm = document.getElementById('manualInputForm');
    const stepBtn = document.getElementById('stepBtn');
    const autoBtn = document.getElementById('autoBtn');
    const resetBtn = document.getElementById('resetBtn');
    const algorithmBadge = document.getElementById('algorithmBadge');
    const statusBadge = document.getElementById('statusBadge');
    const logContainer = document.getElementById('logContainer');
    
    // Flag to track if auto mode is active
    let isAutoMode = false;
    
    /**
     * Add a log entry to the log container
     */
    function addLogEntry(message) {
        const logEntry = document.createElement('p');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    /**
     * Update the algorithm badge
     */
    function updateAlgorithmBadge(algorithm) {
        algorithmBadge.textContent = algorithm;
        
        // Change badge color based on algorithm
        if (algorithm === 'Priority Scheduling') {
            algorithmBadge.className = 'badge bg-danger me-2';
        } else if (algorithm === 'Shortest Job First') {
            algorithmBadge.className = 'badge bg-success me-2';
        } else {
            algorithmBadge.className = 'badge bg-primary me-2';
        }
    }
    
    /**
     * Update the status badge
     */
    function updateStatusBadge(status) {
        statusBadge.textContent = status;
        
        // Change badge color based on status
        if (status === 'Running') {
            statusBadge.className = 'badge bg-success';
        } else if (status === 'Error') {
            statusBadge.className = 'badge bg-danger';
        } else {
            statusBadge.className = 'badge bg-info';
        }
    }
    
    /**
     * Handle vehicle detection form submission
     */
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Update status
        updateStatusBadge('Processing');
        addLogEntry('Processing images for vehicle detection...');
        
        // Create FormData object
        const formData = new FormData(uploadForm);
        
        // Send the images to the backend for processing
        fetch('/detect', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update algorithm badge
            updateAlgorithmBadge(data.current_algorithm);
            
            // Update lane data
            simulation.updateLanesFromData(data.lane_data);
            
            // Set green lane
            simulation.setGreenLane(data.next_green_lane);
            
            // Log detection results
            addLogEntry(`Vehicle detection complete. Algorithm: ${data.current_algorithm}`);
            Object.entries(data.detection_results).forEach(([lane, result]) => {
                addLogEntry(`${lane} lane: ${result.regular_count} regular, ${result.emergency_count} emergency vehicles`);
            });
            
            // Enable simulation controls
            stepBtn.disabled = false;
            autoBtn.disabled = false;
            resetBtn.disabled = false;
            
            // Update status
            updateStatusBadge('Ready');
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry(`Error: ${error.message}`);
            updateStatusBadge('Error');
        });
    });
    
    /**
     * Handle step button click
     */
    stepBtn.addEventListener('click', function() {
        simulateStep();
    });
    
    /**
     * Handle auto button click
     */
    autoBtn.addEventListener('click', function() {
        isAutoMode = !isAutoMode;
        
        if (isAutoMode) {
            // Change button text and appearance
            autoBtn.innerHTML = '<i class="fas fa-pause me-1"></i> Pause';
            autoBtn.className = 'btn btn-warning me-2';
            
            // Start auto simulation
            simulation.toggleAutoMode(true);
            updateStatusBadge('Running');
            addLogEntry('Auto simulation started');
        } else {
            // Change button text and appearance
            autoBtn.innerHTML = '<i class="fas fa-play me-1"></i> Auto';
            autoBtn.className = 'btn btn-success me-2';
            
            // Stop auto simulation
            simulation.toggleAutoMode(false);
            updateStatusBadge('Ready');
            addLogEntry('Auto simulation paused');
        }
    });
    
    /**
     * Handle reset button click
     */
    resetBtn.addEventListener('click', function() {
        // Reset the simulation
        simulation.reset();
        
        // Reset UI
        updateStatusBadge('Ready');
        updateAlgorithmBadge('Round Robin');
        autoBtn.innerHTML = '<i class="fas fa-play me-1"></i> Auto';
        autoBtn.className = 'btn btn-success me-2';
        isAutoMode = false;
        
        // Add log entry
        addLogEntry('Simulation reset');
        
        // Reset simulation on the backend
        fetch('/reset', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                addLogEntry('Backend reset complete');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry(`Error during reset: ${error.message}`);
        });
    });
    
    /**
     * Simulate a step in the traffic simulation
     */
    function simulateStep() {
        // Update status
        updateStatusBadge('Running');
        addLogEntry('Simulating step...');
        
        // Prepare current lane data to send to backend
        const laneData = [];
        for (let i = 0; i < 4; i++) {
            laneData.push({
                vehicle_count: parseInt(document.getElementById(`regular-${i}`).textContent),
                emergency_count: parseInt(document.getElementById(`emergency-${i}`).textContent)
            });
        }
        
        // Get intersection status from simulation
        // This tells the backend if vehicles have completed crossing the intersection
        const intersectionClear = simulation.intersectionClear !== undefined ? simulation.intersectionClear : true;
        
        // Check if any lane has a vehicle in the intersection
        const lanesWithVehiclesInIntersection = [];
        simulation.lanes.forEach(lane => {
            if (lane.hasVehicleInIntersection) {
                lanesWithVehiclesInIntersection.push(lane.id);
            }
        });
        
        // Send the request to the backend
        fetch('/simulate_step', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lanes: laneData,
                intersection_clear: intersectionClear,
                vehicles_in_intersection: lanesWithVehiclesInIntersection
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update algorithm badge
            updateAlgorithmBadge(data.current_algorithm);
            
            // Set green lane
            simulation.setGreenLane(data.next_green_lane);
            
            // Log step results
            addLogEntry(`Step complete. Green lane: ${data.lane_data[data.next_green_lane].name}, Algorithm: ${data.current_algorithm}`);
            
            // Update status
            if (!isAutoMode) {
                updateStatusBadge('Ready');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry(`Error: ${error.message}`);
            updateStatusBadge('Error');
            
            // Stop auto mode on error
            if (isAutoMode) {
                autoBtn.click();
            }
        });
    }
    
    /**
     * Handle manual input form submission
     */
    manualInputForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Update status
        updateStatusBadge('Processing');
        addLogEntry('Processing manual vehicle counts...');
        
        // Gather lane data from form
        const laneData = [
            {
                regular_count: parseInt(document.getElementById('northRegular').value) || 0,
                emergency_count: parseInt(document.getElementById('northEmergency').value) || 0
            },
            {
                regular_count: parseInt(document.getElementById('eastRegular').value) || 0,
                emergency_count: parseInt(document.getElementById('eastEmergency').value) || 0
            },
            {
                regular_count: parseInt(document.getElementById('southRegular').value) || 0,
                emergency_count: parseInt(document.getElementById('southEmergency').value) || 0
            },
            {
                regular_count: parseInt(document.getElementById('westRegular').value) || 0,
                emergency_count: parseInt(document.getElementById('westEmergency').value) || 0
            }
        ];
        
        // Send the data to the backend
        fetch('/manual_input', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lanes: laneData
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update algorithm badge
            updateAlgorithmBadge(data.current_algorithm);
            
            // Update lane data
            simulation.updateLanesFromData(data.lane_data);
            
            // Set green lane
            simulation.setGreenLane(data.next_green_lane);
            
            // Log results
            addLogEntry(`Manual input processed. Algorithm: ${data.current_algorithm}`);
            data.lane_data.forEach(lane => {
                addLogEntry(`${lane.name} lane: ${lane.vehicle_count} regular, ${lane.emergency_count} emergency vehicles`);
            });
            
            // Enable simulation controls
            stepBtn.disabled = false;
            autoBtn.disabled = false;
            resetBtn.disabled = false;
            
            // Update status
            updateStatusBadge('Ready');
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry(`Error: ${error.message}`);
            updateStatusBadge('Error');
        });
    });

    // Assign step function to simulation
    simulation.step = simulateStep;
    
    // Initialize log
    addLogEntry('Traffic Signal Scheduler initialized');
});
