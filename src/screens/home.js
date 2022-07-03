import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Text,
  Input,
  FormControl,
  FormLabel,
  Button, Img,
} from '@chakra-ui/react';
import Chart from 'react-apexcharts';
import Geocode from 'react-geocode';
import './home.css';
import openWindowImage from '../gfx/open_window.png';
import BouncingDotsLoader from '../components/BouncingDotsLogo'; // with import

function getChartOptions(name) {
  // TODO - customise this
  return {
    series: [75],
    chart: {
      height: 350,
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
              return parseInt(val);
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
        gradientToColors: ['#ABE5A1'],
        inverseColors: true,
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

    setChartData({
      airQuality: airQualityData[0]['AQI'],
      grassPollen: pollenData['grass_pollen'],
      treePollen: pollenData['tree_pollen'],
      weedPollen: pollenData['weed_pollen'],
      windSpeed: weatherData['gust_kph'],
      humidity: weatherData['humidity'],
      temp: weatherData['temp_c'],
    });

    // TODO - make a recommendation
    setShouldOpenWindow(true);
    setIsLoading(false);
  }, [convertPostcodeToLatLon, postcode, getAirQuality]);

  return (
    <Box className="box" minH="100vh" minW="800px">
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
                {shouldOpenWindow ? (
                  <Box className="openWindowResultContainer">
                    <Text className="openWindowText">
                      Open the window
                    </Text>
                    <Img className="openWindowImage" src={openWindowImage} />
                  </Box>
                ) : (
                  <Text pt={10} bg="white">
                    Don't open the window
                  </Text>
                )}

                <Box className="charts">
                  <Chart
                    options={getChartOptions('Air Quality (AQI)')}
                    series={[chartData.airQuality]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions('Grass Pollen')}
                    series={[chartData.grassPollen]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions('Weed Pollen')}
                    series={[chartData.weedPollen]}
                    type="radialBar"
                    width="300"
                  />
                </Box>
                <Box className="charts">
                  <Chart
                    options={getChartOptions('Tree Pollen')}
                    series={[chartData.treePollen]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions('Wind Speed (km/h)')}
                    series={[chartData.windSpeed]}
                    type="radialBar"
                    width="300"
                  />
                  <Chart
                    options={getChartOptions('Humidity (%)')}
                    series={[chartData.humidity]}
                    type="radialBar"
                    width="300"
                  />
                </Box>
                <Box className="charts">
                  <Chart
                    options={getChartOptions('Temp (°C)')}
                    series={[chartData.temp]}
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
