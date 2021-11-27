// src/configuration.ts
import { Configuration, Inject } from '@midwayjs/decorator';
import { ILifeCycle, IMidwayContainer } from '@midwayjs/core';
import { Logger } from '@midwayjs/decorator';
import { ILogger } from '@midwayjs/logger';
import { CosHandler } from './cos';
import { join } from 'path';
// @ts-ignore
import * as config from "./package.json";
import { CoolPlugin, COOL_FILE_KEY } from 'midwayjs-cool-core';

@Configuration({
  // 按照命名规范: midwayjs-cool-空间名
  namespace: config.name.split('-')[2],
  importConfigs: [
    join(__dirname, 'config')
  ]
})
export class AutoConfiguration implements ILifeCycle {
  @Logger()
  coreLogger: ILogger;

  @Inject('cool:coolPlugin')
  coolPlugin: CoolPlugin;


  async onReady(container?: IMidwayContainer): Promise<void> {
    await this.coolPlugin.install(CosHandler, async () => {
      this.coreLogger.info('\x1B[36m [cool:core] midwayjs cool redis component ready \x1B[0m');
    }, COOL_FILE_KEY);
  }

}
