import { TelegrafContext as TC } from 'telegraf/typings/context'
import * as tt from 'telegraf/typings/telegram-types'
import { User } from '../models/User'
export * from 'telegraf'

export interface TelegrafContext extends TC {
  state: {
    user: User
  }
  replyWithAnimation(
    animation: tt.InputFile,
    extra?: ExtraAnimation
  ): Promise<tt.MessageAnimation>
  startPayload?: string
}

export interface ExtraAnimation extends tt.ExtraReplyMessage {
  duration?: number
  width?: number
  height?: number
  thumb?: tt.InputFile
  caption?: string
}
