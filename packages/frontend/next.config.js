/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Coil
- Cairin Michie <cairin@coil.com>
- Donovan Changfoot <don@coil.com>
- Matthew de Haast <matt@coil.com>
- Talon Patterson <talon.patterson@coil.com>
*****/

const withCSS = require('@zeit/next-css');

module.exports = withCSS({
    publicRuntimeConfig: {
        // REACT_APP_USERS_API_URL: process.env.REACT_APP_USERS_API_URL || 'http://localhost:3001/'

        REACT_APP_USERS_API_URL: process.env.REACT_APP_USERS_API_URL || 'http://localhost:3001',
        REACT_APP_GRANT_URL: process.env.REACT_APP_GRANT_URL || 'http://localhost:4445/oauth2/auth?client_id=frontend-service&state=loginflow&response_type=code&redirect_uri=http://localhost:3000/callback',
        HYDRA_REDIRECT_URI: process.env.HYDRA_REDIRECT_URI || 'http://localhost/callback',
        REACT_APP_LOGIN_GRANT_URL: process.env.REACT_APP_LOGIN_GRANT_URL || 'https://localhost:4445/oauth2/auth?client_id=frontend-service&state=loginflow&response_type=code&redirect_uri=http://localhost/callback',
        HYDRA_CLIENT_ID: process.env.HYDRA_CLIENT_ID || 'frontend-service',
        PUSHER_KEY: process.env.PUSHER_KEY || null
    }
});
