
///<reference path='./node_modules/ironworks/ironworks.d.ts' />

import ironworks = require('ironworks');

enum deadType {
    Celeb,
    Musician,
    Sports
}

interface IDetails {
    cod: string;
    timestamp: number;
    location: string;
}

interface IPersonEntry {
    name: string;
    pictureUrl: string;
    details: IDetails;
}

interface IDeadWorkerOpts {}

class DeadWorker extends ironworks.workers.Worker {
    constructor(opts?: IDeadWorkerOpts) {
        super([
            'iw-socket'
        ], {
            id: ironworks.helpers.idHelper.newId(),
            name: 'dead-worker'
        });

        var defOpts: IDeadWorkerOpts = { };
        this.opts = this.opts.beAdoptedBy<IDeadWorkerOpts>(defOpts, 'worker');
        this.opts.merge(opts);
    }

    public init(comm, whoService, cb) {
        this.setComm(comm, whoService);
        this.respond<deadType, IPersonEntry>('dead', (req, cb) => {
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
    }
}

export = DeadWorker;
