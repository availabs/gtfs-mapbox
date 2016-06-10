import React, { PropTypes } from "react";
import MapGL from "react-map-gl";
import d3 from "d3";
import * as request from "superagent";
import * from "react-bootstrap";
const assign = require('object-assign');
const apiUrl = "http://api.availabs.org/gtfs/";

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
            this.agencies = data;
            this.loading_agencies = true;
        });
    }

    _onChangeViewport = (newViewport) => {
        var viewport = assign({}, this.state.viewport, newViewport);
        this.setState({viewport});
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

        request.get(apiUrl + "agency/" + id + "/routes/").end((err, res) => {
            let data = JSON.parse(res.text);
            // do layers?
            cb();
        });
    }

    loadStops = (id, cb) => {
        this.setState({
            stops: []
        });

        request.get(apiUrl + "agency/" + id + "/stops/").end((err, res) => {
            let data = JSON.parse(res.text);
            // plot stops
            cb();
        });
    }

    _handleAgencySelect = () {
        console.log("handle agency select", arguments); // set current_agency to whatever the avlue is
    }

    render() {
        var viewport = this.state.viewport;

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
        return (
            <div>
                <MapGL 
                    mapboxApiAccessToken="pk.eyJ1IjoiY2FrZXNvZndyYXRoIiwiYSI6Ijk5YWI3OTlhMGIxN2I1OWYzYjhlOWJmYjEwNTRjODU0In0._RjYIzLsA5cU-YM6dxGOLQ"
                    onChangeViewport={this._onChangeViewport}
                    {...viewport}
                />
                <div id="sidebar">
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
                                        
                                    </Tab>
                                </Tabs>
                                : null }
                        </Container>
                    </Col></Row>
                </div>
            </div>
        );
    }
}

export default GTFSMap;
