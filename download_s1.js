// Define the area of interest (AOI) as Austin, Texas with a rectangular buffer
var austinCoords = ee.Geometry.Point([-98.46, 30.18]);
var bufferSize = 60000; // 10 km

// Create a rectangular buffer around the point
var aoi = austinCoords.buffer(bufferSize).bounds();

Map.addLayer(aoi, {}, 'AOI - Austin');
Map.centerObject(aoi, 11);

// Define start and end date
var startDate = ee.Date('2014-01-01');
var endDate = ee.Date('2023-12-31');

// Get the list of dates with available Dynamic World images

var s1imageCollection = ee.ImageCollection("COPERNICUS/S1_GRD")
                        .filterBounds(aoi)
                        .filterDate(startDate, endDate);

var dates = s1imageCollection.aggregate_array('system:time_start')
                            .map(function(date) {
                              return ee.Date(date).format('YYYY-MM-dd');
                            });

dates.evaluate(function(datesList) {
  // Loop through each date and process images
  datesList.forEach(function(date) {
    var dateStart = ee.Date(date);
    var dateEnd = dateStart.advance(1, 'day');

    // Filter images for the specific date

        // Filter images for the specific date
    var s1dailyImages = s1imageCollection
                      .filterDate(dateStart, dateEnd)
                      .median()
                      .clip(aoi);

    // Select Water and Flooded Vegetation Bands
    var s1water = s1dailyImages.select('VV').rename('VV');

    // Add the Water and Flooded Vegetation Layers to the Map with improved palettes

    Map.addLayer(s1water, {min: 0, max: 1, palette: ['0000FF', '00FFFF', 'ADD8E6']}, 'S1_VV ' + date);
    // Export Water and Flooded Vegetation images to Google Drive as GeoTIFF

    Export.image.toDrive({
      image: s1water,
      description: 's1_VV_gillespie_' + date + '_GeoTIFF',
      folder: 'flood',
      scale: 10,
      region: aoi,
      maxPixels: 1e13,
      fileFormat: 'GeoTIFF'
    });



  });
});
