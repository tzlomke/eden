var db = require("../models");
var axios = require("axios");
var cheerio = require("cheerio");
var passport = require("passport");

// save userId for future use
var userId;

module.exports = function (app) {
	// Load index page
	app.get("/", function (req, res) {
		res.render("index");
	});

	// Auth Get Routes
	app.get("/signup", function (req, res) {
		res.render("signup", {
			error: req.session.error
		});
		delete req.session.error;
	});
	app.get("/signin", function (req, res) {
		console.log(req.session.error);
		res.render("signin", {
			error: req.session.error
		});
		delete req.session.error;
	});
	app.get("/logout", function (req, res) {
		req.session.destroy(function () {
			res.redirect("/");
		});
	});

	// User's Garden
	app.get("/mygarden/:username", isLoggedIn, function (req, res) {
		// save userId for add plant
		userId = req.user.id;

		db.User.findOne({
			where: {
				id: req.user.id
			},
			include: [db.Plant, db.Event]
		}).then(function (data) {
			var hbsObject1 = data.dataValues.Plants;
			var hbsObject2 = data.dataValues.Events;
			var hbsObject3 = {
				id: req.user.id,
				username: req.user.username
			};
			res.render("mygarden", {
				myPlants: hbsObject1,
				myEvents: hbsObject2,
				dataUser: hbsObject3
			});
		});
	});

	// route for searching plants on garden.org
	app.get("/searchPlant/:plantName", function (req, res) {
		// call to garden.org for plant search
		axios.get("https://garden.org/plants/search/text/?q=" + req.params.plantName).then(function (body) {
			// scrape html for possible plant names and links
			var $ = cheerio.load(body.data);

			// save plant names
			var plantOptions = $("tr").text().split(")");

			// save links
			var plantLinks = [];
			$("td a").each(function (i, elm) {
				// $(this).remove();
				plantLinks.push($(this).attr("href"));
			});
			// remove duplicates from links
			var uniquePlantLinks = [];
			for (i = 0; i < plantLinks.length; i++) {
				if (uniquePlantLinks.indexOf(plantLinks[i]) === -1) {
					uniquePlantLinks.push(plantLinks[i]);
				}
			}

			// save data as object
			var searchOptions = [];
			for (i = 0; i < plantOptions.length; i++) {
				var plant = {
					plantName: plantOptions[i] + ")",
					link: uniquePlantLinks[i]
				};
				searchOptions.push(plant);
			}
			var possiblePlants = {
				plants: searchOptions
			};

			//render search options in my garden view
			res.send(possiblePlants);
		});
	});

	// route for adding new plant from garden.org to plants table in database
	app.post("/addPlant", function (req, res) {
		// if no common or scientific name provided
		if (!req.body.plantName) {
			// add plant to database
			return db.Plant.create({
				personal_name: req.body.personalName,
				UserId: userId
			}).then(function (data) {
				// send plant view to front end for redirect
				res.send("/plants/" + data.id);
			});
		}
		// call to garden.org for plant info
		axios.get("https://garden.org" + req.body.link)
			.then(function (body) {
				// scrape html for plant info tables
				var $ = cheerio.load(body.data);

				// find general info table (last table)
				var generalTableIndex = $("body").find(".simple-table").length - 1;
				// save  general info table
				var plantInfoTables = "";
				$(".simple-table").each(function (i, elm) {
					if (i === generalTableIndex) {
						plantInfoTables += $(this).html();
					}
				});

				// save img of plant
				var plantImg = "https://garden.org" + $("center img").attr("src");

				// add plant and info to database
				db.Plant.create({
					plant_name: req.body.plantName,
					personal_name: req.body.personalName,
					data: plantInfoTables,
					image_path: plantImg,
					UserId: userId
				}).then(function (data) {
					// send plant view to front end for redirect
					res.send("/plants/" + data.id);
				});
			});
	});

	// View Plant Route
	app.get("/plants/:id", function (req, res) {
		db.Plant.findOne({
			where: {
				id: req.params.id
			},
			include: db.User
		}).then(function (data) {
			var hbsObject = data.dataValues;
			res.render("plants", {
				plant: hbsObject
			});
		});
	});

	// Signup Post Routes
	app.post("/signup", function (req, res, next) {
		passport.authenticate("local-signup", function (err, user, info) {
			if (err) {
				return next(err);
			}
			if (!user) {
				req.session.error = "Email is invalid or username is already taken";
				var error = req.session.error;
				return (error, res.redirect("/signup"));
			}
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return res.redirect("/mygarden/" + user.username);
			});
		})(req, res, next);
	});

	// Signin Post Route
	app.post("/signin", function (req, res, next) {
		passport.authenticate("local-signin", function (err, user, info) {
			if (err) {
				return next(err);
			}
			if (!user) {
				req.session.error = "Incorrect username or password";
				var error = req.session.error;
				return (error, res.redirect("/signin"));
			}
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return (res.redirect("/mygarden/" + user.username));
			});
		})(req, res, next);
	});

	// Render 404 page for any unmatched routes
	app.get("*", function (req, res) {
		res.render("404");
	});
};

// Checks to see if user is logged in. If not, "mygarden" is not accessible
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	// If not signed in, redirect to signin page
	res.redirect("/signin");
}