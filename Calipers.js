/*
    Calipers - Measure on-screen elements
    MIT licensed, see the LICENSE file for details.
    Copyright (c) 2018, Eddy Luten
*/
class Measurement {
    constructor(x, y) {
        this.interval = 0;
        this.intervalPt = [x, y];
        this.length = 0;
        this.label = null;
        this.p1 = [];
        this.p2 = [];
    }

    isComplete() {
        return this.p1.length == 2 && this.p2.length == 2;
    }
}

class Calipers {
    keyUp(e) {
        if (e.altKey && e.code == 'KeyC')
            this.toggle();
        if (e.code == 'Escape' && this.visible)
            this.toggle();
    }

    testVisible() {
        this.visible = this.overlay.style.display == 'block';
    }

    distance(p1, p2) {
        return Math.abs(Math.sqrt(
            Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)
        ));
    }

    midpoint(p1, p2) {
        return [
            (p1[0] + p2[0]) / 2.0,
            (p1[1] + p2[1]) / 2.0
        ];
    }

    resize(_e) {
        this.testVisible();
    }

    mouseMove(e) {
        this.mouseX = e.x;
        this.mouseY = e.y;
        if (this.measuring)
            this.draw();
    }

    mouseDown(e) {
        this.testVisible();
        this.measuring = this.visible;
        if (!this.visible) return;
        if (this.current) {
            console.log('CALIPERS: set first point');
            this.current.p1 = [e.x, e.y];
        } else {
            // no current measurement, make one
            console.log('CALIPERS: new measurement');
            this.current = new Measurement(e.x, e.y);
        }
    }

    mouseUp(e) {
        this.measuring = false;
        this.testVisible();
        if (!this.visible) return;
        if (this.current) {
            // interval isn't set, so calculate it
            if (this.current.interval == 0) {
                console.log('CALIPERS: set interval');
                this.current.interval = this.distance(
                    this.current.intervalPt, [e.x, e.y]
                );
                let input = null;
                while (null === input) {
                    let val = prompt(
                        'Enter an interval (must be a number):', '1.0'
                    );
                    if (null === val) {
                        this.current = null;
                        this.draw();
                        return;
                    }
                    val = parseFloat(val);
                    if (!isNaN(val))
                        input = val;
                }
                this.current.interval = input / this.current.interval;
            } else {
                // interval is set, so set the second measurement point
                console.log('CALIPERS: completed measurement');
                this.current.p2 = [e.x, e.y];
                this.current.length = this.current.interval * this.distance(
                    this.current.p1, this.current.p2
                );
                this.measurements.push(this.current);
                this.current = null;
                this.draw();
            }
        }
    }

    draw() {
        this.width = this.overlay.clientWidth;
        this.height = this.overlay.clientHeight;
        this.overlay.width = this.width;
        this.overlay.height = this.height;
        this.context.clearRect(0, 0, this.width, this.height);
        this.drawInstructions();

        if (this.current) {
            // draw some points
            this.context.strokeStyle = 'green';
            this.context.lineWidth = 1;
            this.context.lineCap = 'square';
            this.context.beginPath();
            if (this.current.interval == 0) {
                this.context.moveTo(this.current.intervalPt[0], this.current.intervalPt[1]);
                this.context.lineTo(this.mouseX, this.mouseY);
            } else {
                this.context.moveTo(this.current.p1[0], this.current.p1[1]);
                this.context.lineTo(this.mouseX, this.mouseY);
                this.context.fillStyle = 'black';
                const val = this.current.interval * this.distance(this.current.p1, [this.mouseX,this.mouseY]);
                this.context.fillText(`${val.toFixed(2)}`, this.mouseX + 20, this.mouseY + 20);
            }
            this.context.stroke();
        }

        this.measurements.forEach((measurement) => {
            if (measurement.isComplete()) {
                this.context.strokeStyle = 'red';
                this.context.lineWidth = 2;
                this.context.lineCap = 'square';
                // Draw the caps of the line
                this.context.fillStyle = 'red';
                this.context.beginPath();
                this.context.ellipse(measurement.p1[0], measurement.p1[1], 3, 3, 0, 0, 2 * Math.PI);
                this.context.fill();
                this.context.beginPath();
                this.context.ellipse(measurement.p2[0], measurement.p2[1], 3, 3, 0, 0, 2 * Math.PI);
                this.context.fill();
                // Draw the line
                this.context.beginPath();
                this.context.moveTo(measurement.p1[0], measurement.p1[1]);
                this.context.lineTo(measurement.p2[0], measurement.p2[1]);
                this.context.stroke();
                this.context.fillStyle = 'black';
                const mid = this.midpoint(measurement.p1, measurement.p2);
                this.context.fillText(`${measurement.length.toFixed(2)}`, mid[0], mid[1]);
            }
        });
    }

    drawInstructions() {
        const lines = [
            'Measuring On-Screen Items:',
            '• Click and drag to measure an interval',
            '• Enter a number representing the length of the interval',
            '• Click and drag to measure the entire length'
        ];
        const halfx = this.width/2;

        this.context.font = '16px Helvetica,Arial,sans-serif';
        this.context.strokeStyle = 'black';
        this.context.fillStyle = 'white';

        this.context.fillRect(halfx-250, 20, 500, 100);
        this.context.strokeRect(halfx-250, 20, 500, 100);
        this.context.fillStyle = 'black';
        for (let i = 0; i < lines.length; ++i)
            this.context.fillText(
                lines[i],
                halfx-250+5,
                40 + (22 * i)
            );
    }

    toggle() {
        this.testVisible();
        this.overlay.style.height = '100%';
        this.overlay.style.width = '100%';
        this.overlay.style.display = this.visible ? 'none' : 'block';
        this.testVisible();
        if (this.visible)
            this.draw();
    }

    constructor() {
        this.overlay = null;
        this.context = null;
        this.visible = false;
        this.measurements = [];
        this.current = null;
        this.measuring = false;

        const onPageLoaded = (e) => {
            document.removeEventListener('DOMContentLoaded', onPageLoaded);

            this.overlay = document.createElement('canvas');
            this.overlay.className = 'calipers';
            this.context = this.overlay.getContext('2d');
            this.overlay.addEventListener('mousedown', (e) => this.mouseDown(e));
            this.overlay.addEventListener('mouseup', (e) => this.mouseUp(e));
            this.overlay.addEventListener('mousemove', (e) => this.mouseMove(e));
            document.body.appendChild(this.overlay);

            document.addEventListener('keyup', (e) => this.keyUp(e));
            window.addEventListener('resize', (e) => this.resize(e));
        };

        document.addEventListener('DOMContentLoaded', onPageLoaded);
    }
}
new Calipers();