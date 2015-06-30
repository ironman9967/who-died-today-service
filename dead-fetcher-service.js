///<reference path='./node_modules/ironworks/ironworks.d.ts' />
var _ = require('lodash');
var ironworks = require('ironworks');
var DeadWorker = require('./dead-worker');
if (_.isUndefined(process.env['VCAP_SERVICES'])) {
    process.env.VCAP_SERVICES = "{}";
}
if (_.isUndefined(process.env['VCAP_APP_PORT'])) {
    process.env.VCAP_APP_PORT = 8080;
}
var s = new ironworks.service.Service('dead-fetcher').use(new ironworks.workers.HttpWorker({
    apiRoute: 'api'
})).use(new ironworks.workers.SocketWorker()).use(new ironworks.workers.CfClientWorker()).use(new ironworks.workers.LogWorker()).use(new DeadWorker());
s.info('error', function (e) {
    console.error(e);
}).info('ready', function (iw) {
    iw.service.listen('stop', function () {
        iw.service.dispose();
    });
});
s.start(void 0, void 0);
//# sourceMappingURL=dead-fetcher-service.js.map