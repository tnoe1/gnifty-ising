const Ising = require("./Ising");
const plt = require("nodeplotlib");

class Measurer {
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

    }

    static compute_sample_mean(seq) {
        let N = seq.length;
        return (1 / N) * seq.reduce((acc, val, i, _) => acc + val, 0);
    }

    static compute_offset_autocorrelation(seq, tau, mu) {
        return (1 / (seq.length - tau)) * seq.reduce((acc, val, i, arr) => acc + (val - mu) * (arr[(i + tau) % arr.length] - mu), 0);
    }

    // Special thanks to https://dfm.io/posts/autocorr    
    static compute_autocorrelation_time(seq) {
        let M = Math.floor(seq.length / 10);
        let mu = this.compute_sample_mean(seq);
        let rho_naught = this.compute_offset_autocorrelation(seq, 0, mu);
        let rho_vec = new Array(seq.length).fill(0).map((_, i) => this.compute_offset_autocorrelation(seq, i+1, mu) / rho_naught);
        return rho_vec.reduce((acc, val, i, _) => i < M ? acc + 2 * val : acc, 1);
    }

    static plot_autocorrelation_time(grid_dim, T_start, T_stop) {
        const NUM_SWEEPS = 1000;
        const NUM_STEPS = 100;
        let dT = (T_stop - T_start) / NUM_STEPS;
        let T_vals = Array(NUM_STEPS + 1).fill(0).map((_, i) => T_start + i * dT); 

        // Not to be confused with the Acts of the Apostles...
        let acts = [];
        for (const T of T_vals) {
            let model = new Ising({ grid_dim, T });

            let data = [];
            for (let i = 0; i < NUM_SWEEPS; i++) {
                data.push(model.run_sweep().encoding);
            }

            //console.log(`T = ${T}`);
            //console.log('data: ', data);

            acts.push(this.compute_autocorrelation_time(data));
        }

        const plot_data = [
            {
                x: T_vals,
                y: acts,
                type: 'scatter',
            }
        ];

        plt.plot(plot_data, { title: `Autocorrelation Times` });
    }
}

module.exports = Measurer;
