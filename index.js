const process = require('process');
const Ising = require('./lib/Ising');
const Histogram = require('./lib/Histogram');

!async function () {
    let args = process.argv.slice(2);

    if (args.length > 1) {
        throw new Error("Usage: node index.js <GRID-DIM>");
    }

    let grid_dim = args[0];
    const T = 2;

    let N = grid_dim ** 2;
    let model = new Ising({ grid_dim, T });

    model.warmup();

    let num_sweeps = 100;
    let data = [];

    const hist = new Histogram(data);

    for (let i = 0; i < num_sweeps; i++) {
        data.push(model.run_sweep());
        await new Promise((res, rej) => setInterval(res, 100));
    }
}()
