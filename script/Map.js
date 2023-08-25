"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var CzechGuessr;
(function (CzechGuessr) {
    var CGMap;
    (function (CGMap) {
        function build_path(...args) {
            return args.map((part, i) => {
                if (i === 0) {
                    return part.trim().replace(/[\/]*$/g, '');
                }
                else {
                    return part.trim().replace(/(^[\/]*|[\/]*$)/g, '');
                }
            }).filter(x => x.length).join('/');
        }
        class Config {
            static fromDir(dir) {
                return __awaiter(this, void 0, void 0, function* () {
                    let config = new Config();
                    let url = build_path(dir, "/CzechGuessr.json");
                    let json = yield $.getJSON(url);
                    if (json.version !== CzechGuessr.GLOBAL.FILE_VERSION)
                        throw new Error(`File version incorrect: ${url} has version ${json.version}, but the current FILE_VERSION is ${CzechGuessr.GLOBAL.FILE_VERSION}`);
                    for (let map of json.maps) {
                        config.maps.push(yield Map.fromUrl(build_path(dir, map)));
                    }
                    return config;
                });
            }
            constructor(obj = {}) {
                this.maps = [];
                Object.assign(this, obj);
            }
        }
        CGMap.Config = Config;
        class Map {
            static fromUrl(url) {
                return __awaiter(this, void 0, void 0, function* () {
                    let json = yield $.getJSON(url);
                    return Map.fromJSON(json, url);
                });
            }
            static fromJSON(json, path) {
                let map = new Map();
                map.path = path;
                if (json.version !== CzechGuessr.GLOBAL.FILE_VERSION)
                    throw new Error(`File version incorrect: ${path} has version ${json.version}, but the current FILE_VERSION is ${CzechGuessr.GLOBAL.FILE_VERSION}`);
                map.name = json.name;
                map.author = json.author;
                map.center = [json.center[0], json.center[1]];
                map.centerZoom = json.center[2];
                json.locations.forEach((loc) => {
                    map.locations.push({ lat: loc[0], lon: loc[1] });
                });
                map.usable = Object.assign([], map.locations);
                return map;
            }
            constructor(obj = {}) {
                this.name = "";
                this.author = "";
                this.locations = [];
                this.usable = [];
                this.path = "";
                this.center = [0, 0];
                this.centerZoom = 13;
                Object.assign(this, obj);
                this.usable = Object.assign([], this.locations);
            }
            randomLocation() {
                if (this.usable.length === 0)
                    return null;
                let idx = Math.floor(Math.random() * this.usable.length);
                let loc = Object.assign({}, this.usable[idx]);
                this.usable.splice(idx, 1);
                return loc;
            }
        }
        CGMap.Map = Map;
        let Location;
        (function (Location) {
            function toSeznamLocation(CGloc) {
                return SMap.Coords.fromWGS84(CGloc.lon, CGloc.lat);
            }
            Location.toSeznamLocation = toSeznamLocation;
        })(Location = CGMap.Location || (CGMap.Location = {}));
    })(CGMap = CzechGuessr.CGMap || (CzechGuessr.CGMap = {}));
})(CzechGuessr || (CzechGuessr = {}));
