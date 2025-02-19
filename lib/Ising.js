
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

    get_neighbors(i, j, { spins }={}) {
        // Assumes square grid
        let spin_grid_length;
        if (spins === undefined) {
            spin_grid_length = this.spins.length; 
        } else {
            spin_grid_length = spins.length;
        }

        let candidates = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        let neighbors = [];
        candidates.forEach((c, k, _) => {
            let cy = i + candidates[k][0];
            let cx = j + candidates[k][1];
            if (cy < spin_grid_length && cy >= 0) {
                if (cx < spin_grid_length && cx >= 0) {
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
        return this._compute_energy(this.spins);
    }

    hypothetical_energy(state) {
        return this._compute_energy(state); 
    }

    _compute_energy(state) {
        if (typeof state[0] !== 'object') {
            throw new Error("Expects state object to be 2D");
        }

        let energy = 0;
        for (let i = 0; i < state.length; i++) {
            for (let j = 0; j < state.length; j++) {
                let neighbors = this.get_neighbors(i, j, { spins: state });
                neighbors.forEach((n) => {
                    energy += state[i][j] * state[n[0]][n[1]];
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

    heatbath_step() {
        // Select a spin to mutate. In this model, assuming T(c'->c) = T(c->c')
        let selected = Math.floor(this.N * Math.random());
        let sr = Math.floor(selected / this.grid_dim);
        let sc = selected % this.grid_dim;

        // Determine if we accept the proposed state change
        if (1 / (1 + Math.exp((1/this.T) * this.induced_delta_e(sr, sc))) > Math.random()) {
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

    /**
     * Decode a system state encoding
     */
    decoding(enc, length) {
        let bin_arr = enc.toString(2).split("");
        bin_arr = [...(new Array(length - bin_arr.length)).fill('0'), ...bin_arr];

        let state_vec = [];
        for (let i = 0; i < length; i++) {
            state_vec.push(bin_arr[i] === '1' ? 1 : -1);
        }

        // If the state vec is a square number, assume that a square
        // state encoding is more convenient.
        const EPS = 1e-8;
        let proposed_grid_dim = Math.sqrt(state_vec.length);
        if (Math.round(proposed_grid_dim) - proposed_grid_dim < EPS) {
            let grid_dim = Math.round(proposed_grid_dim);
            let spins = [];
            for (let i = 0; i < grid_dim; i++) {
                spins.push([]);
                for (let j = 0; j < grid_dim; j++) {
                    spins[i].push(state_vec[grid_dim * i + j]);
                }
            }

            state_vec = spins;
        }

        return state_vec;
    }

    /**
     * Run a "sweep" through the simulation (N steps)
     */
    run_sweep() {
        for (let i = 0; i < this.N; i++) {
            this.heatbath_step();
        }

        return { 
            energy: this.current_energy(),
            encoding: this.encoding()
        }
    }

    /**
     * Warmup to run before data collection starts
     */ 
    warmup({ warmup_sweeps = 10 }={}) {
        // Equilibration time. Let MCMC warm up
        for (let i = 0; i < warmup_sweeps; i++) {
            this.run_sweep();
        }
    }

    /**
     * Compute the (unnormalized) theoretical probability of a state given its energy
     */
    probability(energy) {
        return Math.exp(-(1/this.T) * energy);
    }

    /**
     * Normalize the given distribution 
     */
    normalize(probabilities) {
        let sum = probabilities.reduce((acc, cv, ci, arr) => acc + cv);
        return probabilities.map((p) => p / sum);
    }

    /**
     * Compute theoretical distribution
     */
    compute_theoretical() {
        let energies = [];
        let probabilities = [];
        for (let i = 0; i < 2**this.N; i++) {
            energies.push(this.hypothetical_energy(this.decoding(i, this.N)));
            probabilities.push(this.probability(energies[i]));
        }

        return this.normalize(probabilities);
    }

    /**
     * For an LxL grid, gets indices of a given color. A specific
     * example is given below for L=5. The pattern generalizes. 
     *  _ _ _ _ _
     * |R B R B G|
     * |B R B R Y|
     * |R B R B G|
     * |B R B R Y|
     * |G Y G Y R|
     *  " " " " "
     *
     * @param {String} color - "B", "G" "R", or "Y"
     */
    get_color_indices(color) {
        console.log(this.grid_dim);
        let indices = [];
        for (let i = 0; i < this.grid_dim; i++) {
            for (let j = 0; j < this.grid_dim; j++) {
                switch (color) {
                    case "B":
                        if ((i !== this.grid_dim - 1) && (j !== this.grid_dim - 1) && (i % 2 !== j % 2)) {
                            indices.push([i, j]);
                        }
                        break;
                    case "R":
                        if ((i === this.grid_dim - 1 && j === this.grid_dim - 1) || ((i !== this.grid_dim - 1) && (j != this.grid_dim - 1) && (i % 2 === j % 2))) {
                            indices.push([i, j]);
                        }
                        break;
                    case "G":
                        if (!(i === this.grid_dim - 1 && j === this.grid_dim - 1) && ((i === this.grid_dim - 1 && j % 2 === 0) || (j === this.grid_dim - 1 && i % 2 === 0))) {
                            indices.push([i, j]);
                        }
                        break;
                    case "Y":
                        if (!(i === this.grid_dim - 1 && j === this.grid_dim - 1) && ((i === this.grid_dim - 1 && j % 2 !== 0) || (j === this.grid_dim - 1 && i % 2 !== 0))) {
                            indices.push([i, j]);
                        }
                        break;
                    default:
                        console.error("Invalid color specified");
                        return;
                }
            }
        }

        return indices;
    }
}

module.exports = Ising;
