import React, { PropTypes } from "react";
import MapGL from "react-map-gl";
const assign = require('object-assign');

class GTFSMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            viewport: {
                latitude: 37.78,
                longitude: -122.45,
                zoom: 11,
                width: 800,
                height: 800,
                startDragLngLat: null,
                isDragging: null
              }
        }
        this._onChangeViewport = this._onChangeViewport.bind(this)
    }
    _onChangeViewport(newViewport) {
        var viewport = assign({}, this.state.viewport, newViewport);
        this.setState({viewport});
    }

    render() {
        var viewport = this.state.viewport;
        // mapboxApiAccessToken="pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ"
        return (
            <MapGL 
                onChangeViewport={this._onChangeViewport} // idc if token is public
                mapboxApiAccessToken="pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ"
                {...viewport}
            />
        );
    }
}

export default GTFSMap;
