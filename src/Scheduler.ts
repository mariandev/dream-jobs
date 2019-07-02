import {WorkerPool} from './WorkerPool';
import {Job} from './Job';

export class Scheduler {
	private static _instance: Scheduler;
	public static get Instance(): Scheduler {
		if(!Scheduler._instance) Scheduler._instance = new Scheduler();

		return Scheduler._instance;
	}

	public async Schedule<TIn, TOut>(job: Job<TIn, TOut>, args: TIn): Promise<TOut> {
		const worker = await WorkerPool
			.Instance
			.GetWorker();

		const result = worker
			.Run(job, args);

		result.then(() => {
			WorkerPool.Instance.ReleaseWorker(worker);
		});

		return result;
	}
}