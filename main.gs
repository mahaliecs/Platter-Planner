function onOpen() {
  var ui = DocumentApp.getUi();
  ui.createMenu('Platter Planner')
      .addSubMenu(ui.createMenu('Make at Home')
        .addItem('Learn how to make dish at home', 'sidebar_home'))
      .addSubMenu(ui.createMenu('Restaurant')
        .addItem('Find nearby restaurants to eat dish at', 'sidebar_restaurant'))
      .addSubMenu(ui.createMenu('Cooking Tools')
        .addItem('Do pro stuff with your dish', 'sidebar_tools'))
      .addToUi();
}

function showDialog(filename) {
  var html = HtmlService.createHtmlOutputFromFile(filename)
      .setWidth(600)
      .setHeight(400);
  DocumentApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
      .showModalDialog(html, 'Platter Planner');
}

function api_call() {
  var req = "https://api.spoonacular.com/recipes/convert?apiKey=a9d46e854b0f496f950868d35a26c990&ingredientName=flour&sourceAmount="+amount+"&sourceUnit="+orig+"&targetUnit="+target;
  var resp = UrlFetchApp.fetch(req);
  var trans_resp = JSON.parse(resp.getContentText());
  var ans = trans_resp.answer;
}

// calls youtube api to query link and title inputted dish
function youtube_api_call(dish) {
  // var dish = "lasagna";
  var search = dish + " recipe";
  var youtube_results = []; 
  var req = "https://youtube-search-results.p.rapidapi.com/youtube-search/?rapidapi-key=59ecf6e841msh6cdaac8c33b73cfp1e6e39jsnc0fe9bcb8d59&q=" + search;
  var response = UrlFetchApp.fetch(req);
  var trans_resp = JSON.parse(response.getContentText());
  var results_length = trans_resp.items.length;
  for (let i = 0; i < trans_resp.items.length; i++) {
    var title = trans_resp.items[i].title;
    var url = trans_resp.items[i].url;
    youtube_results.push({ 
      title: title,
      urlLink: url
    });
  }
  return youtube_results;
}

// calls recipe api to query links, image, and cuisine type from inputted dish
function recipe_api_call2(dish) {
  var req = "https://edamam-recipe-search.p.rapidapi.com/search?rapidapi-key=59ecf6e841msh6cdaac8c33b73cfp1e6e39jsnc0fe9bcb8d59&q=" + dish;
  var response = UrlFetchApp.fetch(req);
  var trans_resp = JSON.parse(response.getContentText());
  var results_size = trans_resp.hits.length;
  var recipe_results = []; 
  for (let i = 0; i < results_size; i++) {
    var title = trans_resp.hits[i].recipe.label;
    var url = trans_resp.hits[i].recipe.url;
    var imageLink = trans_resp.hits[i].recipe.image;
    var cuisine = trans_resp.hits[i].recipe.cuisineType[0];
    // recipe_results object
    recipe_results.push({ 
      titleDish: title,
      urlLink: url,
      image: imageLink,
      cuisineDish: cuisine
    });
  }
  console.log(recipe_results[0].cuisineDish);
  return recipe_results;  
}

function show_cuisine(dish,cuisine) {
  var style = 'style="text-align: center; background-color: rgb(255, 248, 209);"';
  var text = dish+' is '+cuisine+'!';
  var body = '<body '+style+'> <h2>'+text+'</h2> </body>';
  Logger.log("dish: "+dish+", cuisine: "+cuisine+" - in show_cuisine!");
  Logger.log(body);
  var ui = HtmlService.createHtmlOutput(body)
        .setWidth(300)
        .setHeight(100);
  DocumentApp.getUi().showModalDialog(ui, "Cuisine Background");
}

function convert(amount, orig, target) {
  var req = "https://api.spoonacular.com/recipes/convert?apiKey=a9d46e854b0f496f950868d35a26c990&ingredientName=flour&sourceAmount="+amount+"&sourceUnit="+orig+"&targetUnit="+target;
  var resp = UrlFetchApp.fetch(req);
  var trans_resp = JSON.parse(resp.getContentText());
  var ans = trans_resp.targetAmount;
  
  return ans;
}

function subs(orig) {
  var req = "https://api.spoonacular.com/food/ingredients/substitutes?apiKey=a9d46e854b0f496f950868d35a26c990&ingredientName="+orig;
  var resp = UrlFetchApp.fetch(req);
  var trans_resp = JSON.parse(resp.getContentText());
  var output = trans_resp.substitutes;

  return output; 
}

function check(input) {
  Logger.log("from success - output is: "+input);
}

