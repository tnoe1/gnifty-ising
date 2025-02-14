const process = require('process');
const Ising = require('./lib/Ising');
const StreamHistogram = require('./lib/StreamHistogram');

!async function () {
    let args = process.argv.slice(2);

    if (args.length < 1 || args.length > 2) {
        throw new Error("Usage: node index.js <GRID-DIM> <VIS-FLAG>");
    }

    let grid_dim = args[0];
    let visualize = !!args[1];

    const T = 2;
    const STEP_TIME = 0; // ms

    let N = grid_dim ** 2;
    let model = new Ising({ grid_dim, T });

    model.warmup();

    let num_sweeps = 1000;
    let data = [];
    
    if (visualize && grid_dim <= 3) {
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
    } else {
        const start = Date.now();
        for (let i = 0; i < num_sweeps; i++) {
            data.push(model.run_sweep());
        }

        console.log(`${num_sweeps} sweeps on a grid of size ${grid_dim}x${grid_dim} took ${(Date.now() - start) / 1000} seconds`);
    }

    let theoretical_start = Date.now();
    let theoretical_energies = model.compute_theoretical();
    console.log(`Theoretical calulations on a grid of size ${grid_dim}x${grid_dim} took ${(Date.now() - theoretical_start) / 1000} seconds to complete`);

    console.log(theoretical_energies);
}()
