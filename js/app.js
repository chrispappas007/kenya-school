(function() {

  // mapbox access token for rgdonohue account
  L.mapbox.accessToken = 'pk.eyJ1Ijoicmdkb25vaHVlIiwiYSI6Im5Ua3F4UzgifQ.PClcVzU5OUj17kuxqsY_Dg';

  // create the Leaflet map using mapbox.light tiles
  var map = L.mapbox.map('map', 'mapbox.light', {
    zoomSnap: .1,
    center: [-.23, 37.8],
    zoom: 7,
    minZoom: 6,
    maxZoom: 9,
    maxBounds: L.latLngBounds([-6.22, 27.72], [5.76, 47.83])
  });

  function drawLegend(data) {

    // create Leaflet control for the legend
    var legend = L.control({
      position: 'bottomright'
    });
    // when added to the map
    legend.onAdd = function(map) {

      // select the element with id of 'legend'
      var div = L.DomUtil.get("legend");

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      // add legend to the control
      return div;

    }
    // add the control to the map
    legend.addTo(map);
    //Create an array to hold data values
    var dataValues = [];

    data.features.map(function(school) {

      for (var grade in school.properties) {

        var attribute = school.properties[grade];
        //if the value is a number
        if (Number(attribute)) {
          //add it to the array
          dataValues.push(attribute);
        }

      }
    });

    // sort our array
    var sortedValues = dataValues.sort(function(a, b) {
      return b - a;
    });

    // round the highest number and use as our large circle diameter
    var maxValue = Math.round(sortedValues[0] / 1000) * 1000;

    // calc the diameters
    var largeDiameter = calcRadius(maxValue) * 2,
      smallDiameter = largeDiameter / 2;

    // select our circles container and set the height
    $(".legend-circles").css('height', largeDiameter.toFixed());

    // set width and height for large circle
    $('.legend-large').css({
      'width': largeDiameter.toFixed(),
      'height': largeDiameter.toFixed()
    });
    // set width and height for small circle and position
    $('.legend-small').css({
      'width': smallDiameter.toFixed(),
      'height': smallDiameter.toFixed(),
      'top': largeDiameter - smallDiameter,
      'left': smallDiameter / 2
    })

    // label the max and median value
    $(".legend-large-label").html(maxValue);
    $(".legend-small-label").html((maxValue / 2));

    // adjust the position of the large based on size of circle
    $(".legend-large-label").css({
      'top': -11,
      'left': largeDiameter + 30,
    });

    // adjust the position of the large based on size of circle
    $(".legend-small-label").css({
      'top': smallDiameter - 11,
      'left': largeDiameter + 30
    });

    // insert a couple hr elements and use to connect value label to top of each circle
    $("<hr class='large'>").insertBefore(".legend-large-label")
    $("<hr class='small'>").insertBefore(".legend-small-label").css('top', largeDiameter - smallDiameter - 8);

  }

  // load CSV data
  omnivore.csv('data/kenya_education_2014.csv')
    //When the map first loads, convert data to geoJson object
    .on('ready', function(e) {
      drawMap(e.target.toGeoJSON());
      drawLegend(e.target.toGeoJSON())
    })
    //If there's an error, dislay an error message in console
    .on('error', function(e) {
      console.log(e.error[0].message);
    }); // add to map
    //draw inital circleMarkers
  var options = {
    pointToLayer: function(feature, ll) {
      return L.circleMarker(ll, {
        opacity: 1,
        weight: 2,
        fillOpacity: 0,
      })
    }
  }


  function drawMap(data) {
    //log geoJson data to console for inspection
    console.log(data);
    //create variables to hold data parsed by gender
    var girlsLayer = L.geoJson(data, options).addTo(map);
    var boysLayer = L.geoJson(data, options).addTo(map);
    //set colors
    girlsLayer.setStyle({
      color: '#D96D02',
    });
    boysLayer.setStyle({
      color: '#6E77B0',
    });
    //fit map to data
    map.fitBounds(girlsLayer.getBounds());
    //call slider function
    sequenceUI(girlsLayer, boysLayer, 1);
    //call grade box function
    addGrade(boysLayer, 1);
    //call resize circles function
    resizeCircles(girlsLayer, boysLayer, 1);
    //call info box function
    retreiveInfo(boysLayer, 1);

  }
  //calculate radius of each circle marker
  function calcRadius(val) {
    var radius = Math.sqrt(val / Math.PI);
    return radius * .5; // adjust .5 as a scale factor
  }
  //resize each circle marker based on current grade
  function resizeCircles(girlsLayer, boysLayer, currentGrade) {

    girlsLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['G' + currentGrade]));
      layer.setRadius(radius);
    });
    boysLayer.eachLayer(function(layer) {
      var radius = calcRadius(Number(layer.feature.properties['B' + currentGrade]));
      layer.setRadius(radius);
    });
  }

  function sequenceUI(girlsLayer, boysLayer, currentGrade) {

    // create Leaflet control for the slider
    var sliderControl = L.control({
      position: 'bottomleft'
    });
    // when added to the map
    sliderControl.onAdd = function(map) {

      // select the element with id of 'slider'
      var controls = L.DomUtil.get("slider");

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(controls);
      L.DomEvent.disableClickPropagation(controls);

      // add slider to the control
      return controls;

    }

    // add the control to the map
    sliderControl.addTo(map);
    //jquery request to select the slider element
    $('.slider')
      .on('input change', function() { //When the slider selects a new grade
        var currentGrade = $(this).val(); //push the newly selected grade to currentGrade
        //call the functions below sending the layer and newly selected grade as arguments
        resizeCircles(girlsLayer, boysLayer, currentGrade);
        addGrade(boysLayer, currentGrade);
        retreiveInfo(boysLayer, currentGrade);
      });
  }

  function addGrade(boysLayer, currentGrade) {
    //create Leaflet control object for the grade box
    var gradeBox = L.control({
      position: 'bottomleft'
    });
    //when added to the map
    gradeBox.onAdd = function(map) {

      // select the element with id of 'grade'
      var div = L.DomUtil.get("grade");

      // disable the mouse events
      L.DomEvent.disableScrollPropagation(div);
      L.DomEvent.disableClickPropagation(div);

      // add grade box to the control
      return div;

    }
    //add it to the map
    gradeBox.addTo(map);
    //jquery request to select the slider
    $('.slider')
      //when the slider selects a new grade
      .on('input change', function(e) {
        //push that new grade to currentGrade
        var currentGrade = $(this).val();
        //select the grade div element
        var grade = $('.grade')
        //populate that element
        grade.show();
        //select the .grade span tag and populate with currentGrade
        $('.grade span').html('Grade: ' + currentGrade);

      })
  }

  function retreiveInfo(boysLayer, currentGrade) {
    //variable of selected info
    var info = $('#info');
    //when mouse hovers
    boysLayer.on('mouseover', function(e) {
      //draw the box
      info.removeClass('none').show();
      //variable to hold feature info
      var props = e.layer.feature.properties;
      //populate box with below info
      $('#info span').html(props.COUNTY);
      $(".girls span:first-child").html('(grade ' + currentGrade + ')');
      $(".boys span:first-child").html('(grade ' + currentGrade + ')');
      $(".girls span:last-child").html(props['G' + currentGrade]);
      $(".boys span:last-child").html(props['B' + currentGrade]);

      // raise opacity level as visual affordance
      e.layer.setStyle({
        fillOpacity: .6
      });
      //create arrays to hold data
      var girlsValues = [],
        boysValues = [];

      //call a for loop to cycle through layers and add data to array
      for (var i = 1; i <= 8; i++) {
        girlsValues.push(props['G' + i]);
        boysValues.push(props['B' + i]);
      }
      //draw girls sparkline graph
      $('.girlspark').sparkline(girlsValues, {
        width: '160px',
        height: '30px',
        lineColor: '#D96D02',
        fillColor: '#d98939 ',
        spotRadius: 0,
        lineWidth: 2
      });
      //draw boys sparkline graph 
      $('.boyspark').sparkline(boysValues, {
        width: '160px',
        height: '30px',
        lineColor: '#6E77B0',
        fillColor: '#878db0',
        spotRadius: 0,
        lineWidth: 2
      });

    });

    // hide the info panel when mousing off layergroup and remove affordance opacity
    boysLayer.on('mouseout', function(e) {
      info.hide();
      e.layer.setStyle({
        fillOpacity: 0
      });
    });

    // when the mouse moves on the document
    $(document).mousemove(function(e) {
      // first offset from the mouse position of the info window
      info.css({
        "info": e.pageX + 6,
        "info": e.pageY - info.height() - 25
      });

      // if it crashes into the top, flip it lower right
      if (info.offset().top < 4) {
        info.css({
          "info": e.pageY + 15
        });
      }
      // if it crashes into the right, flip it to the left
      if (info.offset().left + info.width() >= $(document).width() - 40) {
        info.css({
          "info": e.pageX - info.width() - 80
        });
      }
    });
  }

})();
