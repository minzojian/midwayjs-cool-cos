import { IMidwayApplication } from '@midwayjs/core';
import { App, Init, Inject, Logger, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ILogger } from '@midwayjs/logger';
import * as COS from 'cos-nodejs-sdk-v5';
import { CoolPlugin, ICoolFile, MODETYPE, PLUGINSTATUS } from 'midwayjs-cool-core';
// @ts-ignore
import * as config from "./package.json";


@Provide()
@Scope(ScopeEnum.Request)
export class CosHandler implements ICoolFile {

    @Inject('cool:coolPlugin')
    coolPlugin: CoolPlugin;

    @App()
    app: IMidwayApplication;

    @Logger()
    coreLogger: ILogger;


    @Init()
    async init() {
        return await this.checkStatus();
    }


    private async createKey(filename, uploadFolder?) {


        let temp = filename.split('.');
        let lastName = '';
        let firstName = filename;
        if (temp.length > 1) {
            firstName = filename.substr(
                0,
                filename.length - temp[temp.length - 1].length - 1,
            );
        }
        lastName = '.' + temp[temp.length - 1];

        firstName = firstName.substr(0, Math.min(firstName.length, 10));
        let tmpfolder = uploadFolder || '';
        if (tmpfolder.length > 0 && tmpfolder.lastIndexOf('/') != tmpfolder.length - 1) {
            tmpfolder += '/';
        }
        if (tmpfolder.length > 0 && tmpfolder.indexOf('/') == 0) {
            tmpfolder = tmpfolder.substr(1);
        }

        let key =
            tmpfolder +
            firstName +
            '-' +
            require('uuid').v4() +
            lastName;

        return key;
    }

    async upload(ctx) {

        let { fileName, folder } = ctx.request.body;
        let key = await this.createKey(fileName, folder);
        const { accessKeyId, accessKeySecret, bucket, region, publicDomain } = await this.coolPlugin.getConfig(config.name.split('-')[2]);

        let cosDomain =
            publicDomain || ('https://' + bucket +
                '.cos.' +
                region +
                '.myqcloud.com/');
        if (!cosDomain.endsWith('/')) {
            cosDomain += '/'
        }

        var cos = new COS({
            SecretId: accessKeyId,
            SecretKey: accessKeySecret,
        });
        return new Promise(async (resolve, reject) => {
            await cos.getObjectUrl({
                Bucket: bucket,
                Region: region,     /* 存储桶所在地域，必须字段 */
                Method: 'PUT',
                Key: key,
                Sign: true
            }, function (err, data) {
                if (err) reject(err)
                else
                    resolve({
                        uploadUrl: data.Url, publicUrl: cosDomain +
                            key
                    });
            });

        })
    }
    async checkStatus() {
        const { accessKeyId, accessKeySecret, bucket, region } = await this.coolPlugin.getConfig(config.name.split('-')[2]);
        if (!accessKeyId || !accessKeySecret || !bucket || !region) {
            return PLUGINSTATUS.NOCONF;
        }
        return PLUGINSTATUS.USABLE;
    }
    getMode() {
        return {
            mode: MODETYPE.CLOUD,
            type: 'cos'
        };
    }
    getMetaFileObj() {
        return {
            mode: MODETYPE.CLOUD,
            type: 'cos'
        };
    }
};
