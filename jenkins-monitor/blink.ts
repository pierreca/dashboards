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
    }
    
    public start(led : number) {
        this.led = led;
        
        this.interval = setInterval(function () {
            this.currentIntensity += this.increment * this.direction;
            if (this.currentIntensity >= 255) this.direction = -1;
            else if (this.currentIntensity <= 0) this.direction = +1;
            
            this.ledStrip.setPixelRGB(this.led, 0, 0, this.currentIntensity);
            this.ledStrip.update();
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