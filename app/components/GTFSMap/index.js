import React, { PropTypes } from "react";
import MapGL from "react-map-gl";

class GTFSMap extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <MapGL width={400} height={400} latitude={37.7577} longitude={-122.4376} zoom={8} onChangeViewport={(viewport) => {
                    var {latitude, longitude, zoom} = viewport;
                }}
            />
        );
    }
}