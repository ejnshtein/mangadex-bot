import { Composer as TGFComposer, HearsTriggers, Middleware } from 'telegraf/typings/composer'
import { TelegrafContext } from 'telegraf/typings/context'

export class Composer<T> extends TGFComposer<TelegrafContext> {

  inlineQuery (
    triggers: HearsTriggers<TelegrafContext>,
    ...fns: readonly Middleware<TelegrafContext>[]
  ): Composer<TelegrafContext>

  static inlineQuery (
    triggers: HearsTriggers<TelegrafContext>,
    ...fns: readonly Middleware<TelegrafContext>[]
  ): Composer<TelegrafContext>
}
