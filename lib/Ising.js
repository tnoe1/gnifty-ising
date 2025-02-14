
class Ising {
    constructor({ grid_dim = 32, J = 1, T = 1 }={}) {
        this.grid_dim = grid_dim;
        this.N = this.grid_dim ** 2;
        this.J = J;
        this.T = T;
        this.initialize_states();
    }

    initialize_states() { 
        this.spins = [];
        for (let i = 0; i < this.grid_dim; i++) {
            this.spins.push([]);
            for (let j = 0; j < this.grid_dim; j++) {
                this.spins[i].push(Math.random() > 0.5 ? 1 : -1);
            }
        }
    }

    get_neighbors(i, j) {
        let candidates = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        let neighbors = [];
        candidates.forEach((c, k, _) => {
            let cy = i + candidates[k][0];
            let cx = j + candidates[k][1];
            if (cy < this.spins.length && cy >= 0) {
                if (cx < this.spins[0].length && cx >= 0) {
                    neighbors.push([cy, cx]);
                }
            }
        });

        return neighbors;
    }

    /**
     * Compute the total energy of the current configuration.
     * Assumes that there is no external magnetic field.
     */
    current_energy() { 
        let energy = 0;
        for (let i = 0; i < this.grid_dim; i++) {
            for (let j = 0; j < this.grid_dim; j++) {
                let neighbors = this.get_neighbors(i, j);
                neighbors.forEach((n) => {
                    energy += this.spins[i][j] * this.spins[n[0]][n[1]];
                });
            }
        }

        return -this.J * energy;
    }

    /**
     * Toggle the spin of a particle.
     * 
     * @param i The row of the particle whose spin gets toggled
     * @param j The column of the particle whose spin gets toggled
     */
    toggle_spin(i, j) {
        this.spins[i][j] = this.spins[i][j] === 1 ? -1 : 1;
    }

    /**
     * Compute the change in energy caused by a single spin flip.
     * Does not mutate the configuration state.
     * 
     * @param i The row of the particle whose spin gets changed
     * @param j The column of the particle whose spin gets changed
     */
    induced_delta_e(i, j) {
        let neighbors = this.get_neighbors(i, j);
        let h_spin = this.spins[i][j] === 1 ? -1 : 1;
        let old_e = 0;
        let new_e = 0;

        neighbors.forEach((n) => {
            // 2 times because spins are coupled both ways
            old_e += 2 * this.spins[i][j] * this.spins[n[0]][n[1]];
            new_e += 2 * h_spin * this.spins[n[0]][n[1]];
        });

        return -this.J * (new_e - old_e);
    }

    /**
     * Mutate the model using a Markov Chain Monte Carlo (MCMC) step.
     *
     */
    step() {
        // Select a spin to mutate. In this model, assuming T(c'->c) = T(c->c')
        let selected = Math.floor(this.N * Math.random());
        let sr = Math.floor(selected / this.grid_dim);
        let sc = selected % this.grid_dim;

        // Determine if we accept the proposed state change
        if (Math.exp(-(1/this.T) * this.induced_delta_e(sr, sc)) > Math.random()) {
            this.toggle_spin(sr, sc);
        } 
    }

    /**
     * Get integer encoding of current configuration
     */
    encoding() {
        let states = [];
        for (let i = 0; i < this.grid_dim; i++) {
            for (let j = 0; j < this.grid_dim; j++) {
                this.spins[i][j] === 1 ? states.push(1) : states.push(0)
            }
        }

        return parseInt(states.join(""), 2);
    }

    decode_state(enc) {
        let bin_str = enc.toString(2);
        let state_vec = [];
        for (let i = 0; i < bin_str.length; i++) {
            state_vec.push(bin_str[i] === '1' ? 1 : -1);
        }

        return state_vec;
    }

    /**
     * Run a "sweep" through the simulation (N steps)
     */
    run_sweep() {
        for (let i = 0; i < this.N; i++) {
            this.step();
        }

        return { 
            energy: this.current_energy(),
            encoding: this.encoding()
        }
    }

    /**
     * Warmup to run before data collection starts
     */ 
    warmup({ warmup_sweeps = 20 }={}) {
        // Equilibration time. Let MCMC warm up
        for (let i = 0; i < warmup_sweeps; i++) {
            this.run_sweep();
        }
    }

    /**
     * Compute theoretical distribution
     */
    compute_theoretical() {
        for (let i = 0; i < 2**this.N; i++) {
            // TODO: Use decode state
        }
    }
}

module.exports = Ising;
