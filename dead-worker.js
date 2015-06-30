///<reference path='./node_modules/ironworks/ironworks.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ironworks = require('ironworks');
var deadType;
(function (deadType) {
    deadType[deadType["Celeb"] = 0] = "Celeb";
    deadType[deadType["Musician"] = 1] = "Musician";
    deadType[deadType["Sports"] = 2] = "Sports";
})(deadType || (deadType = {}));
var DeadWorker = (function (_super) {
    __extends(DeadWorker, _super);
    function DeadWorker(opts) {
        _super.call(this, [
            'iw-socket'
        ], {
            id: ironworks.helpers.idHelper.newId(),
            name: 'dead-worker'
        });
        var defOpts = {};
        this.opts = this.opts.beAdoptedBy(defOpts, 'worker');
        this.opts.merge(opts);
    }
    DeadWorker.prototype.init = function (comm, whoService, cb) {
        this.setComm(comm, whoService);
        this.respond('dead', function (req, cb) {
            cb(null, {
                name: 'test',
                pictureUrl: 'n/a',
                details: {
                    cod: 'unknown',
                    timestamp: new Date().getTime(),
                    location: 'unknown'
                }
            });
        });
        cb(null);
    };
    return DeadWorker;
})(ironworks.workers.Worker);
module.exports = DeadWorker;
//# sourceMappingURL=dead-worker.js.map