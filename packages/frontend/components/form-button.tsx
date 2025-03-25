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
 --------------
 ******/

import * as React from "react"
import { motion } from "framer-motion"

type props = {
  text: boolean
  to: string
}


const FormButton: React.FC = (props) => {
  return (
    <motion.button
    type="submit"
    className="inline-block min-w-button cursor-pointer px-5 py-3 rounded-xl elevation-2 bg-primary focus:outline-none text-button text-white uppercase tracking-wider"
    whileTap={{ boxShadow: "0px 5px 5px -3px rgba(0,0,0,0.20), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)" }}
  >
    { props.children }
  </motion.button>
  )
}

export default FormButton
