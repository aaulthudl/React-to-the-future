import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  Input,
  FormControl,
  FormLabel,
  Button,
} from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import Geocode from 'react-geocode';
import './home.css';
import BouncingDotsLoader from '../components/BouncingDotsLogo';
import windowAnimation from '../gfx/lottie_files/open_window.json';
import Lottie from 'lottie-react-web';

function convertNumberToPercentageOfMaxValue(number, maxValue) {
  const value = parseFloat(number);

  return (value * 100) / maxValue;
}

function convertPercentageOfMaxValueToNumber(percentage, maxValue) {
  const value = parseFloat(percentage);

  const number = (value * maxValue) / 100;

  // TODO - cba to truncate so convert
  return parseInt(`${number}`);
}

function getChartOptions({ name, maxValue }) {
  // TODO - customise this
  return {
    series: [75],
    chart: {
      animations: {
        enabled: false
      },
      height: 300,
      type: 'radialBar',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: 0,
        endAngle: 360,
        hollow: {
          margin: 0,
          size: '70%',
          background: '#fff',
          image: undefined,
          imageOffsetX: 0,
          imageOffsetY: 0,
          position: 'front',
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 4,
            opacity: 0.24,
          },
        },
        track: {
          background: '#fff',
          strokeWidth: '67%',
          margin: 0, // margin is in pixels
          dropShadow: {
            enabled: true,
            top: -3,
            left: 0,
            blur: 4,
            opacity: 0.35,
          },
        },

        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: '#888',
            fontSize: '17px',
          },
          value: {
            formatter: function (val) {
              if (!maxValue) {
                return parseFloat(val);
              }

              return convertPercentageOfMaxValueToNumber(val, maxValue);
            },
            color: '#111',
            fontSize: '36px',
            show: true,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#6c63ff'],
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: 'round',
    },
    labels: [name],
  };
}

