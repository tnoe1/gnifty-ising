const process = require('process');
const Ising = require('./lib/Ising');

!async function () {
    let args = process.argv.slice(2);

    if (args.length > 1) {
        throw new Error("Usage: node index.js <GRID-DIM>");
    }

    let grid_dim = args[0];
    let model = new Ising({ grid_dim });

    // TODO: Implement MCMC
}()
