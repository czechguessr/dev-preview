namespace CzechGuessr.CGMap {
    function build_path(...args: string[]) {
        return args.map((part: string, i: number) => {
            if (i === 0) {
                return part.trim().replace(/[\/]*$/g, '')
            } else {
                return part.trim().replace(/(^[\/]*|[\/]*$)/g, '')
            }
        }).filter(x => x.length).join('/')
    }

    export class Config {
        public maps: Map[] = [];

        public static async fromDir(dir: string) {
            let config = new Config();
            let url = build_path(dir, "/CzechGuessr.json");
            let json = await $.getJSON(url);
            if (json.version !== GLOBAL.FILE_VERSION) throw new Error(`File version incorrect: ${url} has version ${json.version}, but the current FILE_VERSION is ${GLOBAL.FILE_VERSION}`)
            for (let map of json.maps) {
                config.maps.push(await Map.fromUrl(build_path(dir, map)));
            }
            return config;
        }

        constructor(obj: object = {}) {
            Object.assign(this, obj);
        }
    }

    export class Map {
        public name: string = "";
        public author: string = "";
        public locations: Location[] = [];
        public usable: Location[] = [];
        public path: string = "";
        public center: L.LatLngExpression = [0, 0];
        public centerZoom: number = 13;

        public static async fromUrl(url: string) {
            let json = await $.getJSON(url);
            return Map.fromJSON(json, url);
        }

        public static fromJSON(json: any, path: string) {
            let map = new Map();
            map.path = path;
            if (json.version !== GLOBAL.FILE_VERSION) throw new Error(`File version incorrect: ${path} has version ${json.version}, but the current FILE_VERSION is ${GLOBAL.FILE_VERSION}`)
            map.name = json.name;
            map.author = json.author;
            map.center = [json.center[0], json.center[1]];
            map.centerZoom = json.center[2];
            json.locations.forEach((loc: any) => {
                map.locations.push({ lat: loc[0], lon: loc[1] });
            });
            map.usable = Object.assign([], map.locations);
            return map;
        }

        constructor(obj: any = {}) {
            Object.assign(this, obj);
            this.usable = Object.assign([], this.locations);
        }

        public randomLocation(): any {
            if (this.usable.length === 0) return null;
            let idx = Math.floor(Math.random() * this.usable.length);
            let loc = Object.assign({}, this.usable[idx]);
            this.usable.splice(idx, 1);
            return loc;
        }
    }

    export namespace Location {
        export function toSeznamLocation(CGloc: Location) {
            return SMap.Coords.fromWGS84(CGloc.lon, CGloc.lat);
        }
    }

    export interface Location {
        lat: number;
        lon: number;
    }
}