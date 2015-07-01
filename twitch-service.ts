
///<reference path='./node_modules/ironworks/ironworks.d.ts' />

import _ = require('lodash');

import ironworks = require('ironworks');

import TwitchWorker = require('./twitch-worker');

if (_.isUndefined(process.env['VCAP_SERVICES'])) {
    process.env.VCAP_SERVICES = "{}";
}

if (_.isUndefined(process.env['VCAP_APP_PORT'])) {
    process.env.VCAP_APP_PORT = 8082;
}

var s = new ironworks.service.Service('twitch-service')
    .use(new ironworks.workers.HttpWorker({
        apiRoute: 'api'
    }))
    .use(new ironworks.workers.SocketWorker())
    .use(new ironworks.workers.CfClientWorker())
    .use(new ironworks.workers.LogWorker())
    .use(new TwitchWorker());


s.info<Error>('error', (e: Error) => {
        console.error(e);
    })
    .info('ready', (iw: any) => {
        iw.service.listen('stop', () => {
            iw.service.dispose();
        });
    });
s.start(void 0, void 0);