function restaurant_api_call(dish_name = "pasta", zipcode = "77840") {
  // var zipcode = 77840;
  var cuisine = recipe_api_call2(dish_name)[0].cuisineDish;
  Logger.log(cuisine);
  var rest_req = "https://api.documenu.com/v2/restaurants/zip_code/" + zipcode + "?key=72b449365e78e37ee2d8750f299b430e&cuisine=" + cuisine;
  var rest_res = UrlFetchApp.fetch(rest_req);
  var trans_rest_res = JSON.parse(rest_res.getContentText());
  var geo = [];
  var restaurant_results = [];
  for (let i = 0; i < trans_rest_res.data.length; i++) { 
    var obj = trans_rest_res.data[i];
    Logger.log(obj.restaurant_name);
    Logger.log(obj.restaurant_website);
    Logger.log(obj.geo);
    if (obj.restaurant_website !== "") {
      restaurant_results.push({
        name: obj.restaurant_name,
        website: obj.restaurant_website,
        // lat: obj.geo.lat,
        // lon: obj.geo.lon,
      });
      geo.push([obj.geo.lat, obj.geo.lon]);
    }
  }

  //get map to show up
  // 39.9205,-105.0867||39.9205,-105.0867
  //https://open.mapquestapi.com/staticmap/v5/map?locations=Denver,CO||Boulder,CO||39.9205,-105.0867&size=@2x&defaultMarker=marker-FF0000-FFFFFF-num&key=lnG96Kkh8G9Efq37PBbMxtwqZORuhqoK&banner=1:+Denver,+2:+Boulder,+3:+Lat|sm-top-F78181-000000
  var map_req1 = "https://open.mapquestapi.com/staticmap/v5/map?key=lnG96Kkh8G9Efq37PBbMxtwqZORuhqoK&locations=";
  var map_req2 = "&format=jpeg&size=@2x&defaultMarker=marker-FF0000-FFFFFF-num";
  // var legend = "&banner=";
  for (let i = 0; i < geo.length; i++) {
    if (i !== geo.length - 1) {
      map_req1 += geo[i][0] + "," + geo[i][1] + "||";
      // legend += (i+1) + ":+" + restaurant_results[i].name + ",";
    }
    else {
      map_req1 += geo[i][0] + "," + geo[i][1];
      // legend += (i+1) + ":+" + restaurant_results[i].name;
    }
  }
  // legend += "|lg-top-F78181-000000";
  var map_req = map_req1 + map_req2;
  map_req = encodeURI(map_req);
  var blob = UrlFetchApp.fetch(map_req);
  blob = blob.getAs("image/jpeg");
  var ret = {
    restaurants: restaurant_results,
    map: map_req,
    blob: blob,
  }
  Logger.log(ret);
  return ret;
}

function insert_map(dish_name = "pasta", zipcode = "77840") {
  Logger.log("called insert map on server side");
  var doc = DocumentApp.getActiveDocument();
  var cursor = doc.getCursor();

  var api_response = restaurant_api_call(dish_name, zipcode);
  var image = api_response.blob;
  var restaurants = api_response.restaurants;

  var legend = "";
  for (var i = 0; i < restaurants.length; i++) {
    legend += (i+1) + ": " + restaurants[i].name + "\n";
  }

  if (cursor) {
    var img = cursor.insertInlineImage(image);
    img.setHeight(500);
    img.setWidth(500);
    cursor.insertText(legend);
  } else {
    var img = doc.getBody().insertImage(0, image);
    img.setHeight(500);
    img.setWidth(500);
    doc.getBody().insertText(legend);
  }
}

function insert_dish_image(dish_name = "pasta") {
  Logger.log("called insert dish image on server side");
  var doc = DocumentApp.getActiveDocument();
  var cursor = doc.getCursor();

  var api_response = recipe_api_call2(dish_name);
  var image_url = api_response[0].image;
  Logger.log(image_url);
  var image = UrlFetchApp.fetch(image_url);
  image = image.getAs("image/jpeg");
  Logger.log(image);

  if (cursor) {
    var img = cursor.insertInlineImage(image);
    img.setHeight(400);
    img.setWidth(400);
    cursor.insertText(dish_name.toUpperCase() + "\n");
  } else {
    var img = doc.getBody().insertImage(0, image);
    img.setHeight(400);
    img.setWidth(400);
    doc.getBody().insertText(dish_name.toUpperCase() + "\n");
  }
}

function showSidebar(filename) {
  console.log("creating sidebar ... ");
  var ui = HtmlService.createHtmlOutputFromFile(filename)
      .setTitle('Platter Planner');
  DocumentApp.getUi().showSidebar(ui);
}

function sidebar_restaurant() {
  showSidebar('restaurant')
}

function sidebar_home() {
  showSidebar('make_at_home')
}

function sidebar_tools() {
  showSidebar('cooking_tools')
}