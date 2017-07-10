'use strict';

class FeatureList {

    constructor() {
        this.features = []
    }

    add(properties, geometry) {
        let feature = {
            type: "Feature",
            geometry: geometry,
            properties: properties
        };

        this.features.push(feature);
    }

    getFeatures() {
        return this.features;
    }

    static createFromGeoJson(json) {
        return FeatureList.createFromArray(json)
    }

    static createFromArray(array) {
        if (!array.hasOwnProperty("features")) {
            throw("Supplied JSON does not contain required object 'features'");
        }

        let instance = new FeatureList();
        let features = array.features;

        for (let i in features) {
            instance.add(features[i].properties, features[i].geometry)
        }

        return instance;
    }
}

module.exports = FeatureList;