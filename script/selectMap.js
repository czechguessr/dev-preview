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
    var SelectMap;
    (function (SelectMap) {
        let wrongPaths = [];
        let okPaths = new Map();
        let FOLDER_PATH;
        let MAP_SELECT;
        const MAP_SELECT_DEFAULT = '<option value="" disabled selected>Select map...</option>';
        let STATUS;
        const STATUS_ERROR = '<i class="bi bi-x-circle-fill"></i>&nbsp;Not found';
        const STATUS_OK = '<i class="bi bi-check-circle-fill"></i>&nbsp;OK';
        let PLAY_BUTTON;
        function bodyOnLoad() {
            FOLDER_PATH = $('#folder-path');
            MAP_SELECT = $('#map');
            PLAY_BUTTON = $('#play-form-btn');
            STATUS = $("#folder-state");
            if (typeof FOLDER_PATH !== "object" || typeof MAP_SELECT !== "object" || typeof PLAY_BUTTON !== "object")
                return;
            check();
        }
        SelectMap.bodyOnLoad = bodyOnLoad;
        function showMaps(CGConf) {
            STATUS.html(STATUS_OK);
            STATUS.removeClass("text-danger");
            STATUS.addClass("text-success");
            MAP_SELECT.removeAttr("disabled");
            PLAY_BUTTON.removeAttr("disabled");
            CGConf.maps.forEach(map => {
                MAP_SELECT.append(`<option value="${map.path}">${map.name} by ${map.author}</option>`);
            });
        }
        function wrongPath(path) {
            wrongPaths.push(path);
            STATUS.html(STATUS_ERROR);
            STATUS.removeClass("text-success");
            STATUS.addClass("text-danger");
            MAP_SELECT.attr("disabled", "true");
            PLAY_BUTTON.attr("disabled", "true");
        }
        function check() {
            return __awaiter(this, void 0, void 0, function* () {
                MAP_SELECT.html(MAP_SELECT_DEFAULT);
                let root = FOLDER_PATH.val();
                if (typeof root !== "string")
                    return;
                if (wrongPaths.indexOf(root) !== -1)
                    return;
                if (okPaths.has(root)) {
                    showMaps(okPaths.get(root));
                    return;
                }
                try {
                    let config = yield CzechGuessr.CGMap.Config.fromDir(root);
                    if (config.maps.length === 0) {
                        wrongPath(root);
                        return;
                    }
                    okPaths.set(root, Object.assign({}, config));
                    showMaps(config);
                }
                catch (e) {
                    wrongPath(root);
                    console.log(e);
                }
            });
        }
        SelectMap.check = check;
        function ok() {
            let mapPath = MAP_SELECT.val();
            if (typeof mapPath !== "string")
                return;
            sessionStorage.setItem(CzechGuessr.GLOBAL.MAP_PATH_KEY, mapPath);
            $.getJSON(mapPath).then(data => {
                sessionStorage.setItem(CzechGuessr.GLOBAL.MAP_KEY, JSON.stringify(data));
                window.location.href = "../game";
            });
        }
        SelectMap.ok = ok;
        function fileSelected() {
            let files = $("#map-file")[0].files;
            if (!files)
                return;
            sessionStorage.setItem(CzechGuessr.GLOBAL.MAP_PATH_KEY, files[0].name);
            files[0].text().then(value => {
                sessionStorage.setItem(CzechGuessr.GLOBAL.MAP_KEY, JSON.stringify(JSON.parse(value)));
                window.location.href = "../game";
            });
        }
        SelectMap.fileSelected = fileSelected;
    })(SelectMap = CzechGuessr.SelectMap || (CzechGuessr.SelectMap = {}));
})(CzechGuessr || (CzechGuessr = {}));
