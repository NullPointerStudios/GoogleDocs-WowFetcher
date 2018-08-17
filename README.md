# GoogleDocs-WowFetcher

This script provides functions that automatically fetch data from the wow armory api and inserts them into a google drive spreadsheet.

## Getting Started

### Prereqs

You must have your own Wow API key to use this script.

You can get an api key here: https://dev.battle.net/

When you have your api key, you can enter it on the "Settings" sheet.

### Cloning an existing sheet

The easiest way to start using the script is to clone a preexisting spreadsheet.

You can find my example spreadsheet here: https://docs.google.com/spreadsheets/d/11A_WzSO4Hx4w_bTLh1x18MIDGhjBElI8Yp6iJLGuRKg/edit?usp=sharing

### Creating your own sheet

You can create your own sheet to use with this script by doing the following:

* Go to https://docs.google.com/spreadsheets
* Press the "New Spreadsheet" button (It's the big plus sign)
* Click Tools -> Script editor in the context bar.
* Paste the script into the provided text area

In order to use the sheet at all you must have:
* A sheet named `Settings` that contains all of the values from the settings CSV.
	* You will need to replace the API_KEY value with your own api key.
* A sheet named `Dictionary` that contains all of the values from the dictionary CSV.

In order to use the progression fetcher, you must have:
* A sheet named `Raid Info` that contains a list of all of the bosses you want displayed.

### Using the sheet

The sheet provides a few functions that fetch data from the wow api. The primary functions are:

getItems(realm, characterName)
getOther(realm, characterName)
getProgression(realm, characterName)

Each of these functions returns an array. You can then use the transpose function to display those arrays in the spreadsheet.
