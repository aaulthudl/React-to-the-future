import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  Input, FormControl, FormLabel, Button,
} from '@chakra-ui/react';
import Chart from "react-apexcharts";
import Geocode from "react-geocode";

export const Home = () => {
  // true = open, false = don't open, undefined = waiting for recommendation
  const [shouldOpenWindow, setShouldOpenWindow] = useState(undefined);

  const [airQualityData, setAirQualityData] = useState();
  const [pollenCount, setPollenCount] = useState();
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

// fetch air quality from ambee
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
      const { stations } = await res.json();

      setAirQualityData(stations);

      return stations;
    }
  }, []);


  // get pollen count from breezometer
  const getPollenCount = useCallback(async (lat, lon) => {
    const res = await fetch(
      `https://api.breezometer.com/pollen/v2/forecast/daily?lat=${lat}&lon=${lon}&days=1`,
      {
        method: 'GET',
        headers: {
          'key':'c238a4928d024f4baa4e51e514ef2196',
          'Content-type': 'application/json',
        },
      }
    );

    if (res.ok === true) {
      const { pcount } = await res.json();
      
      setPollenCount(pcount);

      return pcount;
    }
  }, []);
  

  // use geocode to convert postcode to latlon
  const convertPostcodeToLatLon = useCallback(async (postcode) => {
    Geocode.setApiKey("AIzaSyD_G7EMILNLxo0NdXBtZnRS7QmIw0dZc4U");
    Geocode.setLanguage("en");
    Geocode.enableDebug();

    // TODO: maybe add error handling
    const response = await Geocode.fromAddress(postcode);
    const { lat, lng }  = response.results[0].geometry.location;

    return { lat, lng };
  }, []);

  //change the postcode when text in input box changes
  const handlePostcodeChange = useCallback((event) => {
    setShouldOpenWindow(undefined);
    
    setPostcode(event.target.value);
  }, []);
  
  // on postcode submission
  const handlePostcodeSubmit = useCallback(async () => {
    const res = await convertPostcodeToLatLon(postcode);

    // TODO - put other fetches here
    const data = await getAirQuality(res.lat, res.lng);
    // const pollen_data = await getPollenCount(res.lat, res.lng);
   

    // TODO - make a recommendation
    setShouldOpenWindow(false);
  }, [convertPostcodeToLatLon, postcode, getAirQuality]);

    return (
      <>
        <Box minH="100vh">
            <Box textAlign="center" fontSize="xl">
                <Box spacing={8}>
                  <FormControl>
                    <FormLabel htmlFor='postcodeInput'>Postcode</FormLabel>
                    <Input id="postcodeInput" value={postcode} onChange={handlePostcodeChange} placeholder='Enter a post code...'/>
                    <Button onClick={handlePostcodeSubmit}>Let's go</Button>
                  </FormControl>

                  { shouldOpenWindow !== undefined && (
                    <>
                      { shouldOpenWindow ? (
                        <Text pt={10} bg="white">Open the window</Text>
                      ) : (
                        <Text pt={10} bg="white">Don't open the window</Text>
                      )}

                      <Chart
                        options={options}
                        series={[airQualityData[0]["AQI"]]}
                        type="radialBar"
                        width="500"
                      />
                  
                    </>
                  )}
                </Box>
             </Box>
        </Box>
        </>
    );
}
