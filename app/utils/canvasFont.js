export default class canvasFont {
    constructor(font, text) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.font = font;
        this.text = text;
        this.init();
    }

    init() {

        this.texts = this.text.split('\n');

        let _offsetBase = this.getTextOffsets(this.font);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top'
        this.ctx.font = this.font;
        this.ctx.fillStyle = '#000000';

        const metrics = this.ctx.measureText(this.text);
        metrics.width; // 横幅
        metrics.actualBoundingBoxAscent;
        metrics.actualBoundingBoxDescent;
        metrics.actualBoundingBoxLeft;
        metrics.actualBoundingBoxRight;

        const _size = document.pixelRatio || 2;

        this.canvas.width = Math.ceil(metrics.width) * _size;
        const topPad = Math.max(0, -_offsetBase.y);
        this.canvas.height = Math.ceil(
            metrics.actualBoundingBoxAscent +
            metrics.actualBoundingBoxDescent +
            topPad +
            2
        ) * _size;

        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top'
        this.ctx.font = this.font;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(this.text, _offsetBase.x, _offsetBase.y);

    }

    getTextOffsets(font) {

        var tempCanvasWidth = 30;
        var tempCanvasHeight = 50;
        var tempCanvas = document.createElement("canvas");
        tempCanvas.setAttribute("width", tempCanvasWidth);
        tempCanvas.setAttribute("height", tempCanvasHeight);

        var tempContext = tempCanvas.getContext("2d");
        tempContext.fillStyle = "#ffffff";
        tempContext.textBaseline = "top";
        tempContext.font = font;
        tempContext.fillText("F", 0, 0);

        var imageData = tempContext.getImageData(0, 0, tempCanvasWidth, tempCanvasHeight);
        var pixelData = imageData.data;
        var pixelWidth = 4;
        var alphaCutoff = 127;

        for (let i = 0; i < pixelData.length; i += pixelWidth) {
            if (pixelData[i + 3] > alphaCutoff) {
                const x = (i / 4) % tempCanvasWidth;
                const y = Math.floor(i / 4 / tempCanvasWidth);
                return { x: -x, y: -y };
            }
        }
        return { x: 0, y: 0 };
    }
}