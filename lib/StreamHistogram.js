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

module.exports = StreamHistogram;
