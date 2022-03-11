import { createInterface } from 'readline';
import { URL } from 'url';
import fetch from 'node-fetch';

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const POSTCODES_BASE_URL = 'https://api.postcodes.io';
const TFL_BASE_URL = 'https://api.tfl.gov.uk';

export default class ConsoleRunner {

    async promptForPostcode() {
        return new Promise(((resolve, reject) => {
            readline.question('\nEnter your postcode: ', (answer => {
                readline.close();
                return resolve(answer);
            }))
        }))
    }

    displayStopPoints(stopPoints) {
        stopPoints.forEach(point => {
            console.log(point.commonName);
        });
    }

    buildUrl(url, endpoint, parameters) {
        const requestUrl = new URL(endpoint, url);
        parameters.forEach(param => requestUrl.searchParams.append(param.name, param.value));
        return requestUrl.href;
    }

    async makeGetRequest(baseUrl, endpoint, parameters) {
        const url = this.buildUrl(baseUrl, endpoint, parameters);
        let response;
        try {
            response = await fetch(url, {method: 'GET'});
            return await response.json();
        }
        catch (err) {
            console.log(err);
        }
    }

    async getLocationForPostCode(postcode) {
        const jsonBody = await this.makeGetRequest(POSTCODES_BASE_URL, `postcodes/${postcode}`, [])
        return {latitude: jsonBody.result.latitude, longitude: jsonBody.result.longitude}
    }

    async getNearestStopPoints(latitude, longitude, count) {
        const jsonBody = await this.makeGetRequest(
            TFL_BASE_URL,
            `StopPoint`,
            [
                {name: 'stopTypes', value: 'NaptanPublicBusCoachTram'},
                {name: 'lat', value: latitude},
                {name: 'lon', value: longitude},
                {name: 'radius', value: 1000},
                {name: 'app_id', value: '' /* Enter your app id here */},
                {name: 'app_key', value: '' /* Enter your app key here */}
            ]);
        return jsonBody.stopPoints.map(function(entity) {
            return { naptanId: entity.naptanId, commonName: entity.commonName };
        }).slice(0, count);
    }

    async run() {
        const that = this;
        const postcode = await that.promptForPostcode();
        const location = await that.getLocationForPostCode(postcode);
        const stopPoints = await that.getNearestStopPoints(location.latitude, location.longitude, 5);
        this.displayStopPoints(stopPoints);
    }
}
