const request = require('request-promise');
const querystring = require('querystring');

const hereKeys = require('../.secrets/here');

const Here = {
  getCityCoords: async function(cityName) {
    const options = {
      url: `https://geocoder.api.here.com/6.2/geocode.json?` +
        querystring.stringify({
          app_id: hereKeys.appID,
          app_code: hereKeys.appCode,
          searchtext: cityName
        }),
        json: true
    }

    return await request.get(options)
      .then((data) => {
        let lat = data.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
        let lon = data.Response.View[0].Result[0].Location.DisplayPosition.Longitude;

        return `${lat},${lon},20km`;
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

module.exports = Here;
