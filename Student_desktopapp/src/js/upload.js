var fs = require('fs');
var filepath = localStorage.getItem("documentPath") + "/Connexa/recordedVideo/"
var files = fs.readdirSync(filepath);
var list = document.getElementById('saved-files');

const errorMsg = document.getElementById('errorMsg');
const uploadStatus = document.getElementById('uploadStatus');
const uploadbtn = document.getElementById('uploadbtn')
const canclebtn = document.getElementById('uploadcancle')

for (var i = 0; i < files.length; i++) {
    var item = document.createElement('p');
    item.setAttribute("id", i.toString());
    item.innerHTML = files[i];
    item.className = 'filelist'
    list.appendChild(item);
}


var link = document.getElementById("show")
var btn = document.getElementById("saved-files").getElementsByTagName('p')
var data = document.getElementById("data").getElementsByTagName('span')
var btncount = btn.length;

for (var i = 0; i < btncount; i += 1) {
    btn[i].onclick = function() {
        var video = document.getElementById(this.id);
        fs.stat(filepath + video.innerHTML, (err, stats) => {
            console.log(stats)
            data[0].innerHTML = video.innerHTML;
            data[1].innerHTML = stats.birthtime;
            data[2].innerHTML = Math.round(stats.size / 10000) / 100;
        });
        link.click()


    }
}

function cancle() {
    uploadStatus.style.display = 'none'
    uploadbtn.disabled = false;
    errorMsg.innerHTML = '';
    uploadStatus.src = '';
    closePopup();
    setTimeout(() => {
        location.reload();
    }, 200);

}

function upload() {
    if (!(navigator.onLine)) {
        closePopup();
        return;
    }

    var filename = document.getElementById('filename').innerHTML;
    var array = JSON.parse(localStorage.getItem('examdetails'));
    var drivepath;

    uploadbtn.disabled = true;
    canclebtn.disabled = true;
    errorMsg.innerHTML = 'Uploading....';
    uploadStatus.style.display = 'block'
    uploadStatus.src = 'img/icons/uploading.gif';

    for (var i = 0; i < array.length; i++) {
        if (array[i].savedvideo + '.mp4' === filename) {
            drivepath = array[i].videoPath
        }

    }

    console.log(drivepath)
    ipc.send("googleDriveUpload", {
        fileName: filename,
        drivePath: drivepath,
    })

    ipc.on("done", async(event, { errormsg }) => {
        canclebtn.disabled = false;
        if (errormsg == 'noError') {
            errorMsg.innerHTML = "Video Uploaded Successfully";
            uploadStatus.src = 'img/icons/success.png'

            fs.unlink(filepath + filename, function(err) {
                console.log(err);

            });
        } else {
            errorMsg.innerHTML = errormsg;
            uploadStatus.src = 'img/icons/fail.png'

        }

    })
}