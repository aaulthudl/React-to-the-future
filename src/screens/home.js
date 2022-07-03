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

export const Home = () => {
  // true = open, false = don't open
  const [shouldOpenWindow, setShouldOpenWindow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [airQualityData, setAirQualityData] = useState();
  const [postcode, setPostcode] = useState();

  const [isInitialQuery, setIsInitialQuery] = useState(true);

  // TODO - customise this
  const options = {
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
        startAngle: -135,
        endAngle: 225,
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
    labels: ['Air Quality (AQI)'],
  };

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

    if (res.ok === true) {
      const { stations } = await res.json();

      setAirQualityData(stations);

      return stations;
    }
  }, []);

  const getPollenCount = useCallback(async (lat, lng) => {
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

    if (res.ok === true) {
      const { stations } = await res.json();

      setAirQualityData(stations);

      return stations;
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
    const pollenCount = await getPollenCount(lat, lng);

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

                <Box>
                  <Chart
                    options={options}
                    series={[airQualityData[0]['AQI']]}
                    type="radialBar"
                    width="400"
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