export const Home = () => {
  const [location, setLocation] = useState("");

  // true = open, false = don't open
  const [shouldOpenWindow, setShouldOpenWindow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [chartData, setChartData] = useState({});
  const [postcode, setPostcode] = useState();

  const [isInitialQuery, setIsInitialQuery] = useState(true);

  const getAirQuality = useCallback(async (lat, lng) => {
    const res = await fetch(
      `https://api.ambeedata.com/latest/by-lat-lng?lat=${lat}&lng=${lng}`,
      {
        method: 'GET',
        headers: {
          'x-api-key':
            '4f4249bcbb2f56cb1d360e237b69a88f9a9f4ed84d4bb5ec55f2966f4ef64777',
          'Content-type': 'application/json',
        },
      }
    );
    if (res.ok) {
      const { stations } = await res.json();
      return stations;
    }
  }, []);

  const getPollenCount = useCallback(async (lat, lng) => {
    const res = await fetch(
      ` https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${lat}&lng=${lng}`,
      {
        method: 'GET',
        headers: {
          'x-api-key':
            '4f4249bcbb2f56cb1d360e237b69a88f9a9f4ed84d4bb5ec55f2966f4ef64777',
          'Content-type': 'application/json'
        },
      }
    );

    if (res.ok) {
      const result = await res.json();
      return result['data'][0]['Count'];
    }
  }, []);

  const getWeatherData = useCallback(async (lat, lng) => {
    const res = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?q=${lat},${lng}&days=1`,
      {
        method: 'GET',
        headers: {
          'key':
            'e68bfc1463d44f05b9191544220307',
          'Content-type': 'application/json'
        },
      }
    );

    if (res.ok) {
      const result = await res.json();
      return result['current'];
    }
  }, []);

  const convertPostcodeToLatLon = useCallback(async postcode => {
    Geocode.setApiKey('AIzaSyD_G7EMILNLxo0NdXBtZnRS7QmIw0dZc4U');
    Geocode.setLanguage('en');
    Geocode.enableDebug();

    // TODO: maybe add error handling
    const response = await Geocode.fromAddress(postcode);
    const { lat, lng } = response.results[0].geometry.location;

    return { lat, lng };
  }, []);

  const handlePostcodeChange = useCallback(event => {
    setPostcode(event.target.value);
  }, []);

  const handlePostcodeSubmit = useCallback(async () => {
    setIsInitialQuery(false);
    setIsLoading(true);

    const { lat, lng } = await convertPostcodeToLatLon(postcode);

    // TODO - put other fetches here
    const airQualityData = await getAirQuality(lat, lng);
    const pollenData = await getPollenCount(lat, lng);
    const weatherData = await getWeatherData(lat, lng);

    const location = `${airQualityData[0].placeName}, ${airQualityData[0].city}`;
    setLocation(location);

    setChartData({
      airQuality: airQualityData[0]['AQI'],
      grassPollen: pollenData['grass_pollen'],
      treePollen: pollenData['tree_pollen'],
      weedPollen: pollenData['weed_pollen'],
      windSpeed: weatherData['gust_kph'],
      humidity: weatherData['humidity'],
      temp: weatherData['temp_c'],
    });

    let hScore = 0;
    if (weatherData['temp_c'] > 30) {
      hScore += 15;
    } else if(weatherData['temp_c'] > 16){
      hScore += 5;
    } else {
      hScore -= 5;
    }

    // High/V.High Pollen
    if (pollenData['tree_pollen'] > 208  || pollenData['grass_pollen'] > 61) {
      hScore -= 15;
    }

    // Good wind speed
    if( 13 < weatherData['gust_kph'] < 40 ){
      hScore += 5;
    } // Low wind speed
    else if (weatherData['gust_kph'] < 13){
      hScore -= 5;
    } // High wind speed
    else if (weatherData['gust_kph'] > 40){
      hScore -= 2;
    }

    setShouldOpenWindow(hScore > 0);

    setIsLoading(false);
  }, [convertPostcodeToLatLon, postcode, getAirQuality, getPollenCount, getWeatherData]);

  return (
    <Box className="container" minH="100vh">
      <Box textAlign="center" fontSize="xl">
        { isInitialQuery ? (
          <Box className="initialHomeContainer" spacing={8}>
            <h1 className="h1">
              breeze
            </h1>

            <Box className="pageContainer">
              <Box className="descriptionContainer">
                Help the planet (and your wallet) with breeze. <br/>
                Find out when you can switch off the AC/fans and open the window.
              </Box>

              <Box className="postcodeFormContainer">
                <FormControl>
                  <div className="postcodeForm">
                    <div className="postcodeInput">
                      <FormLabel className="formLabel" htmlFor="postcodeInput">
                        Enter your postcode
                      </FormLabel>
                      <Input
                        id="postcodeInput"
                        value={postcode}
                        onChange={handlePostcodeChange}
                        placeholder="E.g. SW1W 0NY"
                      />
                    </div>
                    <Button onClick={handlePostcodeSubmit}>Let's go</Button>
                  </div>
                </FormControl>
              </Box>
            </Box>
          </Box>
        ) : (
          <Box>
            <Box className="topNav">
              <Text className="navLogo">
                breeze
              </Text>

              <Box>
                <FormControl>
                  <div className="navPostcodeForm">
                    <div className="navPostcodeInput">
                      <Input
                        value={postcode}
                        onChange={handlePostcodeChange}
                        placeholder="E.g. SW1W 0NY"
                      />
                    </div>
                    <Button onClick={handlePostcodeSubmit}>Let's go</Button>
                  </div>
                </FormControl>
              </Box>
            </Box>
            { isLoading ? (
                <Box className="loadingContainer">
                  <BouncingDotsLoader/>
                </Box>
              ) : (
              <Box className="resultContainer">
                <Text className="locationContainer">
                  {location}
                </Text>

                {shouldOpenWindow ? (
                  <Box className="windowResultContainer">
                    <Text className="openWindowText">
                      open the window
                    </Text>

                    <Lottie
                      options={{
                        animationData: windowAnimation,
                        loop: false,
                      }}
                      height={300}
                    />
                  </Box>
                ) : (
                  <Box className="windowResultContainer">
                    <Text className="closeWindowText">
                      close the window
                    </Text>

                    <Lottie
                      direction={-1}
                      forceSegments={true}
                      options={{
                        animationData: windowAnimation,
                        loop: false,
                      }}
                      height={300}
                    />
                  </Box>
                )}

                <Box className="charts">
                  <Chart
                    options={getChartOptions({name: 'Temp (°C)', maxValue: 35, colorOption: 'red'})}
                    series={[convertNumberToPercentageOfMaxValue(chartData.temp, 35)]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions({name: 'Air Quality (AQI)', maxValue: 300})}
                    series={[convertNumberToPercentageOfMaxValue(chartData.airQuality, 300)]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions({name: 'Wind (km/h)', maxValue: 40})}
                    series={[convertNumberToPercentageOfMaxValue(chartData.windSpeed, 40)]}
                    type="radialBar"
                    width="300"
                  />
                </Box>
                <Box className="charts">
                  <Chart
                    options={getChartOptions({name: 'Humidity (%)'})}
                    series={[chartData.humidity]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions({name: 'Tree Pollen', maxValue: 350})}
                    series={[convertNumberToPercentageOfMaxValue(chartData.treePollen, 350)]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions({name: 'Grass Pollen', maxValue: 100})}
                    series={[convertNumberToPercentageOfMaxValue(chartData.grassPollen, 100)]}
                    type="radialBar"
                    width="300"

                  />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};
