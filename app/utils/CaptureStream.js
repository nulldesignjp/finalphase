/*
  iPhone16
  884 * 1920
*/

export default class CaptureStream {
    constructor(_canvas, _fps = 60) {
        this.canvas = _canvas;
        this.fps = _fps
        this.isRec = false

        //  button
        // this.button = document.createElement('button');
        // document.body.appendChild( this.button )
        // this.button.style.position = 'fixed'
        // this.button.style.right = '16px'
        // this.button.style.top = '32px'
        // this.button.style.cursor = 'pointer';
        // this.button.style.zIndex = 100;
        // this.button.textContent = 'Rec'


        // let _isRec = false;
        // this.button.addEventListener('click',()=>{
        //   _isRec = !_isRec;

        //   if( _isRec )
        //   {
        //     this.button.textContent = 'now Recording....'
        //     this.rec();
        //   } else {
        //     this.button.textContent = 'Rec'
        //     this.stop()
        //   }
        // })

    }

    toggle() {
        if (this.isRec) {
            this.isRec = false;
            this.stop();
        } else {
            this.isRec = true;
            this.rec();
        }
    }

    rec() {
        this.recordedChunks = [];
        // Optional frames per second argument.
        this.stream = this.canvas.captureStream(this.fps); // 60fps

        const options = { mimeType: "video/mp4; codecs=avc1.42E01E", videoBitsPerSecond: 512000 * 2.0 * 10.0 };  // 512kbits / sec
        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
        this.mediaRecorder.start();
    }

    stop() {
        if (!this.mediaRecorder) return;
        this.mediaRecorder.stop();
    }

    handleDataAvailable(event) {
        if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
            // console.log(this.recordedChunks);
            this.download();
        } else {
            // …
            console.log('event data size is ZERO.')
        }
    }

    download() {
        const blob = new Blob(this.recordedChunks, {
            // type: "video/webm",
            type: "video/mp4",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "Generate-movie" + Date.now() + ".mp4";
        a.click();
        window.URL.revokeObjectURL(url);
    }

    dispose() {
        if (this.mediaRecorder) {
            this.mediaRecorder.ondataavailable = null;
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.mediaRecorder = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // if( this.button )
        // {
        //   document.body.removeChild( this.button );
        //   this.button = null;
        // }
    }
}
