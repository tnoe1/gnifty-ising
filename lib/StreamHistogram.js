const plt = require('nodeplotlib');
const { from, map } = require('rxjs');

/**
 * A streaming histogram
 *
 * @property dgp - Data generator function
 */
class StreamHistogram {
    constructor(dgp, { xrange = 511 }={}) {
        this.xrange = xrange;
        this.data = [];
        this.default_layout = {
            xaxis: {
                range: [0, xrange],
            }
        };

        this.stream$ = from(dgp(this)).pipe(
            map((value) => {
                value.context.data.push(value.data['encoding']);

                return [{
                    x: value.context.data,
                    type: 'histogram',
                    xbins: {
                        start: 0,
                        end: Math.max(...[value.context.xrange, Math.max(...value.context.data)]),
                        size: 1
                    }
                }];
            })
        );
    }

    plot() {
        plt.plot(this.stream$, { layout: this.default_layout });
    }
}

class ComparableStreamHistogram {
    constructor(dgp, { xrange = 511, static_data = [] } = {}) {
        this.xrange = xrange;
        this.static_data = static_data;

        // Storage array for the streaming data
        this.streaming_data = [];

        this.default_layout = {
            barmode: 'overlay',
            xaxis: {
                range: [0, Math.max(xrange, this.static_data.length - 1)]
            }
        };

        this.stream$ = from(dgp(this)).pipe(
            map((value) => {
                // Add the new streaming value
                value.context.streaming_data.push(value.data['encoding']);

                // Construct the streaming trace
                const streamingTrace = {
                    x: value.context.streaming_data,
                    type: 'histogram',
                    name: 'Simulated Data',
                    opacity: 0.4,
                    histnorm: 'probability',
                    xbins: {
                        start: 0,
                        end: Math.max(value.context.xrange, value.context.static_data.length-1, Math.max(...value.context.streaming_data)),
                        size: 1
                    }
                };

                // Construct the static trace
                // This remains the same each time, but we return it so nodeplotlib re-renders
                const bar_x = value.context.static_data.map((_, i) => i);
                const staticTrace = {
                    x: bar_x,
                    y: value.context.static_data,
                    type: 'bar',
                    name: 'Theoretical Data',
                    opacity: 1.0
                    // xbins: {
                    //     start: 0,
                    //     end: Math.max(
                    //         value.context.xrange, 
                    //         value.context.static_data.length > 0 ? Math.max(...value.context.static_data) : 0
                    //     ),
                    //     size: 1
                    // }
                };

                return [streamingTrace, staticTrace];
            })
        );
    }

    normalize() {
        this.normalizer = this.streaming_data.reduce((acc, cv, ci, arr) => acc + cv)
        this.normalized_streaming_data = this.streaming_data.map((d) => d / this.normalizer);
    }

    plot() {
        plt.plot(this.stream$, { layout: this.default_layout });
    }
}


module.exports = { ComparableStreamHistogram, StreamHistogram };
