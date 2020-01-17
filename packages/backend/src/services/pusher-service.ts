import Pusher from 'pusher'

export type PusherEvent = {
  channel: string
  name: string
  data: {
    message: string
  }
}

export type PusherConfig = {
  appId: string
  key: string
  secret: string
  cluster: string
}

export class PusherService {
  private _pusher: Pusher
  constructor (config: PusherConfig) {
    this._pusher = new Pusher(config)
  }
  async trigger (event: PusherEvent) {
    this._pusher.trigger(event.channel, event.name, event.data)
  }
}
