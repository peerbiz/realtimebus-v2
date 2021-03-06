'use strict';

const database = require("../../database/database");
const logger = require('../../util/logger');
const utils = require("../../util/utils");

const PositionsApp = require("../../model/realtime/PositionsApp");

const GtfsRealtimeBindings = require('gtfs-realtime-bindings');

module.exports.tripUpdate = function (req, res) {
    database.connect()
        .then(client => {
            return Promise.resolve()
                .then(() => {
                    let positions = new PositionsApp(client);
                    return positions.getBuses();
                })
                .then(positions => {
                    let buses = positions.buses;

                    let message = new GtfsRealtimeBindings.FeedMessage();

                    let header = new GtfsRealtimeBindings.FeedHeader();
                    header.gtfs_realtime_version = "2.0";
                    header.incrementality = 0;
                    header.timestamp = new Date().getTime() / 1000;

                    let entities = [];

                    for (let bus of buses) {
                        let vehicleDescriptor = new GtfsRealtimeBindings.VehicleDescriptor();
                        vehicleDescriptor.id = bus.vehicle;

                        let tripDescriptor = new GtfsRealtimeBindings.TripDescriptor();
                        tripDescriptor.trip_id = bus.trip;
                        tripDescriptor.route_id = bus.line_id;

                        let tripUpdate = new GtfsRealtimeBindings.TripUpdate();
                        tripUpdate.trip = tripDescriptor;
                        tripUpdate.vehicle = vehicleDescriptor;
                        tripUpdate.delay = bus.delay_min * 60;
                        tripUpdate.timestamp = bus.updated_at;

                        let entity = new GtfsRealtimeBindings.FeedEntity();
                        entity.id = bus.vehicle;
                        entity.trip_update = tripUpdate;

                        entities.push(entity);
                    }

                    message.header = header;
                    message.entity = entities;

                    return message.encode().toBuffer();
                })
                .then(buffer => {
                    res.status(200).header("Content-Type", "application/x-protobuf").send(buffer);

                    client.release()
                })
                .catch(error => {
                    logger.error(error);
                    utils.respondWithError(res, error);

                    client.release()
                })
        })
        .catch(error => {
            logger.error(`Error acquiring client: ${error}`);

            utils.respondWithError(error);
            utils.handleError(error)
        })
};

module.exports.vehiclePosition = function (req, res) {
    database.connect()
        .then(client => {
            return Promise.resolve()
                .then(() => {
                    let positions = new PositionsApp(client);
                    return positions.getBuses();
                })
                .then(positions => {
                    let buses = positions.buses;

                    let message = new GtfsRealtimeBindings.FeedMessage();

                    let header = new GtfsRealtimeBindings.FeedHeader();
                    header.gtfs_realtime_version = "1.0";
                    header.incrementality = 0;
                    header.timestamp = new Date().getTime() / 1000;

                    let entities = [];

                    for (let bus of buses) {
                        let position = new GtfsRealtimeBindings.Position();
                        position.latitude = bus.latitude;
                        position.longitude = bus.longitude;

                        let vehicleDescriptor = new GtfsRealtimeBindings.VehicleDescriptor();
                        vehicleDescriptor.id = bus.vehicle;

                        let tripDescriptor = new GtfsRealtimeBindings.TripDescriptor();
                        tripDescriptor.trip_id = bus.trip;
                        tripDescriptor.route_id = bus.line_id;

                        let vehiclePosition = new GtfsRealtimeBindings.VehiclePosition();
                        vehiclePosition.position = position;
                        vehiclePosition.vehicle = vehicleDescriptor;
                        vehiclePosition.stop_id = bus.bus_stop;
                        vehiclePosition.timestamp = bus.updated_at;
                        vehiclePosition.trip = tripDescriptor;

                        let entity = new GtfsRealtimeBindings.FeedEntity();
                        entity.id = bus.vehicle;
                        entity.vehicle = vehiclePosition;

                        entities.push(entity);
                    }

                    message.header = header;
                    message.entity = entities;

                    return message.encode().toBuffer();
                })
                .then(buffer => {
                    res.status(200).header("Content-Type", "application/x-protobuf").send(buffer);

                    client.release()
                })
                .catch(error => {
                    logger.error(error);
                    utils.respondWithError(res, error);

                    client.release()
                })
        })
        .catch(error => {
            logger.error(`Error acquiring client: ${error}`);

            utils.respondWithError(error);
            utils.handleError(error)
        })
};