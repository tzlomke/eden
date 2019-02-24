// save variables for future use
var personalName;

// when they click on add a plant
$("#addAPlant").on("click", function (event) {
	event.preventDefault();
	// save inputs from form
	var plantName = $("#plantName").val().trim();
	personalName = $("#personalName").val().trim();

	// if no names provided
	if (plantName.length === 0 && personalName.length === 0) {
		return alert("To add a plant, you must enter a common/scientific name or a personal name");
	}

	// if no common or scientific name
	if (plantName.length === 0) {
		// post request to add plant to database
		$.post("/addPlant", {
			personalName: personalName
		}).then(function (res) {
			console.log("plant added to garden");

			// redirect to plant view
			window.location.href = res;
		});
		// if common or scientific name is provided
	} else {
		// pull up modal
		$(".add-plant-modal").css("display", "block");

		// get request to search garden.org for plant
		$.get("/searchplant/" + plantName).then(function (res) {
			console.log(res.plants);
			// loop over search results and append to modal table
			for (i = 0; i < res.plants.length - 1; i++) {
				var newRow = $("<tr data-link=" + res.plants[i].link + " class='possiblePlant'></tr>");
				var newCell = $("<td>" + res.plants[i].plantName + "</td>");
				newRow.append(newCell);
				$("#possiblePlantsTable").append(newRow);
			}

			// remove search message
			$("#searchMessage").remove();
		});
	}
});


$(document.body).on("click", ".possiblePlant", function () {
	// save info for post request
	var link = $(this).attr("data-link");
	var plantName = $(this).text();
	var plant = {
		plantName: plantName,
		personalName: personalName,
		link: link
	};
	// post request for plant info and add plant to database
	$.post("/addPlant", plant, function (res) {
		console.log("adding plant to your garden");

		// redirect to plant view
		window.location.href = res;
	});
	// hide modal
	$(".modal").css("display", "none");
});