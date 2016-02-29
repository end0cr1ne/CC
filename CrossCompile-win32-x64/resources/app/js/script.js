var fs = require('fs');
var path = require('path');
var mime = require('mime');

var tab = new Controller({
    selector:'edit',
    default:'function myScript(){return 100;}\n',
    mode:'javascript'
});
var dir = './';
fs.readdir(dir, function(error, files) {
    if (error) {
        console.log(error);
        return;
    }

    for (var i = 0; i < files.length; ++i) {
        files[i] = (function(){
            console.log(this.dir,files[i]);
            var fpath = path.join(this.dir, files[i]);
            var file = {
                path: fpath,
                name: path.basename(files[i])
            };
            if(fs.statSync(fpath).isDirectory())
            {
                file.is = 'dir';
                file.img = 'icons/dir.png'
            }
            else{
                file.is = 'file';

                try{
                    fs.statSync('icons/'+path.extname(fpath).substr(1)+'.png');
                    file.img = 'icons/'+path.extname(fpath).substr(1)+'.png';
                }catch(err){
                        if(mime.lookup(fpath).search('image')!=-1)file.img = 'icons/img.png';
                        else if(mime.lookup(fpath).search('video')!=-1)file.img = 'icons/video.png';
                        else file.img = 'icons/generic.png';
                    }
            }
            return file;
        })();
    }
    var menu = document.createElement('paper-menu');
    for (var i = 0; i < files.length; ++i) {
        console.log(files[i]);
        if(files[i].is==='dir'){
            var dir = document.createElement('paper-submenu');
            var name = document.createElement('paper-item');
            var icon = document.createElement('img');
            icon.classList.add('icon');
            icon.src=files[i].img;
            name.appendChild(icon);
            name.appendChild(document.createTextNode(' '+files[i].name));
            dir.appendChild(name);
            menu.appendChild(name);
        }else{
            var name = document.createElement('paper-item');
            var icon = document.createElement('img');
            icon.classList.add('icon');
            icon.src=files[i].img;
            name.appendChild(icon);
            name.appendChild(document.createTextNode(' '+files[i].name));
            menu.appendChild(name);
        }
    }
    document.querySelector('#explorer').appendChild(menu);
});

