import React, { PropTypes } from "react";
// import MapGL from "react-map-gl";
import mapboxgl from 'mapbox-gl';
// var mapboxgl = require("mapbox-gl");
import d3 from "d3";
var topojson = require("topojson");
// import * as topojson from "topojson";
import * as request from "superagent";
import * as ReactBootstrap from "react-bootstrap";
import * as DatePicker from "react-bootstrap-date-picker";

const assign = require('object-assign');
const apiUrl = "http://api.availabs.org/gtfs/";

/*mapboxgl.accessToken = "pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ";
var map = new mapboxgl.Map({
    container: "map",
    center: [-95, 39],
    zoom: 4,
    style: "mapbox://styles/mapbox/streets-v9"
});*/

// console.log(map);
// console.log(topojson);

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
            dirKeys: [],
            stopIndex: {},
            currentPage: null,
            pageSize: null,
            map: null,
            viewport: {
                latitude: 39,
                longitude: -95,
                zoom: 4,
                width: 1400,
                height: 700,
                startDragLngLat: null,
                isDragging: null
              }
        };

        request.get(apiUrl + "agency").end((err, res) => {
            let data = JSON.parse(res.text);
            /*this.agencies = data;
            this.loading_agencies = true;*/
            this.setState({
                agencies: data,
                loading_agencies: true
            });
        });
    }

    componentDidMount = () => {
        mapboxgl.accessToken = "pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ";
        
        var map = new mapboxgl.Map({
            container: "map",
            center: [-95, 39],
            zoom: 4,
            style: "mapbox://styles/mapbox/streets-v9"
        });
        this.setState({
            map
        });

        map.on("load", () => {
            this.loadRoutes(2, function(){});
            this.loadStops(2, function(){});
        });
    }

    loadAgency = (agency_id) => {
        this.setState({
            current_agency: agency_id,
            loading: true
        });

        this.agencies.forEach((agency) => {
            if(agency.id == agency_id) {
                this.setState({
                    loaded_agency: agency
                });
            }
        });

        loadRoutes(agency_id, () => {
            loadStops(agency_id, () => {
                this.setState({
                    laoding: false,
                    loaded: true
                });
            });
        });
    }

    loadRouteInfo = (route_id) => {
        this.setState({
            route_info: route_id
        });

        request.post(apiUrl + "agency/" + this.state.current_agency + "/routes/" + this.route_id + "/schedule")
            .send({
                "day": days[this.state.dt.getDay()]
            })
            .end((err, res) => {
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
                // this.direction = direction;
                this.setState({
                    direction
                });
                let zeroStops = {},
                    dirKeys = [],
                    stopIndex = {};
                for(let dir in direction) {
                    dirKeys.push(dir);
                    zeroStops[dir] = {};
                    for(let key in direction[dir].trips) {
                        let index = 0;
                        for(stopId in direction[dir].strips[key]) {
                            if(typeof zeroStops[dir][stopId] == "undefined") {
                                zeroStops[dir][stopId] = [];
                            }
                            zeroStops[dir][stopId].push(index);

                            index++;
                        }
                    }
                    stopIndex[dir] = {};
                    for(let stop in zeroStops[dir]) {
                        stopIndex[dir][d3.min(zeroStops[dir][stop])] = stop;
                    }
                }
                this.setState({
                    dirKeys,
                    stopIndex,
                    currentPage: 0,
                    pageSize: 4
                });
            });
    }

    loadRoutes = (id, cb) => {
        // d3.select("#routes").remove();
        // d3.select("#stops").remove();
        this.setState({
            routes: []
        });

        request.get(apiUrl + "agency/" + id + "/routes/").then((res) => {
            if(res) {
                let data = JSON.parse(res.text),
                    bounds = d3.geo.bounds(data);
                // do layers?
                // console.log(res, data);
                let geo = data;
                /*let topology = topojson.topology(
                    {routes: data},
                    {
                        "property-transform": (feature) => {
                            return feature.properties;
                        },
                        "quantization": 1e9
                    }
                );

                let geo = { type: "FeatureCollection", features: [] };

                topology.objects.routes.geometries.forEach(function(d){
                    let routeSwap = {type: "GeometryCollection", geometries:[d]}
                    let test = topojson.mesh(topology, routeSwap, function(a, b) {  return a.properties; });
                    let feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
                    geo.features.push(feature);
                });*/

                // console.log([bounds[0].reverse(),bounds[1].reverse()]);
                let i = 0;
                this.state.map.fitBounds([bounds[0],bounds[1]])
                geo.features.forEach((feature) => {
                    feature.geometry.coordinates.forEach((coord) => {
                        // console.log(feature, coord);
                        this.state.map.addSource("route_source" + i, {
                            "type": "geojson",
                            "data": {
                                "type": "Feature",
                                "properties": feature.properties,
                                "geometry": {
                                    "type": "LineString",
                                    "coordinates": coord
                                }
                            }
                        });
                        this.state.map.addLayer({
                            id: "route_layer" + i,
                            type: "line",
                            source: "route_source" + i,
                            paint: {
                                "line-color": "#" + (feature.properties.route_color || "000"),
                                "line-width": 3
                            }
                        });
                        i++;
                    });
                });

                /*this.state.map.addSource("routes_source", {
                    type: "geojson",
                    "data": geo
                });
                console.log(geo);
                this.state.map.addLayer({
                    id: "routes_layer",
                    type: "line",
                    source: "routes_source",
                    paint: {
                        "fill-color": "#000"
                    }
                });*/
                geo.features.forEach((route) => {
                    this.state.routes.push(route.properties);
                });

                cb();
            }
        }, (e) => {
            console.log("err", e);
        });
    }

    loadStops = (id, cb) => {
        this.setState({
            stops: []
        });

        request.get(apiUrl + "agency/" + id + "/stops").then((res) => {
            let data = JSON.parse(res.text);
            // plot stops
            let geo = topojson.feature(data, data.objects.stops);
            console.log(geo);
            this.state.map.addSource("stops_source", {
                "type": "geojson",
                "data": geo
            });
            this.state.map.addLayer({
                "id": "stops_layer",
                "type": "symbol",
                "source": "stops_source",
                "layout": {
                    "icon-image": "bus-15"
                }
            });

            let popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            this.state.map.on("mousemove", (e) => {
                let features = this.state.map.queryRenderedFeatures(e.point, { layers: ["markers"] });
                this.state.map.getCanvas().style.cursor = (features.length) ? "pointer" : "";

                if(!features.length) {
                    popup.remove();
                    return;
                }

                let feature = features[0];

                popup.setLngLat(feature.geometry.coordinates)
                    .setHTML((() => {
                        return "<p><b>Stop Name:</b>&nbsp;" + feature.properties.stop_name + "</p>" 
                                + "<p><b>Stop ID:</b>&nbsp;" + feature.properites.stop_id + "</p>"
                                + "<p><b>Stop Code:</b>&nbsp;" + feature.properites.stop_code + "</p>";
                    })())
                    .addTo(map);
            });

            cb();
        }, (e) => {
            console.log("err", e);
        });
    }

    _handleAgencySelect = () => {
        console.log("handle agency select", arguments); // set current_agency to whatever the avlue is
    }

    _dtChange = (d) => {
        this.setState({
            dt: Date.parse(d)
        });
    }

    render() {
        let style = {
            width: "100%",
            height: "100%"
        };
        let viewport = this.state.viewport;
        // mapboxApiAccessToken="pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ"
        let agencySelections = this.state.agencies.map((v, i) => {
            return <option value={i}> {v.name} </option>;
        }); // should really just refactor whatever is in the container
        let stops = this.state.stops.map((v, i) => {
            return (
                <tr>
                    <td>{v.stop_id}</td>
                    <td>{v.stop_code}</td>
                    <td>{v.stop_name}</td>
                </tr>
            );
        });

        let routes = this.state.routes.map((v, i) => {
            let dStyle = {
                color: v.route_color
            };
            return (
                <tr style={dStyle}>
                    <td>{ v.route_id }</td>
                    <td>{ v.route_short_name }</td>
                    <td>{ v.route_long_name }</td>
                </tr>
            );
        });

/*<div id="sidebar">
                    <Row><Col md={12} >
                        {this.state.loading_agencies ? 
                            <ProgressBar active bsStyle="info" /> : null}
                        <Container>
                            {this.state.loading_agencies ? null : 
                                <FormGroup controlId="formControlsSelect">
                                  <ControlLabel>Select Agency</ControlLabel>
                                  <FormControl onChange={this._handleAgencySelect} componentClass="select" placeholder="Select Agency">
                                    {agencySelections}
                                  </FormControl>
                                </FormGroup>}
                            {this.state.current_agency ? 
                                (<Col md={8}>
                                    <b>{ this.state.agencies[this.state.current_agency].name }</b> <br />
                                    Location: { this.agencies[this.current_agency].area + " " + this.agencies[this.current_agency].state }
                                </Col>
                                <Col md={4}>
                                    <Button className="pull-right" bsStyle="info">Info</Button>
                                </Col>) :
                                null}
                            {this.state.loading ? 
                                <div id="loading_agencies">
                                    <ProgressBar active bsStyle="info" /> 
                                </div> : null }
                            {this.state.loaded ? 
                                <Tabs defaultActiveKey={1}>
                                    <Tab eventKey={1} title="Agency">
                                        <b>Name</b>:{ this.state.loaded_agency.name }<br />
                                        <b>Area</b>: { this.state.loaded_agency.area }<br />
                                        <b>State</b>:{ this.state.loaded_agency.state }<br />
                                        <b>URL</b>: <a href={this.state.loaded_agency.url}>{this.state.loaded_agency.url}</a><br />
                                        <b>GTFS License</b>: <a href={ this.state.loaded_agency.license_url }>{ this.state.loaded_agency.license_url }</a><br />
                                        <b>gtfs-data-exchange URL</b>: <a href={ this.state.loaded_agency.dataexchange_url }>{ this.state.loaded_agency.dataexchange_url }</a><br />
                                        <b>Last Updated</b>: { this.state.loaded_agency.date_last_updated*1000 | date:"medium" }
                                    </Tab>
                                    <Tab eventKey={2} title="Stops">
                                        <Table hover>
                                            <thead> <tr>
                                                  <th>Stop ID</th>
                                                  <th>Stop Code</th>
                                                  <th>Stop Name</th> 
                                            </tr> </thead>
                                            {stops}
                                        </Table>
                                    </Tab>
                                    <Tab eventKey={3} title="Routes">
                                        <Table hover>
                                            <thead><tr>
                                                <th>Route ID</th>
                                                <th>Short Name</th>
                                                <th>Long Name</th>
                                            </tr></thead>
                                        </Table>
                                    </Tab>
                                    <Tab eventKey={4} title="Schedule Tab">
                                        <Row id="schedule-info">
                                            <Col md={12}>
                                                <FormGroup>
                                                    <DatePicker value={this.state.dt.toISOString()} onChange={this.dtChange} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Tab>*
                                </Tabs>
                                : null }
                        </Container>
                    </Col></Row>
                </div>*/

        return (
            <div id="map" style={style}>
            </div>
        );
    }
}

export default GTFSMap;
