import {Job} from './Job';

/**
 * Internal
 * @hidden
 */
type CommandType = "register" | "process";

/**
 * Internal
 * @hidden
 */
type CommandArgs<TIn> = {
	jobId: number,
	jobArgs: TIn
};

/**
 * Internal
 * @hidden
 */
type Command<TIn> = {
	type: CommandType,
	args: CommandArgs<TIn>
}

/**
 * Internal
 * @hidden
 */
export abstract class BaseWorker {
	protected abstract SendCommand<TIn, TOut>(command: CommandType, args: CommandArgs<TIn>): Promise<TOut>;

	public RegisterJob(job: Job<unknown, unknown>): Promise<unknown> {
		return this.SendCommand("register", {
			jobId: job.JobId,
			jobArgs: job.JobFn.toString()
		});
	}

	public Run<TIn, TOut>(job: Job<TIn, TOut>, jobArgs: TIn): Promise<TOut> {
		return this.SendCommand<TIn, TOut>("process", {
			jobId: job.JobId,
			jobArgs
		});
	}
}

/**
 * Internal
 * @hidden
 */
export class WebWorker extends BaseWorker {
	private static WorkerScript = function() {
		const jobs: {[jobId: number]: (args: unknown) => unknown} = {};
		const fnBreaker = /function\s*\((.*)\)\s*{([^]*)}/gi;

		function send(msg = undefined) {
			postMessage(msg);
		}

		self.addEventListener("message", (e: MessageEvent) => {
			const {type, args}: Command<unknown> = e.data;

			switch (type) {
				case 'register':
					const [, ...fnArgs] = fnBreaker.exec(args.jobArgs as string);
					if(fnArgs.length !== 2) throw new Error(`Provided function for job #${args.jobId} has an unsupported syntax.\nPlease write the functions as follows "function(args) {}".\nMultiple arguments and arrow functions are not supported.`);
					jobs[args.jobId] = new Function(...fnArgs) as (args: unknown) => unknown;

					send();
					break;
				case 'process':
					const maybeResult = jobs[args.jobId](args.jobArgs);

					Promise.resolve(maybeResult)
						.then(result => send(result))
						.catch(console.error);
					break;
			}
		});
	};
	private static WorkerScriptSerialized = `(${WebWorker.WorkerScript.toString()})()`;

	private readonly _worker: Worker;

	private _resolveTask: Function;

	constructor() {
		super();
		this._worker = new Worker(URL.createObjectURL(new Blob([
			WebWorker.WorkerScriptSerialized
		], {type: "application/javascript"})));

		this._worker.addEventListener("message", (e: MessageEvent) => {
			this._resolveTask(e.data);
		});
	}

	protected SendCommand<TIn, TOut>(command: CommandType, args: CommandArgs<TIn>): Promise<TOut> {
		return new Promise<TOut>(resolve => {
			this._resolveTask = resolve;

			this._worker.postMessage({
				type: command,
				args
			})
		});
	}
}

/**
 * Internal
 * @hidden
 */
export class MainThreadWorker extends BaseWorker {
	private _jobs: {[jobId: number]: (args: unknown) => unknown} = {};

	protected SendCommand<TIn, TOut>(command: CommandType, args: CommandArgs<TIn>): Promise<TOut> {
		switch(command) {
			case 'process':
				return Promise.resolve(this._jobs[args.jobId](args.jobArgs) as TOut);
		}
	}

	public RegisterJob(job: Job<unknown, unknown>) {
		this._jobs[job.JobId] = job.JobFn;
		return Promise.resolve<unknown>(null);
	}
}
