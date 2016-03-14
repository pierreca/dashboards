export class Blinker {
    private interval: any;
    private led: number;
    private direction: number;
    private increment: number;
    private currentIntensity: number;
    
    public constructor (private ledStrip: any) {
        this.direction = 1;
        this.increment = 1;
        this.currentIntensity = 0;
        this.interval = null;
    }
    
    public start(led : number) {
        this.led = led;
        var self = this;
        this.interval = setInterval(function () {
            self.currentIntensity += self.increment * self.direction;
            if (self.currentIntensity >= 255) self.direction = -1;
            else if (self.currentIntensity <= 0) self.direction = +1;
            
            self.ledStrip.setPixelRGB(self.led, 0, 0, self.currentIntensity);
            self.ledStrip.update();
        }, 1);
    }
    
    public stop() {
        clearInterval(this.interval);
        this.interval = null;
        this.led = -1;
    }
    
    public isBlinking(): boolean {
        return this.interval !== null;
    }
}