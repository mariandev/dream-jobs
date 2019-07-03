import {Job} from './Job';
import {MainThreadWorker, BaseWorker, WebWorker} from "./Worker";

export class WorkerPool {
	private static _instance: WorkerPool;
	public static get Instance(): WorkerPool {
		if(!WorkerPool._instance) WorkerPool._instance = new WorkerPool();

		return WorkerPool._instance;
	}

	private readonly _workers: ReadonlyArray<BaseWorker> = [];
	private readonly _availableWorkers: BaseWorker[] = [];

	private _workerRequestQueue: ((worker: BaseWorker) => void)[] = [];

	constructor() {
		const workers = [] as BaseWorker[];
		if(typeof window["Worker"] === "undefined") {
			workers.push(new MainThreadWorker())
		} else {
			const cores = navigator && navigator.hardwareConcurrency || 4;

			for(let i = 0;i < cores; i++) {
				workers.push(new WebWorker());
			}
		}

		this._workers = workers;
		this._availableWorkers = [...workers];
	}


	public async RegisterJob<TIn, TOut>(job: Job<TIn, TOut>) {
		const results = [] as Promise<unknown>[];
		for(let worker of this._workers) {
			results.push(
				worker.RegisterJob(job)
			)
		}
		return Promise.all(results);
	}

	public GetWorker(): Promise<BaseWorker> {
		if(this._availableWorkers.length) {
			return Promise.resolve(this._availableWorkers.shift());
		} else {
			return new Promise(resolve => {
				this._workerRequestQueue.push(resolve);
			});
		}
	}

	public ReleaseWorker(worker: BaseWorker) {
		if(this._workerRequestQueue.length) {
			this._workerRequestQueue.shift()(worker);
		} else {
			this._availableWorkers.push(worker);
		}
	}
}