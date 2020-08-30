try{
    const keys = require('./config0'),
    Airtable = require('airtable'),
    base = new Airtable({ 'apiKey': keys.api }).base(keys.base),
    fs = require('fs'),
    readline = require('readline'),
    { google } = require('googleapis'),
    SCOPES = ['https://www.googleapis.com/auth/calendar'],
    TOKEN_PATH = 'token.json';
}catch(e){
    console.log('Error loading config file. You need a config file with an Airtable API key, an Airtable API base, and Google API info. You will also need a calendar ID if not using your primary calendar!')
    process.exit(1);
}

class Assn {
    constructor(task,type, loc, notes, date, week) {
        let curTime = new Date();
        curTime.setHours(0);
        let isClass = type.startsWith('Class');
        this.summary = task;
        this.description = `Week:${week}\nType:${type}\nLocation:${loc}\nNotes:${notes}`
        // this.type = type;
        // this.loc = loc;
        // this.notes = notes;
        this.start = { dateTime: curTime };
        this.end = { dateTime: curTime };
        console.log('dates now',this.start,this.end)
        this.end.dateTime.setHours(this.end.dateTime.getHours()+(!!isClass?3:1))
        // this.week = week;
    }
}
//get airtable asmts
function getAsmts(auth) {
    let o = [];
    base('Assignments Checklist').select({
        // Selecting the first 3 records in Outco Assignments Checklist:
        maxRecords: Infinity,
        view: "Outco Assignments Checklist"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            console.log('Retrieved', record.get('Task'));
            o.push(new Assn(
                record.get('Task'),
                record.get('Assignment Type'),
                record.get('Location'),
                record.get('Notes'),
                record.get('Due Date'),
                record.get('Week'),
            ));
        });
        // console.log(records[0])
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) { console.error(err); return; }
        console.log('Got assignments! Writing them to calendar');
           writeEvents(o,auth);
    });
}

authorize(keys, getAsmts);

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
* Get and store new token after prompting for user authorization, and then
* execute the given callback with the authorized OAuth2 client.
* @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
* @param {getEventsCallback} callback The callback for the authorized client.
*/
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
* Lists the next 10 events on the user's primary calendar.
* @param {google.auth.OAuth2} auth An authorized OAuth2 client.
*/
function listEvents(auth) {
    const calendar = google.calendar({ version: 'v3', auth });
    calendar.events.list({
        calendarId: keys.calendar||'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const events = res.data.items;
        if (events.length) {
            console.log('Upcoming 10 events:');
            events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                console.log(`${start} - ${event.summary}`);
            });
        } else {
            console.log('No upcoming events found.');
        }
    });
}


function writeEvents(o, auth) {
    const calendar = google.calendar({ version: 'v3', auth });
    // fs.writeFileSync('out.json',JSON.stringify(o),'utf-8')
    // return false;
    o.forEach(ev => {
        calendar.events.insert({
            auth: auth,
            calendarId: keys.calendar||'primary',
            resource: ev
        }, function (err, ev) {
            if (!!err) {
                console.log('ERR WAS', err)
                return false;
            }
            console.log('created event!')
        })
    })
}