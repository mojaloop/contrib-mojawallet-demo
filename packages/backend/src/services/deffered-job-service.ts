import { range } from "lodash"
import { sleep } from "./util"

export type JobFunc = (someInput: unknown) => Promise<void>
export type MatchType = {
  matchInput: string,
  bodyInput: unknown
}

// TODO: maybe it's better to extend EventEmitter here...
export default class DefferedJobService {
  listeners: Record<string, JobFunc>
  triggers: Record<string, unknown>

  constructor() {
    this.listeners = {}
    this.triggers = {}
  }

  async listenOnce(match: string): Promise<(maxTimeout: number) => Promise<any>> {
    // See if this got triggered
    const onTriggered = async (maxTimeout: number) => {
      // every 50ms check to see 
      let retries = Math.round(maxTimeout/50)
      const checkTriggersAndRetry = async () => {
        try {
          if (!this.triggers[match]) {
            throw new Error('Match not found')
          }

          const result = this.triggers[match]
          delete this.triggers[match]

          return result
        } catch {
          if (retries > 0) {
            retries = retries -1 
            await sleep(50)
          } else {
            throw new Error('Out of retries')
          }
        }
      }

      let bodyInput
      for (const idx in range(0, retries)) {
        bodyInput = await checkTriggersAndRetry()
        if (bodyInput) {
          return bodyInput
        }
      }
    }
    return onTriggered
  }

  // async defer(match: string, trigger: () => Promise<void>): Promise<void> {
  //   this.listeners[match[]]
  // }

  async fire(matchInput: string, bodyInput: unknown): Promise<void> {
    console.log('firing for matchInput', matchInput)
    this.triggers[matchInput] = bodyInput
    // // iterate through the listeners and fire if they match
    // for (const match in Object.keys(this.listeners)) {
    //   if (match !== matchInput) {
    //     return
    //   }

    //   const callback = this.listeners[match]
    //   await callback(bodyInput)
    //   delete this.listeners[match]
    // }
  }
}