import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  Input, FormControl, FormLabel, Button,
} from '@chakra-ui/react';
import {Nav} from '../components/bottom-nav';
import Chart from "react-apexcharts";
import Geocode from "react-geocode";

export const Home = () => {
  const [resultFetched, setResultFetched] = useState(false);

  const [airQuality, setAirQuality] = useState();
  const [postcode, setPostcode] = useState();

  // TODO - customise this
  const options = {
    series: [75],
    chart: {
      height: 350,
      type: 'radialBar',
      toolbar: {
        show: false
      }
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
            opacity: 0.24
          }
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
            opacity: 0.35
          }
        },

        dataLabels: {
          show: true,
          name: {
            offsetY: -10,
            show: true,
            color: '#888',
            fontSize: '17px'
          },
          value: {
            formatter: function(val) {
              return parseInt(val);
            },
            color: '#111',
            fontSize: '36px',
            show: true,
          }
        }
      }
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
        stops: [0, 100]
      }
    },
    stroke: {
      lineCap: 'round'
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
            '98557c7e147dce2926573a404b7404eb6dccd673bc7044e4c0d13583b5bb6392',
          'Content-type': 'application/json',
        },
      }
    );

    if (res.ok === true) {
      const data = await res.json();
      setAirQuality(data.stations);

      return data.stations;
    }
  }, []);

  const convertPostcodeToLatLon = useCallback(async (postcode) => {
    Geocode.setApiKey("AIzaSyD_G7EMILNLxo0NdXBtZnRS7QmIw0dZc4U");
    Geocode.setLanguage("en");
    Geocode.enableDebug();

    // TODO: maybe add error handling
    const response = await Geocode.fromAddress(postcode);
    const { lat, lng }  = response.results[0].geometry.location;

    return { lat, lng };
  }, []);

  const handlePostcodeChange = useCallback((event) => {
    setResultFetched(false);
    
    setPostcode(event.target.value);
  }, []);
  
  const handlePostcodeSubmit = useCallback(async () => {
    const res = await convertPostcodeToLatLon(postcode);
    const data = await getAirQuality(res.lat, res.lng);

    if (data !== undefined) {
      setResultFetched(true);
    }
  }, [convertPostcodeToLatLon, postcode, getAirQuality]);

    return (
        <Box minH="100vh">
            <Box textAlign="center" fontSize="xl">
                <Box spacing={8}>
                  <FormControl>
                    <FormLabel htmlFor='postcodeInput'>Postcode</FormLabel>
                    <Input id="postcodeInput" value={postcode} onChange={handlePostcodeChange} placeholder='Enter a post code...'/>
                    <Button onClick={handlePostcodeSubmit}>Let's go</Button>
                  </FormControl>

                  { resultFetched && (
                    <>
                      <Text pt={10} bg="white">
                        Air Quality: {airQuality[0]["AQI"]}
                      </Text>

                      <Chart
                        options={options}
                        series={[airQuality[0]["AQI"]]}
                        type="radialBar"
                        width="500"
                      />
                    </>
                  )}
                </Box>
             </Box>
            <Nav />
        </Box>
    );
}
