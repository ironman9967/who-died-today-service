
///<reference path='./node_modules/ironworks/ironworks.d.ts' />
///<reference path='./typings/request/request.d.ts' />

import _ = require('lodash');
import IStream = require('./node_modules/iw-twitchy-interface/IStream');
import IStreamRequest = require('./node_modules/iw-twitchy-interface/IStreamRequest');
import ironworks = require('ironworks');
import request = require('request');

interface ITwitchWorkerOpts {
    max: number;
    updateFreq: number;
}

class TwitchWorker extends ironworks.workers.Worker {
    private updateTimeout: number;
    private streams: IStream[];

    constructor(opts?: ITwitchWorkerOpts) {
        super([
            'iw-socket'
        ], {
            id: ironworks.helpers.idHelper.newId(),
            name: 'twitch-worker'
        });

        var defOpts: ITwitchWorkerOpts = {
            max: 300,
            updateFreq: 60 * 60 * 1000
        };
        this.opts = this.opts.beAdoptedBy<ITwitchWorkerOpts>(defOpts, 'worker');
        this.opts.merge(opts);

        this.streams = [];
    }

    public init(comm, whoService, cb) {
        this.setComm(comm, whoService);
        var instance = this;
        TwitchWorker.download(this.opts.get<number>('max'), (streams) => {
            instance.streams = streams;
            instance.respond<IStreamRequest, IStream[]>('get-streams', (req, respond) => {
                instance.getStreams(req, respond);
            });
            instance.answer('stream-count', (cb) => {
                instance.streamCount(cb);
            });
            cb(null);
        });
    }

    private getStreams(req: IStreamRequest, cb: (e: Error, results?: IStream[]) => void) {
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
    }

    private streamCount(cb: (e: Error, count: number) => void) {
        cb(null, this.streams.length);
    }

    private update() {
        var max = this.opts.get<number>('max');
        var updateFreq = this.opts.get('updateFreq');
        var instance = this;
        TwitchWorker.download(max, (streams) => {
            instance.streams = streams;
            instance.updateTimeout = setTimeout(() => {
                instance.update();
            }, updateFreq);
        });
    }

    private static download(max: number, cb: (streams: any[]) => void, streams?: IStream[]) {
        if (_.isUndefined(streams)) {
            streams = [];
        }
        var offset = streams.length;
        request.get('https://api.twitch.tv/kraken/streams?limit=100&' + offset, (e, res: any) => {
            var current = JSON.parse(res.body);
            _.each(current.streams, (s: any) => {
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
                TwitchWorker.download(max, (s) => {
                    cb(s)
                }, streams);
            }
            else {
                cb(streams);
            }
        });
    }
}

export = TwitchWorker;
