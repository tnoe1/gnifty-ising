const plt = require('nodeplotlib');
const { interval, map } = require('rxjs');

class Histogram {
    constructor(data) {
        this.data = data;

        this.stream$ = interval(100).pipe(
            map(() => [{
                x: this.data,
                type: 'histogram',
                xbins: { 
                    start: 0, 
                    end: Math.max(...this.data),
                    size: 1 
                }
            }])
        );

        this.firstTime = true;
        this.stream$.subscribe(traceData => {
            plt.stackClear();
            plt.plot(traceData, { open: firstTime });
            this.firstTime = false;
            //plt.show();
        });
    }

    //plot() {
    //    plot(this.stream$); 
    //}
}

module.exports = Histogram;
