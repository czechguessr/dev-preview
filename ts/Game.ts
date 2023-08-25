namespace CzechGuessr.Game {
    let PANO: SMap.Pano.Scene;
    let CGMAP: CGMap.Map;
    let MAP: JQuery<HTMLElement>;
    let LMAP: L.Map;
    let MARKER: L.Marker;
    let TMARKER: L.Marker;
    let TARGET: L.Polyline;
    let DIST_POPUP: L.Popup;
    let currentLocation: CGMap.Location;
    let distances: number[] = [];
    let rounds: L.LatLng[][] = [];
    let greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    export async function load() {
        $("#results").hide();
        CGMAP = CGMap.Map.fromJSON(JSON.parse(sessionStorage.getItem(GLOBAL.MAP_KEY) as string), sessionStorage.getItem(GLOBAL.MAP_PATH_KEY) as string);
        MAP = $("#mapContainer");
        MAP.hide();
        PANO = new SMap.Pano.Scene($("#pano")[0]);
        MARKER = L.marker(CGMAP.center);
        TMARKER = L.marker(CGMAP.center, { icon: greenIcon });
        next();
    }

    function loadLocation(loc: CGMap.Location) {
        SMap.Pano.getBest(CGMap.Location.toSeznamLocation(loc)).then((place: SMap.Pano.Place) => {
            PANO.show(place, { yaw: 1.8 * Math.PI });
        })
    }

    export function update() {
        loadLocation(currentLocation);
    }
    export let popups: L.Popup[] = [];

    export function end() {
        document.exitFullscreen().catch(() => { });
        MAP.hide();
        $("#end").hide();
        $("#fs").hide();
        $("#pano").hide();
        $("#btn").hide();
        $("#results").show();
        let resMAP = L.map($("#resMap")[0]).setView(CGMAP.center, CGMAP.centerZoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(resMAP);
        let points: L.LatLng[] = [];
        let i = 0;
        for (const round of rounds) {
            let dist = distances[i];
            let content = `${dist > 1000 ? Math.round(dist / 10) / 100 : dist} ${dist > 1000 ? "km" : "m"}`
            L.marker(round[0], { icon: greenIcon }).addTo(resMAP).bindPopup(`<div style="text-align: center;"><b style="color: green;">Correct</b><br>${content} from your answer</div>`);
            L.marker(round[1]).addTo(resMAP).bindPopup(`<div style="text-align: center;"><b style="text-align: center; color: ${dist > 10 ? "red" : "green"};">Your answer</b><br>${content} from the correct answer</div>`);
            L.polyline(round).addTo(resMAP).bindPopup(content);
            points.push(...round);
            i++;
        }
        resMAP.fitBounds(L.latLngBounds(points).pad(0.25));
    }

    export function next() {
        MARKER.setLatLng(CGMAP.center);
        if (CGMAP.usable.length == 0) {
            end();
            return;
        }
        let random = CGMAP.randomLocation();
        currentLocation = random == null ? currentLocation : random;
        update();
    }
    export namespace Events {
        const TIMEOUT = 500;
        enum BtnStates {
            closed,
            map,
            waitForNext,
            none
        };
        enum MarkerStates {
            hidden,
            shown,
        };
        enum Modes {
            PC, mobile
        }
        enum ScreenStates {
            normal, fs
        }
        let btnState = BtnStates.closed;
        let markerState = MarkerStates.hidden;
        let mode: Modes;
        if (navigator.userAgent.match(/Android/i)
            || navigator.userAgent.match(/webOS/i)
            || navigator.userAgent.match(/iPhone/i)
            || navigator.userAgent.match(/iPad/i)
            || navigator.userAgent.match(/iPod/i)
            || navigator.userAgent.match(/BlackBerry/i)
            || navigator.userAgent.match(/Windows Phone/i)) mode = Modes.mobile;
        else mode = Modes.PC;
        let screenState = ScreenStates.normal;

        export function onFullscreenRequest() {
            let origPlace = PANO.getPlace().getCoords();
            if (screenState === ScreenStates.normal) {
                document.documentElement.requestFullscreen();
                screenState = ScreenStates.fs;
            } else {
                document.exitFullscreen();
                screenState = ScreenStates.normal;
            }
            $("#pano")[0].innerHTML = "";
            setTimeout(() => {
                PANO = new SMap.Pano.Scene($("#pano")[0]);
                loadLocation({ lat: origPlace.toWGS84()[1] as number, lon: origPlace.toWGS84()[0] as number })
            }, TIMEOUT);
        }

        export function onMapClick(e: L.LeafletMouseEvent) {
            if (markerState === MarkerStates.hidden) {
                MARKER.addTo(LMAP);
                markerState = MarkerStates.shown;
            }
            MARKER.setLatLng(e.latlng);
        }

        export function onBtnClick() {
            onBtnHover();
            if (btnState === BtnStates.map) {
                $("#map").width("80%");
                $("#map").height("80%");
                let dist = Math.round(SMap.Coords.fromWGS84(MARKER.getLatLng().lng, MARKER.getLatLng().lat).distance(SMap.Coords.fromWGS84(currentLocation.lon, currentLocation.lat)) * 10) / 10;
                LMAP.removeEventListener('click');
                distances.push(dist);
                DIST_POPUP = L.popup({ closeButton: false, closeOnClick: false, closeOnEscapeKey: false, autoClose: false })
                    .setLatLng(L.latLngBounds([MARKER.getLatLng(), L.latLng(currentLocation.lat, currentLocation.lon)]).getCenter())
                    .setContent(`${dist > 1000 ? Math.round(dist / 10) / 100 : dist} ${dist > 1000 ? "km" : "m"}`)
                    .openOn(LMAP);
                let points: L.LatLng[] = [L.latLng(currentLocation.lat, currentLocation.lon), MARKER.getLatLng()];
                rounds.push(points);
                TMARKER.setLatLng(points[0]);
                TMARKER.addTo(LMAP);
                if (TARGET === undefined)
                    TARGET = L.polyline(points);
                else
                    TARGET.setLatLngs(points);
                TARGET.addTo(LMAP);
                $("#btn").html("<i class=\"bi bi-arrow-right-circle-fill\"></i>");
                LMAP.fitBounds(L.latLngBounds([MARKER.getLatLng(), [currentLocation.lat, currentLocation.lon]]).pad(0.25));
                if (mode === Modes.mobile) {
                    btnState = BtnStates.none;
                    setTimeout(() => {
                        btnState = BtnStates.waitForNext;
                    }, TIMEOUT);
                } else {
                    btnState = BtnStates.waitForNext;
                }
            } else if (btnState === BtnStates.waitForNext) {
                TARGET.remove();
                MARKER.remove();
                TMARKER.remove();
                DIST_POPUP.remove()
                markerState = MarkerStates.hidden;
                LMAP.on('click', Events.onMapClick);
                $("#btn").html("<i class=\"bi bi-map\"></i>");
                LMAP.setView(CGMAP.center, CGMAP.centerZoom);
                next();
                if (mode === Modes.mobile) {
                    btnState = BtnStates.none;
                    setTimeout(() => {
                        btnState = BtnStates.map;
                        onMapHoverOut(true);
                    }, TIMEOUT);
                } else {
                    btnState = BtnStates.map;
                    onMapHoverOut(true);
                }
            }
        }
        export function onBtnHover() {
            if (btnState === BtnStates.closed) {
                MAP.show();
                if (mode === Modes.mobile) {
                    $("#map").width("80%");
                    $("#map").height("80%");
                } else {
                    $("#map").width("");
                    $("#map").height("");
                }
                if (LMAP === undefined) {
                    LMAP = L.map(MAP[0]).setView(CGMAP.center, CGMAP.centerZoom);
                    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        maxZoom: 19,
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    }).addTo(LMAP);
                    LMAP.on('click', Events.onMapClick);
                }
                $("#btn").html("<i class=\"bi bi-geo-alt\"></i>");
                if (mode === Modes.mobile) {
                    btnState = BtnStates.none;
                    setTimeout(() => {
                        btnState = BtnStates.map;
                    }, TIMEOUT);
                } else {
                    btnState = BtnStates.map;
                }
            }
        }

        export function onMapHoverOut(force = false) {
            if (btnState === BtnStates.map && (mode === Modes.PC || force)) {
                $("#map").width("4rem");
                $("#map").height("4rem");
                MAP.hide();
                $("#btn").html("<i class=\"bi bi-map\"></i>");
                if (mode === Modes.mobile) {
                    btnState = BtnStates.none;
                    setTimeout(() => {
                        btnState = BtnStates.closed;
                    }, TIMEOUT);
                } else {
                    btnState = BtnStates.closed;
                }
            }
        }
    }
}

