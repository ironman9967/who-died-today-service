///<reference path='./node_modules/ironworks/ironworks.d.ts' />
///<reference path='./typings/request/request.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var _ = require('lodash');
var ironworks = require('ironworks');
var request = require('request');
var TwitchWorker = (function (_super) {
    __extends(TwitchWorker, _super);
    function TwitchWorker(opts) {
        _super.call(this, [
            'iw-socket'
        ], {
            id: ironworks.helpers.idHelper.newId(),
            name: 'twitch-worker'
        });
        var defOpts = {
            max: 300,
            updateFreq: 60 * 60 * 1000
        };
        this.opts = this.opts.beAdoptedBy(defOpts, 'worker');
        this.opts.merge(opts);
        this.streams = [];
    }
    TwitchWorker.prototype.init = function (comm, whoService, cb) {
        this.setComm(comm, whoService);
        var instance = this;
        TwitchWorker.download(this.opts.get('max'), function (streams) {
            instance.streams = streams;
            instance.respond('get-streams', function (req, respond) {
                instance.getStreams(req, respond);
            });
            instance.answer('stream-count', function (cb) {
                instance.streamCount(cb);
            });
            cb(null);
        });
    };
    TwitchWorker.prototype.getStreams = function (req, cb) {
        if (_.isUndefined(req.offset)) {
            req.offset = 0;
        }
        if (_.isUndefined(req.offset)) {
            req.limit = 5;
        }
        if (req.offset > this.streams.length) {
            cb(new Error("only have " + this.streams.length + " streams."));
        }
        else {
            cb(null, _.take(this.streams.slice(req.offset), req.limit));
        }
    };
    TwitchWorker.prototype.streamCount = function (cb) {
        cb(null, this.streams.length);
    };
    TwitchWorker.prototype.update = function () {
        var max = this.opts.get('max');
        var updateFreq = this.opts.get('updateFreq');
        var instance = this;
        TwitchWorker.download(max, function (streams) {
            instance.streams = streams;
            instance.updateTimeout = setTimeout(function () {
                instance.update();
            }, updateFreq);
        });
    };
    TwitchWorker.download = function (max, cb, streams) {
        if (_.isUndefined(streams)) {
            streams = [];
        }
        var offset = streams.length;
        request.get('https://api.twitch.tv/kraken/streams?limit=100&' + offset, function (e, res) {
            var current = JSON.parse(res.body);
            _.each(current.streams, function (s) {
                streams.push({
                    id: s._id,
                    game: s.game,
                    viewers: s.viewers,
                    preview: s.preview.template,
                    displayName: s.channel.display_name,
                    logo: s.channel.logo,
                    statusMessage: s.channel.status,
                    url: s.channel.url,
                    followers: s.channel.followers,
                    views: s.channel.views
                });
            });
            if (streams.length < max) {
                TwitchWorker.download(max, function (s) {
                    cb(s);
                }, streams);
            }
            else {
                cb(streams);
            }
        });
    };
    return TwitchWorker;
})(ironworks.workers.Worker);
module.exports = TwitchWorker;
//# sourceMappingURL=twitch-worker.js.map