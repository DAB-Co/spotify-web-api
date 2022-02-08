# Spotify Web Api Guide

## Oauth2 system
- There is a refresh token and an access token in the Oauth2 system. The access token is used for validation
and the refresh token is used to fetch the access token. Access tokens usually expire after a given timeframe.

## Getting the access token
- A local server listening to http://localhost:41372/login_callback needs to set up to get the code required for 
posting to get the refresh token.

## Summary
- App redirects user to spotify login page for authorization
- Upon authorization, login page calls http://localhost:41372/login_callback with the code required to get the
refresh token.
- From here a post request needs to be made(by the app) to get the refresh token. This refresh token can be used indefinitely to request an
access token. Access token is used for api calls.
- If there is an error with the refresh token, go back to step 1 to have to user login again.

## Sources
- https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
- https://developer.spotify.com/documentation/general/guides/authorization/use-access-token/
- https://developer.spotify.com/documentation/general/guides/authorization/scopes/

## Steps for implementing in mobile
- Create a webpage for handling getting the refresh and access token
- Render the webpage in mobile
- After user is done, the webpage will send tokens as response and webpage can be closed
- store refresh_token and access_token
- use the access token to make necessary api calls
- if an error occurs use refresh token to request new access token
- if an error occurs again while requesting new access token via refresh token, render the webpage again
