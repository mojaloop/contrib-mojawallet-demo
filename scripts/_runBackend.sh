#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

set -eu pipefail

${DIR}/setupHydra.sh
sleep 30
${DIR}/setupFrontendClient.sh

cd ${DIR}/../packages/backend
npm run build
npm run start