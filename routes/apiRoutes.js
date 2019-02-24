var db = require("../models");

module.exports = function (app) {

	// Get all plants
	app.get("/api/plants", function (req, res) {
		db.Plant.findAll({}).then(function (dbPlants) {
			res.json(dbPlants);
		});
	});

	// Add a plant to database
	app.post("/api/plants", function (req, res) {
		db.Plant.create(req.body).then(function (dbPlants) {
			res.json(dbPlants);
		});
	});

	// Add Event to Calendar Post Route
	app.post("/api/events", function (req, res) {
		db.Event.create(req.body).then(function (dbEvents) {
			res.json(dbEvents);
		});
	});

	// Get User Events
	app.get("/api/events/:id", function(req, res) {
		// console.log(req.user.id);
		db.Event.findAll({
			where: {
				UserId: req.params.id
			}
		}).then(function(dbEvents) {
			res.json(dbEvents);
		});
	});

	// Delete Event by ID
	app.delete("/api/events/:id&:event_name&:event_type", function(req, res) {
		db.Event.destroy({
			where: {
				UserId: req.params.id,
				event_name: req.params.event_name,
				event_type: req.params.event_type
			}
		}).then(function(dbEvent) {
			res.json(dbEvent);
		});
	});

	// Delete an plant by id
	app.delete("/api/plants/:id", function (req, res) {
		db.Plant.destroy({
			where: {
				id: req.params.id
			}
		}).then(function (dbPlant) {
			res.json(dbPlant);
		});
	});
};