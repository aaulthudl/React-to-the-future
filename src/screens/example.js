import { React, useState, useEffect } from 'react';
import {
    Box,
    Text,
  } from '@chakra-ui/react';
import {Nav} from '../components/bottom-nav'
export const ExampleFetch = () => {


  return (
    <>
        <Box>
            <Text size="large" color="black">
            Air Quality Data:
            </Text>
        </Box>
        <Nav />
    </>
  );
}

