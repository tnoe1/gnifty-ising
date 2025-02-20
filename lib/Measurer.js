const Ising = require("./Ising");
const plt = require("nodeplotlib");

class Measurer {
    static autocorrelate(d1, d2) {
        return d1.reduce((acc, val, i, _) => acc += val * d2[i]);
    }

    static async plot_state_progression(grid_dim, T_start, T_stop) {
        const NUM_STEPS = 100;
        let dT = (T_stop - T_start) / NUM_STEPS;

        let T_vals = Array(NUM_STEPS + 1).fill(0).map((_, i) => T_start + i * dT); 

        for (const T of T_vals) {
            const EPS = 1e-2;

            let model = new Ising({ grid_dim, T });
            let data = [];
            for (let i = 0; i < 500; i++) {
                data.push(model.run_sweep().encoding);
            }

            const plot_data = [
                {
                    x: new Array(data.length).fill(0).map((_, i) => i),
                    y: data,
                    type: 'scatter',
                    title: `T=${T}`
                }
            ];

            plt.plot(plot_data, { title: `T=${T.toFixed(3)}` });
        }

        // for (const T of T_vals) {
        //     let done = false;
        //     let num_sweeps = 1;
        //     while (!done) {
        //         let model = new Ising({ grid_dim, T });
        //         model.warmup();

        //         let theoretical = model.compute_theoretical();
        //         let experimental = model.compute_experimental_distribution({ num_sweeps });

        //         let matched = this.autocorrelate(theoretical, theoretical);

        //         if (this.autocorrelate(theoretical, experimental) > matched - EPS || num_sweeps > 100) { // || num_sweeps > 1000) {
        //             done = true; 
        //         } else {
        //             num_sweeps += 1;
        //         }
        //     }

        //     console.log(`For T = ${T.toFixed(3)}, autocorrelation time is ${num_sweeps > 100 ? "NA" : num_sweeps}`); 
        // }
    }
}

module.exports = Measurer;
