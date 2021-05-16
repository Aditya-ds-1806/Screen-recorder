const { desktopCapturer, ipcRenderer } = require('electron');
const { writeFile } = require('fs');
let mediaRecorder, videoChunks = [];

window.addEventListener('DOMContentLoaded', async () => {
    const start = document.querySelector('#start');
    const stop = document.querySelector('#stop');
    const refresh = document.querySelector('#refresh');
    const spinner = document.querySelector('.spinner-grow');
    const showThumbnails = (sources) => {
        sources.forEach(source => {
            const div = document.createElement('div');
            const figure = document.createElement('figure');
            const img = document.createElement('img');
            const caption = document.createElement('figcaption');
            div.classList.add('col-2', 'text-center');
            figure.classList.add('figure');
            caption.classList.add('figure-caption', 'text-center', 'd-inline-block');
            img.classList.add('figure-img', 'img-fluid');
            img.src = URL.createObjectURL(new Blob([source.thumbnail.toPNG()], { type: 'image/png' }));
            img.alt = source.name;
            img.id = source.id;
            caption.textContent = source.name.length > 50 ? `${source.name.substring(0, 50)}...` : source.name;
            figure.append(img, caption);
            img.style.cursor = 'pointer';
            img.addEventListener('click', async function () {
                document.querySelector('.active-window')?.classList.remove('active-window');
                this.classList.add('active-window');
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: img.id,
                            minWidth: 4096,
                            maxWidth: 4096,
                            minHeight: 2160,
                            maxHeight: 2160
                        }
                    }
                });
                const video = document.querySelector('video');
                video.srcObject = stream;
                video.onloadedmetadata = () => video.play();
                mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=opus'
                });

                mediaRecorder.ondataavailable = (e) => {
                    console.log('data available');
                    console.log(e.data);
                    videoChunks.push(e.data);
                }

                mediaRecorder.onstop = async (e) => {
                    const videoBlob = new Blob(videoChunks, {
                        type: 'video/webm;codecs=opus'
                    });
                    const buffer = Buffer.from(await videoBlob.arrayBuffer());
                    const filePath = await ipcRenderer.invoke('dialog');
                    console.log(filePath);
                    writeFile(filePath, buffer, () => console.log('video saved'));
                    videoChunks = [];
                }
            });
            div.append(figure);
            document.querySelector('#windows').append(div);
        });
    }

    const getMediaSources = () => {
        return desktopCapturer.getSources({
            types: ['screen', 'window'],
            fetchWindowIcons: true,
        });
    }

    showThumbnails(await getMediaSources());

    start.addEventListener('click', () => {
        mediaRecorder.start();
        document.querySelector('#start span').textContent = 'Recording...';
        spinner.classList.remove('d-none');
    });

    stop.addEventListener('click', () => {
        mediaRecorder.stop();
        document.querySelector('#start span').textContent = 'Start';
        spinner.classList.add('d-none');
    });

    refresh.addEventListener('click', async () => {
        document.querySelector('#windows').innerHTML = '';
        showThumbnails(await getMediaSources());
    });
});
