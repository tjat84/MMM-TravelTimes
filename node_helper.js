const NodeHelper = require('node_helper');
const fetch = require('node-fetch');

module.exports = NodeHelper.create({
    start: function() {
        console.log('MMM-TravelTimes helper started...');
    },

    fetchDirections: function(origin, destination, mode) {
        const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${this.config.apiKey}`;
        return fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.routes && data.routes.length > 0 && data.routes[0].legs && data.routes[0].legs.length > 0) {
                    const leg = data.routes[0].legs[0];
                    return {
                        mode: mode,
                        origin: origin,
                        destination: destination,
                        distance: leg.distance.text,
                        duration: leg.duration.text
                    };
                } else {
                    throw new Error('No routes found');
                }
            });
    },

    socketNotificationReceived: function(notification, config) {
        if (notification === 'FETCH_TRAVEL_TIMES') {
            this.config = config;
            
            // Fetch driving directions to school
            const schoolDrive = this.fetchDirections(this.config.origin, this.config.schoolAddress, 'driving');

            // Fetch driving directions to the train station
            const driveToTrainStation = this.fetchDirections(this.config.origin, this.config.trainStation, 'driving');
            
            // Fetch transit directions from the train station to work
            const transitToWork = this.fetchDirections(this.config.trainStation, this.config.workAddress, 'transit');

            Promise.all([schoolDrive, driveToTrainStation, transitToWork])
            .then(results => {
                // Validate the structure of the results
                if (results.every(result => result && result.distance && result.duration)) {
                    // Process and combine the results
                    const combinedDriveAndTransit = {
                        distance: results[1].distance + " + " + results[2].distance,  // Combine the distances
                        duration: (parseFloat(results[1].duration) + parseFloat(results[2].duration)).toString() + " mins" // Combine the durations
                    };

                // Expected times and thresholds
                const expectedDriveToSchool = 50;
                const slightDelaySchool = 10;  
                const expectedCommuteToWork = 65;
                const slightDelayWork = 15;  

                let status;

                // For drive to school
                let fetchedDriveTime = parseFloat(results[0].duration);
                if (fetchedDriveTime < expectedDriveToSchool) {
                    status = "on-time";
                } else if (fetchedDriveTime <= expectedDriveToSchool + slightDelaySchool) {
                    status = "slight-delay";
                } else {
                    status = "long-delay";
                }
                results[0].status = status;

                // For commute to work (combined drive + transit time)
                let fetchedCommuteTime = parseFloat(combinedDriveAndTransit.duration);
                if (fetchedCommuteTime < expectedCommuteToWork) {
                    status = "on-time";
                } else if (fetchedCommuteTime <= expectedCommuteToWork + slightDelayWork) {
                    status = "slight-delay";
                } else {
                    status = "long-delay";
                }
                combinedDriveAndTransit.status = status;

                    this.sendSocketNotification('TRAVEL_TIMES_RESULT', {
                        schoolDrive: results[0],
                        combinedDriveAndTransit: combinedDriveAndTransit
                    });
                } else {
                    console.error("Unexpected data structure:", results);
                }
            })
            .catch(error => {
                console.error("Error fetching or processing travel times:", error);
            });
        
        }
    }
});
