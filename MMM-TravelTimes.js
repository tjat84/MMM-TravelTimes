Module.register("MMM-TravelTimes", {
    // Default module configuration
    defaults: {
        origin: "YOUR_ORIGIN_ADDRESS",
        apiKey: "YOUR_API_KEY",
        trainStation: "YOUR_TRAIN_STATION_ADDRESS",
        workAddress: "YOUR_WORK_ADDRESS",
        schoolAddress: "school_addr",  // Address for the school
        updateInterval: 10 * 60 * 1000 // Update every 10 minutes
    },

    start: function() {
        this.results = null;
        this.sendSocketNotification('FETCH_TRAVEL_TIMES', this.config);
        setInterval(() => {
            this.sendSocketNotification('FETCH_TRAVEL_TIMES', this.config);
        }, this.config.updateInterval);
    },
    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "MMM-TravelTimes";
    
        if (this.results && this.results.schoolDrive) {
            // Drive to School Box
            const driveBox = document.createElement("div");
            driveBox.className = this.results.schoolDrive.status;  // Apply the status as a class name
    
            const carIcon = document.createElement("i");
            carIcon.className = "fa fa-car";
            driveBox.appendChild(carIcon);
    
            const driveTimeDiv = document.createElement("div");
            driveTimeDiv.className = "commute-time";
            driveTimeDiv.textContent = this.results.schoolDrive.duration;
            driveBox.appendChild(driveTimeDiv);
    
            const driveLabelDiv = document.createElement("div");
            driveLabelDiv.className = "commute-label";
            driveLabelDiv.textContent = "Drive to School";
            driveBox.appendChild(driveLabelDiv);
    
            wrapper.appendChild(driveBox);
        }
    
        if (this.results && this.results.combinedDriveAndTransit) {
            // Commute to Work Box (with combined time)
            const commuteBox = document.createElement("div");
            commuteBox.className = `transit ${this.results.combinedDriveAndTransit.status}`;  // Apply the status and keep the 'transit' class
    
            const trainIcon = document.createElement("i");
            trainIcon.className = "fa fa-train";
            commuteBox.appendChild(trainIcon);
    
            const commuteTimeDiv = document.createElement("div");
            commuteTimeDiv.className = "commute-time";
            commuteTimeDiv.textContent = this.results.combinedDriveAndTransit.duration;
            commuteBox.appendChild(commuteTimeDiv);
    
            const commuteLabelDiv = document.createElement("div");
            commuteLabelDiv.className = "commute-label";
            commuteLabelDiv.textContent = "Commute to Work";
            commuteBox.appendChild(commuteLabelDiv);
    
            wrapper.appendChild(commuteBox);
        }
    
        return wrapper;
    },
    
    

    socketNotificationReceived: function(notification, payload) {
        if (notification === "TRAVEL_TIMES_RESULT") {
            this.results = payload;
            this.updateDom();
        }
    }
});
