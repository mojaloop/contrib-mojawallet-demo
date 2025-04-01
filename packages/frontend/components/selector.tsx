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

import Select from "react-select"
import React from 'react'

// light mode only
const customStyles = {
  control: (base, state) => ({
    ...base,
    height: 56,
    minHeight: 56,
    "&:hover": {
      borderColor: 0,
      borderWidth: 2
    },
    boxShadow: state.isFocused ? "#FF8A65" : 0,
    borderColor: state.isFocused ? "#FF8A65" : "rgba(0, 0, 0, .12)",
    borderWidth: state.isFocused ? 2 : 1
  }),
  option: styles => ({
    ...styles,
    backgroundColor: "transparent",
    color: "black",
    "&:hover": {
      backgroundColor: "#FFCCBC"
    }
  })
}

interface Options {
  value: number | string,
  label: string
}

type props = {
  options: Options[],
  onChange: (event: any) => void,
  defaultValue?: Options
  hint?: string
}

const Selector: React.FC<props> = props => {

  return (
    <div className="max-w-xs relative h-18 my-5">
      <Select
        options={props.options}
        styles={customStyles}
        onChange={props.onChange}
        defaultValue={props.defaultValue}
      />
      <p className={props.hint ? `assistiveText text-error w-full` : `invisible`}>
        {props.hint}</p>
    </div>
  )
}

export default Selector
