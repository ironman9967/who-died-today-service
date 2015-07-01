
///<reference path='./node_modules/ironworks/ironworks.d.ts' />
///<reference path='./typings/request/request.d.ts' />

import _ = require('lodash');

import ironworks = require('ironworks');
import request = require('request');

interface IStreamRequest {
    limit: number;
    offset?: number;
}

interface IStream {
    id: number;
    game: string;
    viewers: number;
    preview: string;
    displayName: string;
    logo: string;
    statusMessage: string;
    url: string;
    followers: number;
    views: number;
}

interface IDeadWorkerOpts {
    max: number;
    updateFreq: number;
}

class DeadWorker extends ironworks.workers.Worker {
    private updateTimeout: number;
    private streams: IStream[];

    constructor(opts?: IDeadWorkerOpts) {
        super([
            'iw-socket'
        ], {
            id: ironworks.helpers.idHelper.newId(),
            name: 'dead-worker'
        });

        var defOpts: IDeadWorkerOpts = {
            max: 300,
            updateFreq: 60 * 60 * 1000
        };
        this.opts = this.opts.beAdoptedBy<IDeadWorkerOpts>(defOpts, 'worker');
        this.opts.merge(opts);

        this.streams = [];
    }

    public init(comm, whoService, cb) {
        this.setComm(comm, whoService);
        var instance = this;
        DeadWorker.download(this.opts.get<number>('max'), (streams) => {
            instance.streams = streams;
            instance.respond<IStreamRequest, IStream[]>('dead', (req, respond) => {
                if (_.isUndefined(req.offset)) {
                    req.offset = 0;
                }
                if (_.isUndefined(req.offset)) {
                    req.limit = 5;
                }
                if (req.offset > instance.streams.length) {
                    respond(new Error("only have " + instance.streams.length + " streams."));
                }
                else {
                    respond(null, _.take(instance.streams.slice(req.offset), req.limit));
                }
            });
            cb(null);
        });
    }

    private update() {
        var max = this.opts.get<number>('max');
        var updateFreq = this.opts.get('updateFreq');
        var instance = this;
        DeadWorker.download(max, (streams) => {
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
                DeadWorker.download(max, (s) => {
                    cb(s)
                }, streams);
            }
            else {
                cb(streams);
            }
        });
    }
}

export = DeadWorker;
