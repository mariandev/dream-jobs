import {WorkerPool} from './WorkerPool';
import {Scheduler} from './Scheduler';

export class Job<TIn, TOut> {
	/** @readonly */
	public readonly JobId: number;

	/** @readonly */
	public readonly JobFn: (args: TIn) => TOut;

	/**
	 * Internal
	 * @hidden
	 */
	private _ready: boolean = false;

	/**
	 * Internal
	 * @hidden
	 */
	private readonly _readyPr: Promise<unknown>;

	constructor(JobFn: (args: TIn) => TOut) {
		this.JobId = JobIdGen.Gen;
		this.JobFn = JobFn;

		this._readyPr = WorkerPool.Instance.RegisterJob(this);
		this._readyPr.then(() => this._ready = true);
		this._readyPr.catch(console.error)
	}

	public async RunWith(args: TIn): Promise<TOut> {
		if(!this._ready) {
			await this._readyPr;
		}

		return Scheduler.Instance.Schedule(this, args);
	}
}

/**
 * Internal
 * @hidden
 */
class JobIdGen {
	private static _id = 0;
	public static get Gen() {
		return JobIdGen._id++;
	}
}
