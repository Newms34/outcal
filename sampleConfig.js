module.exports = {
    api:'AIRTABLE-API-KEY',
    base:'AIRTABLE-BASE-ID',
    //get the following "installed" property by creating a new DESKTOP app in the google API manager
    //you can just copy the whole thing in here and replace the "installed" property.
    installed: {
        "client_id": "GOOGLE-API-CLIENT-ID",
        "project_id": "GOOGLE-API-PROJECT-ID",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "GOOGLE-API-CLIENT-SECRET",
        "redirect_uris": [
            "...some stuff goes here"
        ]
    },
    //Go to https://developers.google.com/calendar/v3/reference/calendarList/list?apix=true#try-it, and get your calendar IDs (optional)
    calendar:'google calendar ID OR "primary"'
}