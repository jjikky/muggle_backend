exports.mime = {
    '.jpg': ['image/jpeg', 'image/pjpeg'],
    '.jpeg': ['image/jpeg'],
    '.jfif': ['image/jpeg'],
    '.tif': ['image/tiff'],
    '.tiff': ['image/tiff'],
    '.gif': ['image/gif'],
    '.png': ['image/png', 'image/x-png'],
    '.3gp': ['video/mp4', 'video/3gp', 'video/3gpp', 'application/octet-stream', 'video/quicktime', 'video/mpeg', 'video/x-m4v'],
    '.3gpp': ['video/mp4', 'video/3gp', 'video/3gpp', 'application/octet-stream', 'video/quicktime', 'video/mpeg', 'video/x-m4v'],
    '.avi': ['video/x-msvideo', 'video/msvideo', 'video/avi', 'application/x-troff-msvideo'],
    '.mov': ['video/mp4', 'video/3gp', 'video/3gpp', 'application/octet-stream', 'video/quicktime', 'video/mpeg', 'video/x-m4v'],
    '.mp4': ['video/mp4', 'video/3gp', 'video/3gpp', 'application/octet-stream', 'video/quicktime', 'video/mpeg', 'video/x-m4v'],
}
exports.ext = {
    image: ['.jpg',
        '.jpeg',
        '.jfif',
        '.tif',
        '.tiff',
        '.gif',
        '.png',
    ],
    video: [
        '.3gp',
        '.3gpp',
        '.avi',
        '.mov',
        '.mp4',
    ]
}
// {'video':'video/3gpp'}
// video:[
//     'mp3'
//
// ]}

// image/webp
// image/bmp
// image/png
