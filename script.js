var settings = getSettings();
var raidInfo = getRaidInfo();
var dictionary = getDictionary();

var api_key = settings['API_KEY'];
var base_url = settings['BASE_URL'];

function makeRequest(path, params) {
  url = base_url + path + '?apikey=' + api_key;
  for (param in params) {
    url += '&' + param + '=' + params[param];
  }
  res_string = UrlFetchApp.fetch(url);
  return JSON.parse(res_string);
}

// Returns a json string containing character item info
function getItemsJSON(realmName, characterName) {
  var path = "character/" + realmName + "/" + characterName;
  params = {};
  params['fields'] = "items,audit";
  return makeRequest(path, params);
}

// Returns a json string containing character profession info
function getProfessionsJSON(realmName, characterName) {
  var path = "character/" + realmName + "/" + characterName;
  params = {};
  params['fields'] = "professions";
  return makeRequest(path, params);
}

// Returns a json string containing character progression info
function getProgressionJSON(realmName, characterName) {
  var path = "character/" + realmName + "/" + characterName;
  params = {};
  params['fields'] = "progression";
  return makeRequest(path, params);
}

function getItems(realmName, characterName) {
  if (!characterName || !realmName || characterName == '' || realmName == '') {
    return [];
  }

  var character = getItemsJSON(realmName, characterName);
  var character_array = [];

  character_array.push(character.items.averageItemLevelEquipped);

  if (character.items.neck && character.items.neck.azeriteItem) {
    character_array.push(character.items.neck.azeriteItem.azeriteLevel);
  } else {
    character_array.push("?")
  }

  var missingEnchants = 0;
  for (x = 0; x <= 16; x++) {
    var itemInfo = auditItem(character, x);
    if (itemInfo != null) {
      character_array.push(itemInfo);
      if (itemInfo.indexOf(settings['MISSING_ENCHANT_SYMBOL']) != -1) {
        missingEnchants++;
      }
    }
  }

  character_array.push(character.audit.emptySockets);
  character_array.push(missingEnchants);

  return character_array;
}

// Returns an array containing all of the info you need to know about an item.
function auditItem(character, itemId) {
  var itemKey = dictionary['SLOT'][itemId];

  if (itemKey == null) {
    return null;
  }
  if (character['items'][itemKey]) {
    var item = character['items'][itemKey];
    var itemLevel = item.itemLevel;

    // Check to see if the item is missing any enchants
    var missingEnchant = false;
    if (itemKey == 'mainHand' || itemKey == 'finger1' || itemKey == 'finger2') {
      if (item.tooltipParams.enchant == null) {
        missingEnchant = true;
      }
    }

    // Check to see if the item is missing any gems
    var missingGems = false;
    if (itemId in character.audit.itemsWithEmptySockets) {
      missingGems = true;
    }

    return '' + itemLevel + (missingEnchant ? settings['MISSING_ENCHANT_SYMBOL'] : "") + (missingGems ? settings['MISSING_GEM_SYMBOL'] : "");
  } else {
    return '';
  }
}

// Returns an array containing the data from the other sheet
function getOther(realmName, characterName) {
  if (!characterName || !realmName || characterName == '' || realmName == '') {
    return [];
  }

  var character = getProfessionsJSON(realmName, characterName);
  var character_array = getCharacterArray(character);
  var professions_array = getProfessionsArray(character.professions);
  return character_array.concat(professions_array);
}

// Returns an array containing character level/race/class
function getCharacterArray(character) {
  var character_array = [];

  character_array.push(character.level);
  character_array.push(dictionary['RACE'][character.race]);
  character_array.push(dictionary['CLASS'][character.class]);

  return character_array;
}

// Returns an array where:
// The first 4 values are tier kill counts
// The remaining values are kill count strings for the full list of bosses.
function getProfessionsArray(professions) {
  var professions_array = [];
  // Cycle primary professions
  for (key in professions.primary) {
    profession = professions.primary[key];
    // Check to see if it's a primary profession
    for (id in dictionary['PROFESSION']) {
      if (profession.name == dictionary['PROFESSION'][id]) {
        // It's in the valid profession list
        professions_array.push(profession.name);
        professions_array.push(profession.rank);
      }
    }
  }

  // If you don't have professions, insert placeholders.
  while (professions_array.length < 4) {
    professions_array.push('0');
  }

  for (key in professions.secondary) {
    {
      profession = professions.secondary[key];
      if (profession.name == 'Cooking') {
        professions_array.push(profession.rank);
      }
    }
  }
  // If you don't have professions, insert placeholders.
  while (professions_array.length < 5) {
    professions_array.push('x');
  }

  return professions_array;
}

// Returns an array where:
// The first 4 values are tier kill counts
// The remaining values are kill count strings for the full list of bosses.
function getProgression(realmName, characterName) {
  if (!characterName || !realmName || characterName == '' || realmName == '') {
    return [];
  }

  var character = getProgressionJSON(realmName, characterName);
  var progression_array = [];
  var tierNumbers = [0, 0, 0, 0];

  var raidList = getRaids();
  for (key in raidList) {
    // Get the raid info
    var raidArray = getRaidArray(character.progression.raids, raidList[key]);

    // Iterate over it to get our total kill counts.
    for (boss in raidArray) {
      var bossKillCount = raidArray[boss];
      if (bossKillCount != null) {
        for (i = 0; i < tierNumbers.length; i++) {
          tierNumbers[i] += (bossKillCount[i] > 0 ? 1 : 0);
        }
        progression_array.push(formatKillCount(bossKillCount));

      } else {
        progression_array.push('x')
      }
    }
  }

  var totalBosses = progression_array.length;
  for (i in tierNumbers) {
    tierNumbers[i] = '' + tierNumbers[i] + '/' + totalBosses;
  }
  for (item in progression_array) {
    progressionString = progression_array
  }
  return tierNumbers.concat(progression_array);
}

// Returns a human readable kill count
function formatKillCount(killcount) {
  return "M:" + killcount.mythic +
      " H:" + killcount.heroic +
      " N:" + killcount.normal +
      " L:" + killcount.lfr;
}

// Returns an array containing the kill count for each boss in a raid
function getRaidArray(characterRaids, raidName) {
  var raid_array = [];

  // Look through all raids the character has done to find the one you want.
  for (key in characterRaids) {
    var raid = characterRaids[key];
    if (raid.name != raidName) {
      continue;
    }

    // Look theough all of the bosses on the sheet for the one we want.
    // This is done in a less elegant way because we want to maintain order.
    var bosses = getRaidBosses(raidName);
    for (boss in bosses) {
      raid_array.push(getBossKillCount(raid, bosses[boss]));
    }
  }
  return raid_array;
}

// Gets the kill count for each tier of raid from the raid data.
function getBossKillCount(raid, bossName) {
  for (bossAttempt in raid.bosses) {
    if (raid.bosses[bossAttempt].name == bossName) {
      // We have found the correct boss!

      var killCount = {
        mythic: raid.bosses[bossAttempt].mythicKills,
        heroic: raid.bosses[bossAttempt].heroicKills,
        normal: raid.bosses[bossAttempt].normalKills,
        lfr: raid.bosses[bossAttempt].lfrKills
      }
      return killCount;
    }
  }
  return null;
}

// Gets a list of all raids.
function getRaids() {
  return Object.keys(raidInfo);
}

// Gets a list of raid bosses by raid name
function getRaidBosses(raidName) {
  for (r in raidInfo) {
    if (r == raidName) {
      return raidInfo[r];
    }
  }
}

// Generates the Progression sheets headers based on the bosses listed in the Raid Info Sheet
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