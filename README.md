### Offload computationally heavy tasks to Web Workers in supported browsers
###### Unsupported browsers will run the jobs on the main thread automatically

### Examples

```javascript
const AddNumbers = new Job(function(args) {
	let sum = 0;
	for(const arg of args) {
		sum += arg;
	}
	return sum;
});

AddNumbers
	.Schedule([1, 2, 3, 4, 5])
	.then(function(sum) {
		console.log(sum);
	});
```

```javascript
const NthFibonacci = new Job(function(n) {
	const one = BigInt(1);
	if(n <= 2) return one;
	let a = one, b = one;

	for(let i = 2;i < n; i++) b = a + (a = b);

	return b;
});

NthFibonacci
	.Schedule(10)
	.then(function(nthFibonacci) {
		console.log(nthFibonacci);
	});

NthFibonacci
	.Schedule(10000)
	.then(function(nthFibonacci) {
		console.log(nthFibonacci);
	});
```