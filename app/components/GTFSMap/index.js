import React, { PropTypes } from "react";
import MapGL from "react-map-gl";
import * as request from "superagent";
const assign = require('object-assign');
const apiUrl = "http://api.availabs.org/gtfs";

class GTFSMap extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            current_agency: null,
            loading_agencies: true,
            agencies: [],
            routes: [],
            stops: [],
            stopNames: [],
            loaded_agency: {},
            loaded: false,
            loading: false,
            dt: new Date(),
            viewport: {
                latitude: 39,
                longitude: -95,
                zoom: 5,
                width: 800,
                height: 800,
                startDragLngLat: null,
                isDragging: null
              }
        }
        request.get(apiUrl + "agency", (res) => {
            let data = JSON.parse(res.text);
            this.agencies = data;
            this.loading_agencies = true;
        })
    }

    _onChangeViewport = (newViewport) => {
        var viewport = assign({}, this.state.viewport, newViewport);
        this.setState({viewport});
    }

    loadAgency = (agency_id) => {
        this.current_agency = agency_id;
        this.loading = true;
        this.agencies.forEach((agency) => {
            if(agency.id == agency_id) {
                this.loaded_agency = agency;
            }
        });
        loadRoutes(agency_id, () => {
            loadStops(agency_id, () => {
                this.loading = false;
                this.loaded = true;
            });
        });
    }

    loadRouteInfo = (route_id) => {
        this.route_info = route_id;
        request.post(apiUrl + "agency/" + this.current_agency + "/routes/" + this.route_id + "/schedule")
            .send({
                "day": days[this.dt.getDay()]
            })
            .end((res) => {
                let data = JSON.parse(res.text);
                let direction = {},
                    stop = [];
                data.forEach((point) => {
                    if(point.direction_id == null) {
                        point.direction_id = 0;
                    }

                    if(typeof direction[point.direction_id] == "undefined") {
                        direction[point.direction_id] = { trips: {} };
                    }

                    if(typeof direction[point.direction_id].trips[point.trip_id] == "undefined") {
                        direction[point.direction_id].trips[point.trip_id] = {};
                    }

                    let stop = point.stop_id,
                        time = point.arrival_time;

                    direction[point.direction_id].trips[point.trip_id][stop] = time;
                });
                this.direction = direction;
                let zeroStops = {};
            })
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
