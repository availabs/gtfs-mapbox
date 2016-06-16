/**
 *
 * App.react.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';

// Import the CSS reset, which HtmlWebpackPlugin transfers to the build folder
import 'sanitize.css/sanitize.css';

import Img from 'components/Img';
import Footer from 'components/Footer';
import Banner from './banner-metal.jpg';
import A from 'components/A';

import styles from './styles.css';

function App(props) {
    console.log(props);
  return (
    <div id="map-wrapper">{props.children}</div>
  );
}

App.propTypes = {
  children: React.PropTypes.node,
};

export default App;
