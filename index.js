const process = require('process');
const Ising = require('./lib/Ising');
const StreamHistogram = require('./lib/StreamHistogram');

!async function () {
    let args = process.argv.slice(2);

    if (args.length > 1) {
        throw new Error("Usage: node index.js <GRID-DIM>");
    }

    let grid_dim = args[0];
    const T = 2;
    const STEP_TIME = 0; // ms

    let N = grid_dim ** 2;
    let model = new Ising({ grid_dim, T });

    model.warmup();

    let num_sweeps = 10000;
    let data = [];
    
    const runSweeps = async function* (ctx) {
        for (let i = 0; i < num_sweeps; i++) {
            await new Promise((res, rej) => setInterval(res, STEP_TIME));
            yield {
                context: ctx,
                data: model.run_sweep()
            };
        }
    }

    const hist = new StreamHistogram(runSweeps);
    hist.plot();
}()
