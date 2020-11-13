var settings = getSettings();
var raidInfo = getRaidInfo();
var dictionary = getDictionary();

var clientId = settings['CLIENT_ID'];
var clientSecret = settings['CLIENT_SECRET'];
var base_url = settings['BASE_URL'];
var auth_url = settings['AUTH_URL'];
var locale = settings['LOCALE'];

function getGear(realmName, characterName) {
    if (!characterName || !realmName || characterName == '' || realmName == '') {
        return [];
    }
    realmName = realmName.toLowerCase();
    characterName = characterName.toLowerCase();

    const {
        HEAD,
        NECK,
        SHOULDER,
        CHEST,
        WAIST,
        LEGS,
        FEET,
        WRIST,
        HANDS,
        FINGER_1,
        FINGER_2,
        TRINKET_1,
        TRINKET_2,
        BACK,
        MAIN_HAND,
        OFF_HAND
    } = fetchEquipment(realmName, characterName);
    const {equipped_item_level} = fetchSummary(realmName, characterName)
    return [
        equipped_item_level,
        HEAD,
        NECK,
        SHOULDER,
        CHEST,
        WAIST,
        LEGS,
        FEET,
        WRIST,
        HANDS,
        FINGER_1,
        FINGER_2,
        TRINKET_1,
        TRINKET_2,
        BACK,
        MAIN_HAND,
        OFF_HAND
    ]
}

function getOther(realmName, characterName) {
    if (!characterName || !realmName || characterName == '' || realmName == '') {
        return [];
    }
    realmName = realmName.toLowerCase();
    characterName = characterName.toLowerCase();

    const {
        level,
        raceName,
        className
    } = fetchSummary(realmName, characterName);
    const {profession_1_name, profession_1_level, profession_2_name, profession_2_level, cooking_level, fishing_level, archarology_level} = fetchProfessions(realmName, characterName);
    return [
        level, raceName, className, profession_1_name, profession_1_level, profession_2_name, profession_2_level, cooking_level, fishing_level, archarology_level
    ];
}

function fetchEquipment(realmName, characterName) {
    realmName = realmName.toLowerCase();
    characterName = characterName.toLowerCase();

    var path = `/wow/character/${realmName}/${characterName}/equipment`
    var json = makeRequest(path, {});

    const items = {
        HEAD: null,
        NECK: null,
        SHOULDER: null,
        CHEST: null,
        WAIST: null,
        LEGS: null,
        FEET: null,
        WRIST: null,
        HANDS: null,
        FINGER_1: null,
        FINGER_2: null,
        TRINKET_1: null,
        TRINKET_2: null,
        BACK: null,
        MAIN_HAND: null,
        OFF_HAND: null
    }

    for (const item of json.equipped_items) {
        const slot = item["slot"].type
        const level = item["level"].value
        items[slot] = level;
    }

    return items;
}

function fetchSummary(realmName, characterName) {
    realmName = realmName.toLowerCase();
    characterName = characterName.toLowerCase();

    var path = `/wow/character/${realmName}/${characterName}`
    var json = makeRequest(path, {});

    const {id, equipped_item_level, average_item_level, level, experience} = json;
    const raceName = json.race.name;
    const className = json.character_class.name;
    return {equipped_item_level, average_item_level, level, experience, raceName, className};
}

function fetchProfessions(realmName, characterName) {
    realmName = realmName.toLowerCase();
    characterName = characterName.toLowerCase();

    var path = `/wow/character/${realmName}/${characterName}/professions`
    var json = makeRequest(path, {});

    let profession_1_name = "";
    let profession_1_level = "";
    let profession_2_name = "";
    let profession_2_level = "";
    let cooking_level = "";
    let fishing_level = "";
    let archarology_level = "";

    if (json.primaries.length > 0) {
        profession_1_name = json.primaries[0].profession.name;
        profession_1_level = json.primaries[0].tiers[0].skill_points;
    }

    if (json.primaries.length > 1) {
        profession_2_name = json.primaries[1].profession.name;
        profession_2_level = json.primaries[1].tiers[0].skill_points;
    }

    for (profession of json.secondaries) {
        if (profession.profession.name == "Cooking") {
            cooking_level = profession.tiers[0].skill_points
        }
        if (profession.profession.name == "Fishing") {
            fishing_level = profession.tiers[0].skill_points

        }
        if (profession.profession.name == "Archaeology") {
            archarology_level = profession.skill_points

        }
    }

    return {
        profession_1_name,
        profession_1_level,
        profession_2_name,
        profession_2_level,
        cooking_level,
        fishing_level,
        archarology_level
    };
}

// Gets the settings from the Settings sheet as an object dictionary
function getSettings() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var settings = {};
    for (sheet in sheets) {
        if (sheets[sheet].getName() == 'Settings') {
            values = sheets[sheet].getRange('A2:B99').getValues();
            for (x = 0; x < values.length; x++) {
                var key = values[x][0];
                var val = values[x][1];
                if (key == '') {
                    break;
                }
                settings[key] = val;
            }
        }
    }
    return settings
}

// Gets the values from the Dictionary sheet as an object dictionary
function getDictionary() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var dict = {};
    for (sheet in sheets) {
        if (sheets[sheet].getName() == 'Dictionary') {
            values = sheets[sheet].getRange('A2:B99').getValues();
            for (x = 0; x < values.length; x++) {
                var key = values[x][0];
                var val = values[x][1];
                if (key == '') {
                    break;
                }

                base_key = key.split('_')[0];
                id = key.split('_')[1];

                if (dict[base_key] == null) {
                    dict[base_key] = {};
                }
                dict[base_key][id] = val;
            }
        }
    }
    return dict;
}

function getRaids() {
    return Object.keys(raidInfo);
}

function getProgressionHeaders() {
    var headers = ['Mythic', 'Heroic', 'Normal', 'LFR'];
    var raids = getRaids();

    for (r in raids) {
        var raidName = raids[r]
        var bosses = getRaidBosses(raidName);
        for (b in bosses) {
            var bossName = bosses[b];
            headers.push(bossName);
        }
    }

    return headers;
}

// Creates an object whos keys are raids and whos values are arrays of boss names.
// This data is pulled form the Raid Info Sheet
function getRaidInfo() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var raids = {};
    for (sheet in sheets) {
        if (sheets[sheet].getName() == 'Raid Info') {
            values = sheets[sheet].getRange('A2:B99').getValues();
            for (x = 0; x < values.length; x++) {
                var key = values[x][0];
                var val = values[x][1];

                if (key == '') {
                    break;
                }

                if (raids[key] == null) {
                    raids[key] = [];
                }
                raids[key].push(val);
            }
        }
    }
    return raids;
}

function getApiKey(clientId, clientSecret) {
    const data = {
        'grant_type': 'client_credentials'
    };
    var encodedCredentials = Utilities.base64Encode(`${clientId}:${clientSecret}`);
    res_string = UrlFetchApp.fetch(auth_url,
        {
            method: 'post',
            payload: data,
            headers: {
                Authorization: `Basic ${encodedCredentials}`
            }
        });
    res = JSON.parse(res_string);
    access_token = res["access_token"];
    return access_token;
}

function makeRequest(path) {
    const access_token = getApiKey(clientId, clientSecret);
    url = `${base_url}${path}?namespace=profile-us&locale=${locale}`;
    res_string = UrlFetchApp.fetch(url,
        {
            method: 'get',
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
    return JSON.parse(res_string);
}
