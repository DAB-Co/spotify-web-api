const path = require("path");
require("dotenv").config({path: path.join(__dirname, ".env.local")});

const express = require("express");
const axios = require("axios");
const querystring = require('query-string');
const crypto = require('crypto');

const port = process.env.port;

const app = express();

const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = `http://localhost:${port}/login_callback`;

/*
Access token is the token that is used for api calls
It is set to expire. When expired, refresh token needs to be used to request the new access token.
 */
let refresh_token = undefined;
let access_token = undefined;
let token_type = undefined;

let login_state = null;

let attempt_count = 0;

const http_server = app.listen(port, () => {
    console.log(`Running on port ${http_server.address().port}`);
});

app.get("/", async function (req, res) {

    const user_data = {};

    if (access_token !== undefined) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + (Buffer.from(access_token).toString('base64'))
            }
        };

        let g_error = undefined;

        await axios.get('https://api.spotify.com/v1/me/top/artists', config)
            .then(function (response) {
                user_data["artists"] = response;
            })
            .catch(function (error) {
                console.log(error.response.status, error.response.statusText);
                console.log(error.response.headers);
                g_error = error.response.headers;
            });

        if (g_error !== undefined && attempt_count > 0) {
            res.send(g_error);
            process.exit();
        }
        else if (g_error !== undefined ) {
            attempt_count++;
            return res.redirect("/refresh_access_token");
        }
        /*
        await axios.get('https://api.spotify.com/v1/me/top/tracks', config)
            .then(function (response) {
                user_data["tracks"] = response;
            })
            .catch(function (error) {
                console.log(error.response.status, error.response.statusText);
                console.log(error.response.headers);
            });

         */

        attempt_count = 0;
        res.send(user_data);
    } else {
        return res.redirect("/refresh_access_token");
    }
});

app.get("/login", function (req, res) {
    login_state = crypto.randomBytes(8).toString('hex');
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: 'user-top-read',
            state: login_state,
            redirect_uri: redirect_uri,
        }));
});

app.get("/login_callback", function (req, res) {
    const code = req.query.code || null;
    const state = req.query.state || null;


    if (state === null || state !== login_state) {
        res.send("unable to login: state mismatch");
    } else {
        const data = {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        };

        const config = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            }
        };

        axios.post('https://accounts.spotify.com/api/token', querystring.stringify(data), config)
            .then(function (response) {
                console.log(response.data);
                access_token = response.data.access_token;
                refresh_token = response.data.refresh_token;
                token_type = response.data.token_type;
                res.redirect("/");
            })
            .catch(function (err) {
                console.log(err.response.data);
                res.send(err.response.data);
            })
    }
});

app.get("/refresh_access_token", function (req, res) {
    if (refresh_token === undefined) {
        return res.redirect("/login");
    }

    const data = {
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
    };

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        }
    };

    axios.post('https://accounts.spotify.com/api/token', querystring.stringify(data), config)
        .then(function (response) {
            console.log(response.data);
            access_token = response.data.access_token;
            token_type = response.data.token_type;
            res.redirect("/");
        })
        .catch(function (err) {
            console.log(err.response.headers);
            res.redirect("/login");
        })
});
